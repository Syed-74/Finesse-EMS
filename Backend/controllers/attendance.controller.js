import Attendance from "../models/attendance.model.js";

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
    console.log("EMPLOYEE:", req.employee);
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    const employeeId = req.employee._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Check existing punch
    const existing = await Attendance.findOne({
      employee: employeeId,
      date: today
    });

    if (existing) {
      return res.status(400).json({ message: "Already punched in today" });
    }

    // 2. Process Location & Geofencing
    let locationData = {};
    let isInsideOffice = false;

    if (req.body.location) {
      try {
        locationData = JSON.parse(req.body.location);

        // 📍 Simple Geo-Fencing Logic (Example Office Coords)
        const OFFICE_LAT = 12.9716; // Replace with real office lat
        const OFFICE_LNG = 77.5946; // Replace with real office lng
        const RADIUS_KM = 0.5; // 500 meters

        const dist = getDistanceFromLatLonInKm(
          locationData.latitude,
          locationData.longitude,
          OFFICE_LAT,
          OFFICE_LNG
        );

        isInsideOffice = dist <= RADIUS_KM;
        locationData.isInsideOffice = isInsideOffice;

      } catch (e) {
        console.error("Location parse error", e);
      }
    }

    // 3. Process Selfie
    const selfieUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!selfieUrl) {
      return res.status(400).json({ message: "Selfie is mandatory for attendance." });
    }

    /* =====================================================
       🔐 IP-BASED ATTENDANCE VALIDATION (New Feature)
       =====================================================
       Fetches employee.workLocation from DB (set by Admin).
       selectedWorkLocation = what employee selected on punch-in form.
       employeeWorkLocation = what Admin configured (OFFICE/REMOTE/HYBRID).
    ===================================================== */
    const rawIP = getClientIP(req);
    const clientIP = normalizeIP(rawIP);
    const selectedWorkLocation = req.body.workLocation || "Office"; // from form
    const employeeWorkLocation = (req.employee.workLocation || "OFFICE").toUpperCase();

    console.log(`[IP VALIDATION] Employee: ${req.employee.email} | Raw IP: ${rawIP} | Normalized IP: ${clientIP}`);
    console.log(`[IP VALIDATION] Admin-set workLocation: ${employeeWorkLocation} | Selected: ${selectedWorkLocation}`);

    // Determine if IP validation is required
    let requiresOfficeIP = false;

    if (employeeWorkLocation === "OFFICE") {
      // Must always punch from office IP
      requiresOfficeIP = true;
    } else if (employeeWorkLocation === "HYBRID") {
      // Only required if employee selected "Office" location
      if (selectedWorkLocation === "Office") {
        requiresOfficeIP = true;
      }
    }
    // REMOTE: no IP restriction

    // Check if IP is allowed
    const isOfficeIP = allowedOfficeIPs.includes(clientIP) || allowedOfficeIPs.includes(rawIP);

    // Determine networkType for badge display
    let networkType = "Remote";
    if (isOfficeIP) {
      networkType = "Office";
    } else if (requiresOfficeIP) {
      networkType = "Unauthorized";
    }

    // Block if required office IP but didn't match
    if (requiresOfficeIP && !isOfficeIP) {
      console.warn(`[SECURITY] Unauthorized punch-in attempt by ${req.employee.email} from IP: ${clientIP}`);
      return res.status(403).json({
        message: "Admin has set your onsite location. Please mark attendance from office network.",
        code: "OFFICE_IP_REQUIRED",
        clientIP
      });
    }

    // 4. Create Attendance Record
    const attendance = await Attendance.create({
      employee: employeeId,
      date: today,
      inTime: new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit"
      }),
      status: "PRESENT",
      workLocation: selectedWorkLocation,
      selfieUrl,
      location: locationData,
      deviceInfo: {
        userAgent: req.headers["user-agent"],
        ip: clientIP,
        networkType
      }
    });

    res.status(201).json({
      message: "Punch in successful",
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
    const totalMinutes =
      outTime.getHours() * 60 + outTime.getMinutes() - (inH * 60 + inM);

    attendance.outTime = outTime.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit"
    });

    attendance.totalWorkingMinutes = totalMinutes;

    attendance.lateByMinutes = Math.max(0, (inH * 60 + inM) - 540); // after 9:00 AM

    attendance.overtimeMinutes = Math.max(0, totalMinutes - 540);

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
    console.log("ADMIN:", req.admin);
    console.log("QUERY:", req.query);

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

    // Update fields
    if (status) attendance.status = status;
    if (remarks) attendance.remarks = remarks;
    if (inTime) attendance.inTime = inTime;

    // Recalculate Logic if OutTime is present or changed
    if (outTime) {
      attendance.outTime = outTime;

      const [inH, inM] = attendance.inTime.split(":").map(Number);
      const [outH, outM] = outTime.split(":").map(Number);

      const totalMinutes = (outH * 60 + outM) - (inH * 60 + inM);
      attendance.totalWorkingMinutes = Math.max(0, totalMinutes);

      // Recalc Overtime/Late logic if needed
      attendance.overtimeMinutes = Math.max(0, totalMinutes - 540);
    }

    await attendance.save();

    res.json({ message: "Attendance updated", attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
