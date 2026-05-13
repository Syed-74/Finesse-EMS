import Attendance from "../models/attendance.model.js";
import Shift from "../models/shift.model.js";
import LeaveApplication from "../models/LeaveApplication.model.js";
import Employee from "../models/Employee.model.js";
import Regularization from "../models/regularization.model.js";
import AuditLog from "../models/auditLog.model.js";
import { validateAttendanceLocation } from "../services/attendanceValidation.service.js";

/* =========================
   PUNCH IN
========================= */
export const punchIn = async (req, res) => {
  try {
    const employeeId = req.employee._id;
    console.log(`🚀 Punch-in Attempt: ${req.employee.email}`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 0. Fetch Employee with Shift
    let employeeProfile = await Employee.findById(employeeId).populate("shiftId");

    if (!employeeProfile) {
      return res.status(404).json({ message: "Employee profile not found" });
    }

    const now = new Date();
    // Debugging: Log the incoming request context
    console.log(`[Punch-In] Request by: ${employeeProfile.email} at ${now.toISOString()}`);
    console.log(`[Punch-In] Payload:`, { 
      shiftId: req.body.shiftId, 
      currentTime: req.body.currentTime, 
      workLocation: req.body.workLocation 
    });

    // Support client-provided time for better local accuracy
    const currentTimeStr = req.body.currentTime || now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    
    // --- 🛠️ Robust Shift Discovery Logic ---
    let shift = null;

    // 1. Try shiftId from Request Body (Frontend)
    if (req.body.shiftId && req.body.shiftId !== "null" && req.body.shiftId !== "undefined") {
      try {
        shift = await Shift.findById(req.body.shiftId);
        if (shift) console.log(`[Shift Discovery] Found by req.body.shiftId: ${shift.shiftType}`);
      } catch (err) {
        console.warn("[Shift Discovery] Invalid shiftId in request body:", req.body.shiftId);
      }
    }

    // 2. Fallback to Employee Profile shiftId (Database)
    if (!shift && employeeProfile.shiftId) {
      shift = employeeProfile.shiftId;
      if (shift) console.log(`[Shift Discovery] Found by employeeProfile.shiftId: ${shift.shiftType}`);
    }

    // 3. Final Fallback: Use shift string (Legacy/Manual)
    if (!shift) {
      let searchType = employeeProfile.shift || "Morning";
      if (searchType.toUpperCase() === "DAY") searchType = "Morning";
      if (searchType.toUpperCase() === "NIGHT") searchType = "Night";

      console.log(`[Shift Discovery] Attempting fallback using searchType: ${searchType}`);
      shift = await Shift.findOne({ shiftType: { $regex: new RegExp(`^${searchType}$`, "i") } });

      if (!shift) {
        shift = await Shift.findOne().sort({ startTime: 1 });
        if (shift) console.log(`[Shift Discovery] Last resort fallback: Using earliest shift: ${shift.shiftType}`);
      }

      if (!shift) {
        return res.status(400).json({ message: "No shift configuration found. Please contact Admin." });
      }
    }

    // --- 🛠️ Shift Instance Calculation ---
    const parseStartTime = (timeStr) => {
      if (!timeStr) return { h: 9, m: 0 };
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (!match) return { h: 9, m: 0 };
      let h = parseInt(match[1]);
      const m = parseInt(match[2]);
      const ampm = match[3]?.toUpperCase();
      if (ampm === "PM" && h < 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;
      return { h, m };
    };

    const getShiftInstance = (baseDate, startTimeStr) => {
      const { h, m } = parseStartTime(startTimeStr);
      const d = new Date(baseDate);
      d.setHours(h, m, 0, 0);
      return d;
    };

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const candidates = [
      getShiftInstance(yesterdayStart, shift.startTime),
      getShiftInstance(todayStart, shift.startTime),
      getShiftInstance(tomorrowStart, shift.startTime)
    ];

    let bestShiftStart = null;
    const EARLY_WINDOW_MS = 60 * 60 * 1000; // 1 hour early
    const LATE_WINDOW_MS = 16 * 60 * 60 * 1000; // 16 hours late

    for (const start of candidates) {
      const diff = now - start;
      if (diff >= -EARLY_WINDOW_MS && diff <= LATE_WINDOW_MS) {
        bestShiftStart = start;
        break;
      }
    }

    if (!bestShiftStart) {
      const primaryTodayShift = getShiftInstance(todayStart, shift.startTime);
      const allowedFrom = new Date(primaryTodayShift.getTime() - EARLY_WINDOW_MS);

      if (now < allowedFrom) {
        return res.status(400).json({
          message: `Too early. Punch-in for ${shift.shiftType} shift (${shift.startTime}) starts at ${allowedFrom.toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' })}`
        });
      }

      return res.status(400).json({
        message: `Outside valid shift window. Your assigned shift (${shift.shiftType}) starts at ${shift.startTime}.`
      });
    }

    const workingDay = new Date(bestShiftStart);
    workingDay.setHours(0, 0, 0, 0);

    // 1. Check existing punch for this working day
    let existing = await Attendance.findOne({
      employee: employeeId,
      date: workingDay
    });

    if (existing) {
      if (existing.autoMarked && (existing.status === "Absent" || existing.status === "Leave")) {
        console.log(`[Punch-In] Overwriting auto-marked record for ${workingDay.toLocaleDateString()}`);
      } else {
        return res.status(400).json({ 
          message: `Already punched in for the ${shift.shiftType} shift on ${workingDay.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}.` 
        });
      }
    }

    const effectiveShiftStart = bestShiftStart;

    // 3. Status Determination
    let attendanceStatus = "Present";
    const lateThreshold = new Date(effectiveShiftStart.getTime() + 30 * 60 * 1000);
    if (now > lateThreshold) {
      attendanceStatus = "Late";
    }

    let lateByMinutes = 0;
    if (now > effectiveShiftStart) {
      lateByMinutes = Math.floor((now - effectiveShiftStart) / (1000 * 60));
    }

    const shiftDurationMinutes = shift.duration ? (shift.duration * 60) : 540;
    const midTime = new Date(effectiveShiftStart.getTime() + (shiftDurationMinutes / 2) * 60 * 1000);

    const approvedLeave = await LeaveApplication.findOne({
      employeeId,
      startDate: { $lte: workingDay },
      endDate: { $gte: workingDay },
      status: "Approved",
      type: "Half Day"
    });

    if (approvedLeave) {
      if (approvedLeave.half === "First Half") {
        if (now < midTime) {
          return res.status(400).json({
            message: `First Half Leave: You can only punch in after ${midTime.toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' })}`
          });
        }
        attendanceStatus = "Half Day";
      } else if (approvedLeave.half === "Second Half") {
        attendanceStatus = "Half Day";
      }
    }

    // 4. Validation
    const validation = await validateAttendanceLocation(req, employeeProfile);
    if (!validation.allowed) {
      return res.status(403).json({ message: validation.message });
    }

    const effectiveWorkMode = validation.workMode;

    // 5. Process Files & Location
    let locationData = {};
    if (req.body.location) {
      try {
        locationData = JSON.parse(req.body.location);
      } catch (e) { }
    }

    const selfieUrl = req.file ? `/uploads/${req.file.filename}` : null;
    if (!selfieUrl) {
      return res.status(400).json({ message: "Selfie is mandatory for attendance validation." });
    }

    const attendanceData = {
      employee: employeeId,
      date: workingDay,
      inTime: currentTimeStr,
      status: attendanceStatus,
      workLocation: effectiveWorkMode,
      lateByMinutes,
      selfieUrl,
      location: locationData,
      shiftType: shift.shiftType,
      autoMarked: false,
    };

    let attendance;
    if (existing && existing.autoMarked) {
      attendance = await Attendance.findByIdAndUpdate(existing._id, attendanceData, { new: true });
    } else {
      attendance = await Attendance.create(attendanceData);
    }

    console.log(`[Punch-In] Success: ${employeeProfile.email} - Status: ${attendanceStatus}`);
    res.status(201).json({
      message: `Punch in successful. Status: ${attendanceStatus}`,
      attendance
    });
  } catch (error) {
    console.error("[Punch-In] CRITICAL ERROR:", error);
    res.status(500).json({ message: "Internal Server Error. Please contact support." });
  }
};

/* =========================
   PUNCH OUT
========================= */
export const punchOut = async (req, res) => {
  try {
    const employeeId = req.employee._id;

    // Fetch Employee with Shift to get duration
    const employeeProfile = await Employee.findById(employeeId).populate("shiftId");
    const shift = employeeProfile?.shiftId;

    const shiftDurationMinutes = shift ? (shift.duration * 60) : 540;
    
    // Improved search: Find the most recent punch-in that doesn't have an outTime
    const attendance = await Attendance.findOne({
      employee: employeeId,
      outTime: { $exists: false }
    }).sort({ date: -1, createdAt: -1 });

    if (!attendance) {
      return res.status(404).json({ message: "No active punch-in found. Please punch in first." });
    }

    const outTime = new Date();
    const [inH, inM] = attendance.inTime.split(":").map(Number);

    // Support Overnight Shifts: Calculate total minutes from the actual punch-in date/time
    // Note: attendance.date stores the Working Day, but we should use createdAt or 
    // a combined date/time for accurate duration if possible. 
    // For now, we assume the punch-in was within 24h of now.
    const punchInDateTime = new Date(attendance.date);
    punchInDateTime.setHours(inH, inM, 0, 0);
    
    // If punch-in date-time is in the future compared to now (can happen with timezone shifts), 
    // or if the duration seems impossible (> 24h), we need to adjust.
    let totalMinutes = Math.floor((outTime - punchInDateTime) / (1000 * 60));
    
    // If negative, it might be an overnight shift where we crossed midnight
    if (totalMinutes < 0) totalMinutes += 1440; 
    // If still negative or extreme, cap it
    if (totalMinutes < 0) totalMinutes = 0;

    attendance.outTime = outTime.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit"
    });

    attendance.totalWorkingMinutes = totalMinutes;
    attendance.overtimeMinutes = Math.max(0, totalMinutes - shiftDurationMinutes);

    await attendance.save();

    res.json({
      message: "Punch out successful",
      attendance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   GET MY ATTENDANCE
========================= */
export const getMyAttendance = async (req, res) => {
  try {
    const employeeId = req.employee._id;

    const records = await Attendance.find({ employee: employeeId })
      .sort({ date: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   ADMIN: GET EMPLOYEE ATTENDANCE
========================= */
export const getEmployeeAttendance = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const records = await Attendance.find({ employee: employeeId })
      .populate("employee", "firstName lastName email")
      .sort({ date: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   ADMIN: GET ALL ATTENDANCE
   (Filter by Date, Status)
========================= */
export const getAllAttendance = async (req, res) => {
  try {
    const { date, status } = req.query;
    let query = {};

    // Date Filter (Default to Today if not provided, or specific date)
    // If date is provided as YYYY-MM-DD
    // if (date) {
    //   const start = new Date(date);
    //   start.setHours(0, 0, 0, 0);
    //   const end = new Date(date);
    //   end.setHours(23, 59, 59, 999);
    //   query.date = { $gte: start, $lte: end };
    // }
    if (date) {
      // Parse YYYY-MM-DD manually to create local date
      const [y, m, d] = date.split('-').map(Number);

      const start = new Date(y, m - 1, d); // Local Midnight
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setDate(end.getDate() + 1); // Next day midnight

      query.date = {
        $gte: start,
        $lt: end
      };
    }


    if (status && status !== 'All') {
      query.status = status;
    }

    const records = await Attendance.find(query)
      .populate("employee", "firstName lastName email department designation profileImage")
      .sort({ inTime: -1 });

    // const safeRecords = records.filter(r => r.employee);
    // return res.json(safeRecords);


    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   ADMIN: UPDATE ATTENDANCE
========================= */
export const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks, inTime, outTime } = req.body;

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({ message: "Record not found" });
    }

    // Store old data for audit
    const oldData = {
      status: attendance.status,
      inTime: attendance.inTime,
      outTime: attendance.outTime,
      remarks: attendance.remarks
    };

    // Update fields
    if (status) attendance.status = status;
    if (remarks) attendance.remarks = remarks;
    if (inTime) attendance.inTime = inTime;

    // Recalculate Logic if Times are changed
    if (inTime || outTime) {
      if (outTime) attendance.outTime = outTime;

      const [inH, inM] = attendance.inTime.split(":").map(Number);
      const [outH, outM] = attendance.outTime.split(":").map(Number);

      // Handle overnight calculation for manual edits
      let totalMinutes = (outH * 60 + outM) - (inH * 60 + inM);
      if (totalMinutes < 0) totalMinutes += 1440; // Add 24 hours if outTime < inTime

      attendance.totalWorkingMinutes = Math.max(0, totalMinutes);

      // Fetch shift with robust fallback
      let emp = await Employee.findById(attendance.employee).populate("shiftId");

      if (!emp?.shiftId) {
        return res.status(400).json({ message: "No shift assigned to employee." });
      }
      const dur = emp?.shiftId?.duration ? (emp.shiftId.duration * 60) : 540;
      attendance.overtimeMinutes = Math.max(0, totalMinutes - dur);
    }

    await attendance.save();

    // Create Audit Log for manual edit
    await AuditLog.create({
      action: "ATTENDANCE_MANUAL_UPDATE",
      performedBy: req.admin?._id,
      targetType: "Attendance",
      targetId: id,
      oldData,
      newData: {
        status: attendance.status,
        inTime: attendance.inTime,
        outTime: attendance.outTime,
        remarks: attendance.remarks
      },
      remarks: "Manual update by administrator"
    });

    res.json({ message: "Attendance updated", attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   🕒 BREAK MANAGEMENT
========================= */
export const startBreak = async (req, res) => {
  try {
    const employeeId = req.employee._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({ employee: employeeId, date: today });
    if (!attendance) return res.status(404).json({ message: "Check-in required before taking a break." });
    if (attendance.outTime) return res.status(400).json({ message: "Already punched out for today." });

    // Network validation removed as per requirement.


    const lastBreak = attendance.breaks[attendance.breaks.length - 1];
    if (lastBreak && !lastBreak.endTime) {
      return res.status(400).json({ message: "You have an active break. Please end it first." });
    }

    const { type, reason } = req.body;
    const now = new Date();
    const startTime = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

    attendance.breaks.push({ startTime, type: type || "Lunch", reason });
    await attendance.save();

    res.json({ message: `${type || "Break"} started at ${startTime}`, attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const endBreak = async (req, res) => {
  try {
    const employeeId = req.employee._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({ employee: employeeId, date: today });
    if (!attendance) return res.status(404).json({ message: "Attendance record not found." });

    // Network validation removed as per requirement.


    const activeBreak = attendance.breaks.find(b => !b.endTime);
    if (!activeBreak) return res.status(400).json({ message: "No active break found." });

    const now = new Date();
    const endTime = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

    // Calculate duration
    const [startH, startM] = activeBreak.startTime.split(":").map(Number);
    const duration = (now.getHours() * 60 + now.getMinutes()) - (startH * 60 + startM);

    activeBreak.endTime = endTime;
    activeBreak.duration = Math.max(0, duration);

    // Update total breakdown
    attendance.totalBreakMinutes = attendance.breaks.reduce((total, b) => total + (b.duration || 0), 0);

    await attendance.save();
    res.json({ message: "Break ended. Duration: " + activeBreak.duration + "m", attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   📝 REGULARIZATION REQUEST
========================= */
export const requestRegularization = async (req, res) => {
  try {
    const employeeId = req.employee._id;
    const { attendanceId, requestedInTime, requestedOutTime, reason } = req.body;

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) return res.status(404).json({ message: "Attendance record not found." });

    // Check if already requested
    const existing = await Regularization.findOne({ attendanceId, status: "Pending" });
    if (existing) return res.status(400).json({ message: "A pending request already exists for this record." });

    const request = await Regularization.create({
      employeeId,
      attendanceId,
      requestedDate: attendance.date,
      requestedInTime,
      requestedOutTime,
      reason
    });

    res.status(201).json({ message: "Regularization request submitted successfully.", request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   📈 ADMIN: REGULARIZATION OPS
   ========================= */

export const getRegularizationRequests = async (req, res) => {
  try {
    const requests = await Regularization.find()
      .populate("employeeId", "firstName lastName email employeeId")
      .populate("attendanceId", "date inTime outTime")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const approveRegularization = async (req, res) => {
  try {
    const { requestId } = req.body;
    const request = await Regularization.findById(requestId).populate("attendanceId");
    if (!request) return res.status(404).json({ message: "Request not found" });

    const attendance = await Attendance.findById(request.attendanceId);
    if (!attendance) return res.status(404).json({ message: "Attendance record not found" });

    // Store old data for audit
    const oldData = { inTime: attendance.inTime, outTime: attendance.outTime, status: attendance.status };

    // Update Attendance
    attendance.inTime = request.requestedInTime;
    attendance.outTime = request.requestedOutTime;
    attendance.status = "Present"; // Corrected to Title Case for consistency

    // Recalculate duration
    const [inH, inM] = attendance.inTime.split(":").map(Number);
    const [outH, outM] = attendance.outTime.split(":").map(Number);
    attendance.totalWorkingMinutes = (outH * 60 + outM) - (inH * 60 + inM);

    await attendance.save();

    // Update Request
    request.status = "Approved";
    await request.save();

    // Create Audit Log
    await AuditLog.create({
      action: "REGULARIZATION_APPROVED",
      performedBy: req.admin?._id || req.body.adminId, // Support both req.admin or manual ID for now
      targetType: "Regularization",
      targetId: requestId,
      oldData,
      newData: { inTime: attendance.inTime, outTime: attendance.outTime, status: attendance.status },
      remarks: "Approved regularization request"
    });

    res.json({ message: "Request approved and attendance updated.", attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const rejectRegularization = async (req, res) => {
  try {
    const { requestId, adminRemarks } = req.body;
    const request = await Regularization.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    request.status = "Rejected";
    request.adminRemarks = adminRemarks;
    await request.save();

    // Create Audit Log
    await AuditLog.create({
      action: "REGULARIZATION_REJECTED",
      performedBy: req.admin?._id || req.body.adminId,
      targetType: "Regularization",
      targetId: requestId,
      remarks: adminRemarks
    });

    res.json({ message: "Request rejected.", request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   📜 ADMIN: AUDIT LOGS
   ========================= */
export const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate("performedBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
