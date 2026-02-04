import Attendance from "../models/attendance.model.js";

/* =========================
   PUNCH IN
========================= */
/* =========================
   PUNCH IN
========================= */
export const punchIn = async (req, res) => {
  try {
    const employeeId = req.admin._id; 
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

    // 4. Create Record
    const attendance = await Attendance.create({
      employee: employeeId,
      date: today,
      inTime: new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit"
      }),
      status: "PRESENT",
      workLocation: req.body.workLocation || "Office",
      selfieUrl,
      location: locationData,
      deviceInfo: {
          userAgent: req.headers['user-agent'],
          ip: req.ip
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
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}


/* =========================
   PUNCH OUT
========================= */
export const punchOut = async (req, res) => {
  try {
    const employeeId = req.admin._id;

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
    const employeeId = req.admin._id;

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
    if (date) {
       const start = new Date(date);
       start.setHours(0,0,0,0);
       const end = new Date(date);
       end.setHours(23,59,59,999);
       query.date = { $gte: start, $lte: end };
    }

    if (status && status !== 'All') {
        query.status = status;
    }

    const records = await Attendance.find(query)
      .populate("employee", "firstName lastName email department designation profileImage")
      .sort({ inTime: -1 });

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
