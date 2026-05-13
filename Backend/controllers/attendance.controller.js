import Attendance from "../models/attendance.model.js";
import Shift from "../models/shift.model.js";
import LeaveApplication from "../models/LeaveApplication.model.js";
import Employee from "../models/Employee.model.js";
import Regularization from "../models/regularization.model.js";
import AuditLog from "../models/auditLog.model.js";
import { validateAttendanceLocation } from "../services/attendanceValidation.service.js";
import { getISTTime } from "../utils/timezone.js";

/* =========================
   PUNCH IN
========================= */
export const punchIn = async (req, res) => {
  try {
    const employeeId = req.employee._id;
    console.log(`🚀 Punch-in Attempt: ${req.employee.email}`);
    const today = getISTTime();
    today.setHours(0, 0, 0, 0);

    // 0. Fetch Employee with Shift
    let employeeProfile = await Employee.findById(employeeId).populate("shiftId");

    if (!employeeProfile) {
      return res.status(404).json({ message: "Employee profile not found" });
    }

    const now = getISTTime();
    const currentTimeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    // 1. Check existing punch (today's record or any currently open session)
    let existing = await Attendance.findOne({
      employee: employeeId,
      $or: [
        { date: today },
        { outTime: { $exists: false } }
      ]
    }).sort({ date: -1 });

    if (existing) {
      // If it's an open session (missing outTime), we don't allow a new punch-in
      if (!existing.outTime && !existing.autoMarked) {
        return res.status(400).json({ message: "You already have an active punch-in session. Please punch out first." });
      }

      // If it's an auto-marked "Absent" or "Leave" record for today, we allow "overwriting" it
      if (existing.date.getTime() === today.getTime() && existing.autoMarked && (existing.status === "Absent" || existing.status === "Leave")) {
        console.log(`Overwriting auto-marked ${existing.status} record for ${employeeProfile.email}`);
      } else if (existing.date.getTime() === today.getTime()) {
        return res.status(400).json({ message: "Already punched in for today" });
      }
    }

    // --- 🛠️ Robust Shift Discovery Logic ---
    let shift = null;

    // 1. Try shiftId from Request Body (Frontend)
    if (req.body.shiftId && req.body.shiftId !== "null" && req.body.shiftId !== "undefined") {
      try {
        shift = await Shift.findById(req.body.shiftId);
      } catch (err) {
        console.warn("Invalid shiftId in request body:", req.body.shiftId);
      }
    }

    // 2. Fallback to Employee Profile shiftId (Database)
    if (!shift) {
      shift = employeeProfile.shiftId;
    }

    // 3. Final Fallback: Use shift string (Legacy/Manual)
    if (!shift) {
      console.log(`No shiftId for ${employeeProfile.email}, attempting fallback using shift string: ${employeeProfile.shift}`);
      let searchType = employeeProfile.shift || "Morning";

      // Normalize common shift names
      if (searchType.toUpperCase() === "DAY") searchType = "Morning";
      if (searchType.toUpperCase() === "NIGHT") searchType = "Night";

      shift = await Shift.findOne({ shiftType: { $regex: new RegExp(`^${searchType}$`, "i") } });

      if (!shift) {
        // Absolute last resort: Get any available shift
        shift = await Shift.findOne();
      }

      if (!shift) {
        return res.status(400).json({ message: "No shift configuration found in system. Please contact Admin." });
      }
    }

    // --- 🛠️ Robust Shift Discovery Logic ---
    const parseStartTime = (timeStr) => {
      if (!timeStr) return { h: 9, m: 0 };
      // Handle "13:00" or "01:00 PM"
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

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Candidates: yesterday's shift and today's shift
    const candidates = [
      getShiftInstance(yesterday, shift.startTime),
      getShiftInstance(today, shift.startTime)
    ];

    // Find the best fit: The shift that started most recently but no more than 12h ago, 
    // OR the one starting in the next 30 mins.
    let bestShiftStart = null;
    const EARLY_WINDOW_MS = 30 * 60 * 1000;
    const LATE_WINDOW_MS = 12 * 60 * 60 * 1000; // Allow punching in up to 12h late for night shifts

    for (const start of candidates) {
      const diff = now - start;
      if (diff >= -EARLY_WINDOW_MS && diff <= LATE_WINDOW_MS) {
        bestShiftStart = start;
        break;
      }
    }

    if (!bestShiftStart) {
      // If no candidate fits, it means they are either way too early for today's shift 
      // or way too late for yesterday's/today's.
      const todayShift = getShiftInstance(today, shift.startTime);
      const allowedFrom = new Date(todayShift.getTime() - EARLY_WINDOW_MS);

      if (now < allowedFrom) {
        return res.status(400).json({
          message: `Too early. Punch-in for today's shift (${shift.startTime}) starts at ${allowedFrom.toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' })}`
        });
      }

      return res.status(400).json({
        message: `Outside valid shift window. Shift starts at ${shift.startTime}.`
      });
    }

    const effectiveShiftStart = bestShiftStart;

    // 3. Status Determination (Late/Present)
    let attendanceStatus = "Present";
    const lateThreshold = new Date(effectiveShiftStart.getTime() + 30 * 60 * 1000);
    if (now > lateThreshold) {
      attendanceStatus = "Late";
    }

    let lateByMinutes = 0;
    if (now > effectiveShiftStart) {
      lateByMinutes = Math.floor((now - effectiveShiftStart) / (1000 * 60));
    }

    // Dynamic Mid-time for Half Day
    const shiftDurationMinutes = shift.duration ? (shift.duration * 60) : 540;
    const midTime = new Date(effectiveShiftStart.getTime() + (shiftDurationMinutes / 2) * 60 * 1000);

    const approvedLeave = await LeaveApplication.findOne({
      employeeId,
      startDate: { $lte: today },
      endDate: { $gte: today },
      status: "Approved",
      type: "Half Day"
    });

    if (approvedLeave) {
      if (approvedLeave.half === "First Half") {
        // Must punch in AFTER mid-time
        if (now < midTime) {
          return res.status(400).json({
            message: `First Half Leave: You can only punch in after ${midTime.toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' })}`
          });
        }
        attendanceStatus = "Half Day";
      } else if (approvedLeave.half === "Second Half") {
        // Can punch in normally, but status is Half Day
        // Optional: Enforcement to punch out early handled by policy
        attendanceStatus = "Half Day";
      }
    }
    // 4. Work Location & IP Validation
    const validation = await validateAttendanceLocation(req, employeeProfile);

    if (!validation.allowed) {
      return res.status(403).json({ message: validation.message });
    }

    const effectiveWorkMode = validation.workMode;


    // 5. Process Location & Selfie
    let locationData = {};
    if (req.body.location) {
      try {
        locationData = JSON.parse(req.body.location);
      } catch (e) { }
    }

    const selfieUrl = req.file ? `/uploads/${req.file.filename}` : null;
    if (!selfieUrl) {
      return res.status(400).json({ message: "Selfie is mandatory for attendance." });
    }

    // 6. Create or Update Attendance Record
    const attendanceData = {
      employee: employeeId,
      date: today,
      inTime: currentTimeStr,
      status: attendanceStatus, // Save the determined status (Late/Present/Half Day)
      workLocation: effectiveWorkMode,
      lateByMinutes,
      selfieUrl,
      location: locationData,
      shiftType: shift.shiftType, // Save the shift type
      autoMarked: false, // It's a manual punch
    };

    let attendance;
    if (existing && existing.autoMarked) {
      // Update existing auto-marked record
      attendance = await Attendance.findByIdAndUpdate(existing._id, attendanceData, { new: true });
    } else {
      // Create new record
      attendance = await Attendance.create(attendanceData);
    }

    res.status(201).json({
      message: `Punch in successful. Status: ${attendanceStatus}`,
      attendance
    });
  } catch (error) {
    console.error("Punch In Error:", error);
    res.status(500).json({ message: error.message });
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

    // Network validation removed as per requirement.


    const shiftDurationMinutes = shift ? (shift.duration * 60) : 540;
    const today = getISTTime();
    today.setHours(0, 0, 0, 0);

    // FIX: Look for the most recent record where outTime is missing but inTime exists.
    // This ensures we are punching out of a real session and not an auto-marked 'Absent' record.
    const attendance = await Attendance.findOne({
      employee: employeeId,
      outTime: { $exists: false },
      inTime: { $exists: true } 
    }).sort({ date: -1, createdAt: -1 });

    if (!attendance) {
      return res.status(404).json({ message: "No active punch-in found. Please punch in first." });
    }

    if (attendance.outTime) {
      return res.status(400).json({ message: "Already punched out today" });
    }

    const outTime = getISTTime();

    const [inH, inM] = attendance.inTime.split(":").map(Number);

    // Support Overnight Shifts
    const punchInDateTime = new Date(attendance.date);
    punchInDateTime.setHours(inH, inM, 0, 0);

    let totalMinutes = Math.floor((outTime - punchInDateTime) / (1000 * 60));
    if (totalMinutes < 0) totalMinutes = 0; // Guard

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

      // Recalculate Logic if Times are changed
      let totalMinutes = (outH * 60 + outM) - (inH * 60 + inM);
      if (totalMinutes < 0) totalMinutes += 1440; // Add 24 hours if outTime < inTime

      attendance.totalWorkingMinutes = Math.max(0, totalMinutes);

      // Fetch shift with robust fallback
      let emp = await Employee.findById(attendance.employee).populate("shiftId");
      const shift = emp?.shiftId;
      const shiftDurationMinutes = shift ? (shift.duration * 60) : 540;

      // Recalculate Late Minutes
      if (shift && shift.startTime) {
        const [shiftH, shiftM] = shift.startTime.split(":").map(Number);
        const lateMinutes = (inH * 60 + inM) - (shiftH * 60 + shiftM);
        attendance.lateByMinutes = Math.max(0, lateMinutes);
      }

      // Recalculate Overtime
      attendance.overtimeMinutes = Math.max(0, totalMinutes - shiftDurationMinutes);
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
    const today = getISTTime();
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
    const now = getISTTime();
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
    const today = getISTTime();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({ employee: employeeId, date: today });
    if (!attendance) return res.status(404).json({ message: "Attendance record not found." });

    // Network validation removed as per requirement.


    const activeBreak = attendance.breaks.find(b => !b.endTime);
    if (!activeBreak) return res.status(400).json({ message: "No active break found." });

    const now = getISTTime();
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
    const oldData = { 
      inTime: attendance.inTime, 
      outTime: attendance.outTime, 
      status: attendance.status,
      lateByMinutes: attendance.lateByMinutes,
      overtimeMinutes: attendance.overtimeMinutes,
      totalWorkingMinutes: attendance.totalWorkingMinutes
    };

    // Update Attendance
    attendance.inTime = request.requestedInTime;
    attendance.outTime = request.requestedOutTime;
    attendance.status = "Present"; 

    // Fetch Employee and Shift for accurate recalculations
    const employee = await Employee.findById(attendance.employee).populate("shiftId");
    const shift = employee?.shiftId;
    const shiftDurationMinutes = shift ? (shift.duration * 60) : 540;

    // Recalculate totalWorkingMinutes (handling overnight)
    const [inH, inM] = attendance.inTime.split(":").map(Number);
    const [outH, outM] = attendance.outTime.split(":").map(Number);

    let totalMinutes = (outH * 60 + outM) - (inH * 60 + inM);
    if (totalMinutes < 0) totalMinutes += 1440; // Support overnight shifts
    attendance.totalWorkingMinutes = totalMinutes;

    // Recalculate lateByMinutes
    if (shift && shift.startTime) {
      const [shiftH, shiftM] = shift.startTime.split(":").map(Number);
      const lateMinutes = (inH * 60 + inM) - (shiftH * 60 + shiftM);
      attendance.lateByMinutes = Math.max(0, lateMinutes);
    }

    // Recalculate overtimeMinutes
    attendance.overtimeMinutes = Math.max(0, totalMinutes - shiftDurationMinutes);

    // Mark as regularized
    if (!attendance.isRegularized) {
      attendance.originalStatus = oldData.status;
      attendance.isRegularized = true;
    }

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
