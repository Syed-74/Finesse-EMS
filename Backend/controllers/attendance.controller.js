import Attendance from "../models/attendance.model.js";
import Shift from "../models/shift.model.js";
import LeaveApplication from "../models/LeaveApplication.model.js";
import Employee from "../models/employee.model.js";
import Regularization from "../models/regularization.model.js";
import AuditLog from "../models/auditLog.model.js";

/* =========================
   🌐 IP VALIDATION CONFIG
========================= */
// ✅ Add more IPs here for scalability (supports IPv4 + IPv6-mapped)
const allowedOfficeIPs = [
  "192.168.29.24",
  "::ffff:192.168.29.24", // IPv6-mapped IPv4
  "::1",                  // localhost (dev)
  "127.0.0.1"             // localhost (dev)
];

/**
 * Normalize IPv6-mapped IPv4 addresses to plain IPv4.
 * e.g., "::ffff:192.168.29.24" → "192.168.29.24"
 */
function normalizeIP(ip) {
  if (!ip) return "";
  if (ip.startsWith("::ffff:")) {
    return ip.replace("::ffff:", "");
  }
  return ip;
}

/**
 * Get the real client IP, honoring X-Forwarded-For when behind a proxy.
 */
function getClientIP(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    // X-Forwarded-For can be a comma-separated list; take first
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || "";
}

/* =========================
   PUNCH IN
========================= */
export const punchIn = async (req, res) => {
  try {
    const employeeId = req.employee._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 0. Fetch Employee with Shift
    let employeeProfile = await Employee.findById(employeeId).populate("shiftId");
    
    if (!employeeProfile) {
      console.log("Error: Employee profile not found", employeeId);
      return res.status(404).json({ message: "Employee profile not found" });
    }

    if (!employeeProfile.shiftId) {
      let searchType = employeeProfile.shift || "Morning";
      if (searchType === "DAY") searchType = "Morning";
      if (searchType === "NIGHT") searchType = "Night";

      const fallbackShift = await Shift.findOne({ shiftType: searchType });
      if (fallbackShift) {
        employeeProfile.shiftId = fallbackShift;
        console.log(`Found fallback '${searchType}' shift. Using it for this session.`);
      } else {
        // Final attempt: get any shift
        const anyShift = await Shift.findOne();
        if (anyShift) {
          employeeProfile.shiftId = anyShift;
          console.log("Using first available shift as final fallback.");
        } else {
          console.log("Error: No shifts found in database at all.");
          return res.status(400).json({ message: "No shifts configured in system. Please contact Admin." });
        }
      }
    }

    const shift = employeeProfile.shiftId;
    const now = new Date();
    const currentTimeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

    // 1. Check existing punch
    const existing = await Attendance.findOne({
      employee: employeeId,
      date: today
    });

    if (existing) {
      console.log("Error: Already punched in for today", employeeId);
      return res.status(400).json({ message: "Already punched in today" });
    }

    // 2. Shift Timing Logic
    const [startH, startM] = shift.startTime.split(":").map(Number);
    const shiftStartToday = new Date(today);
    shiftStartToday.setHours(startH, startM, 0, 0);

    const checkInAllowedFrom = new Date(shiftStartToday);
    checkInAllowedFrom.setMinutes(checkInAllowedFrom.getMinutes() - 30);

    if (now < checkInAllowedFrom) {
      console.log("Error: Early punch-in attempt", { now: currentTimeStr, allowedFrom: checkInAllowedFrom.toLocaleTimeString() });
      return res.status(400).json({ 
        message: `Check-in allowed only 30 minutes before shift start (${shift.startTime})` 
      });
    }

    // 3. Half Day Leave Check
    const approvedLeave = await LeaveApplication.findOne({
      employeeId,
      startDate: { $lte: today },
      endDate: { $gte: today },
      status: "Approved",
      type: "Half Day"
    });

    let attendanceStatus = "Present";
    
    // Dynamic Mid-time calculation: StartTime + (ShiftDuration / 2)
    const shiftDurationMinutes = shift.duration ? (shift.duration * 60) : 540;
    const midTimeMinutes = shiftDurationMinutes / 2;
    
    const midTime = new Date(shiftStartToday);
    midTime.setMinutes(midTime.getMinutes() + midTimeMinutes);

    if (approvedLeave) {
      if (approvedLeave.half === "First Half") {
        // Must punch in AFTER mid-time
        if (now < midTime) {
          return res.status(400).json({ 
            message: `First Half Leave: You can only punch in after ${midTime.toLocaleTimeString("en-GB", {hour: '2-digit', minute:'2-digit'})}` 
          });
        }
        attendanceStatus = "Half Day";
      } else if (approvedLeave.half === "Second Half") {
        // Can punch in normally, but status is Half Day
        // Optional: Enforcement to punch out early handled by policy
        attendanceStatus = "Half Day";
      }
    } else {
      // Standard Status Logic
      const lateThreshold = new Date(shiftStartToday);
      lateThreshold.setMinutes(lateThreshold.getMinutes() + 30);

      if (now > lateThreshold) {
        attendanceStatus = "Late";
      }
    }

    let lateByMinutes = 0;
    if (now > shiftStartToday) {
      lateByMinutes = Math.floor((now - shiftStartToday) / (1000 * 60));
    }

    // 4. Process Location & Geofencing (rest of the logic remains similar)
    let locationData = {};
    if (req.body.location) {
      try {
        locationData = JSON.parse(req.body.location);
      } catch (e) {}
    }

    const selfieUrl = req.file ? `/uploads/${req.file.filename}` : null;
    if (!selfieUrl) {
      console.log("Error: Selfie missing in request (req.file is undefined)");
      return res.status(400).json({ message: "Selfie is mandatory for attendance." });
    }

    const rawIP = getClientIP(req);
    const clientIP = normalizeIP(rawIP);
    const selectedWorkLocation = req.body.workLocation || "Office";
    
    // Create Attendance Record
    const attendance = await Attendance.create({
      employee: employeeId,
      date: today,
      inTime: currentTimeStr,
      status: attendanceStatus,
      shiftType: shift.shiftType,
      workLocation: selectedWorkLocation,
      lateByMinutes,
      selfieUrl,
      location: locationData,
      deviceInfo: {
        userAgent: req.headers["user-agent"],
        ip: clientIP
      }
    });

    res.status(201).json({
      message: `Punch in successful. Status: ${attendanceStatus}`,
      attendance
    });
  } catch (error) {
    console.error("Punch In Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 📏 Helper: Haversine Formula for Distance
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180)
}


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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employee: employeeId,
      date: today
    });

    if (!attendance) {
      return res.status(404).json({ message: "No punch in found for today" });
    }

    if (attendance.outTime) {
      return res.status(400).json({ message: "Already punched out today" });
    }

    const outTime = new Date();

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

        // Handle overnight calculation for manual edits
        let totalMinutes = (outH * 60 + outM) - (inH * 60 + inM);
        if (totalMinutes < 0) totalMinutes += 1440; // Add 24 hours if outTime < inTime

        attendance.totalWorkingMinutes = Math.max(0, totalMinutes);

        // Fetch shift with robust fallback
        let emp = await Employee.findById(attendance.employee).populate("shiftId");
        
        if (!emp?.shiftId) {
          let searchType = emp?.shift || "Morning";
          if (searchType === "DAY") searchType = "Morning";
          if (searchType === "NIGHT") searchType = "Night";
          emp.shiftId = await Shift.findOne({ shiftType: searchType }) || await Shift.findOne();
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
