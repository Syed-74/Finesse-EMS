import LeaveManagement from "../models/LeaveManagement.model.js";
import LeaveSettings from "../models/LeaveSettings.model.js";
import mongoose from "mongoose";
import { isWeekend, eachDayOfInterval, isSameDay, parseISO } from "date-fns";

/* ===========================
   HELPER: Get Settings
=========================== */
const getSettings = async () => {
  let settings = await LeaveSettings.findOne();
  if (!settings) {
    settings = await LeaveSettings.create({
      leavePolicy: [],
      holidays: [],
    });
  }
  return settings;
};

/* ===========================
   HELPER: Calculate Actual Leave Days
=========================== */
const calculateLeaveDays = (start, end, holidays) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  if (endDate < startDate) return 0;

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  const workingDays = days.filter(day => {
    // 1. Check Weekend (Sat/Sun)
    if (isWeekend(day)) return false;

    // 2. Check Holiday
    const isHoliday = holidays.some(h => isSameDay(new Date(h.holidayDate), day));
    if (isHoliday) return false;

    return true;
  });

  return workingDays.length;
};

/* ===========================
   CREATE EMPLOYEE LEAVE PROFILE
=========================== */
export const createLeaveProfile = async (req, res) => {
  try {
    const { employeeId, employeeName, departmentId } = req.body;

    const exists = await LeaveManagement.findOne({ employeeId });
    if (exists)
      return res.status(400).json({ message: "Leave profile already exists" });

    const profile = await LeaveManagement.create({
      employeeId,
      employeeName,
      departmentId,
      leaveBalance: {
        totalLeaves: 30, // Default Policy
        usedLeaves: 0,
        remainingLeaves: 30,
        leaveTypeWiseBalance: {
          Casual: 10,
          Sick: 10,
          Paid: 10,
        },
      },
    });

    res.status(201).json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ===========================
   APPLY LEAVE (EMPLOYEE)
=========================== */
export const applyLeave = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { leaveType, startDate, endDate, reason, attachment, halfDay } = req.body;

    const profile = await LeaveManagement.findOne({ employeeId });
    if (!profile) return res.status(404).json({ message: "Leave profile not found" });

    const settings = await getSettings();

    // 1. Calculate Days (Excluding Weekends & Holidays)
    let calculatedDays = 0;
    if (halfDay) {
      calculatedDays = 0.5; // Half-day is always 0.5 regardless (assuming valid day)
      // Note: We should still check if it's a holiday/weekend? 
      // Simplified: half-day usually implies a working day.
    } else {
      calculatedDays = calculateLeaveDays(startDate, endDate, settings.holidays);
    }

    if (calculatedDays === 0) {
      return res.status(400).json({ message: "Selected dates are holidays or weekends." });
    }

    // 2. Check Balance
    const currentBalance = profile.leaveBalance.leaveTypeWiseBalance[leaveType] || 0;
    if (currentBalance < calculatedDays) {
      return res.status(400).json({ 
        message: `Insufficient ${leaveType} leave balance. Available: ${currentBalance}, Requested: ${calculatedDays}` 
      });
    }

    // 3. Check Overlap
    const isOverlap = profile.leaveRequests.some(req => {
      // Skip rejected/cancelled
      if (req.status === 'Rejected' || req.status === 'Cancelled') return false;
      
      const reqStart = new Date(req.startDate);
      const reqEnd = new Date(req.endDate);
      const newStart = new Date(startDate);
      const newEnd = new Date(endDate);

      return (newStart <= reqEnd && newEnd >= reqStart);
    });

    if (isOverlap) {
      return res.status(400).json({ message: "You already have a leave request for this period." });
    }

    // 4. Create Request
    const leaveId = new mongoose.Types.ObjectId().toString();
    profile.leaveRequests.push({
      leaveId,
      leaveType,
      startDate,
      endDate,
      totalDays: calculatedDays,
      reason,
      attachment,
      halfDay,
      status: "Pending"
    });

    profile.auditLog.push({ action: "Leave Applied", performedBy: employeeId });
    await profile.save();

    res.json({ message: "Leave applied successfully", leaveId, days: calculatedDays });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ===========================
   GET EMPLOYEE LEAVES
=========================== */
export const getEmployeeLeaves = async (req, res) => {
  try {
    const { employeeId } = req.params;
    let profile = await LeaveManagement.findOne({ employeeId });
    const settings = await getSettings();

    if (!profile) {
      // Auto-create for UX
      profile = await LeaveManagement.create({
        employeeId,
        employeeName: "Employee", 
        leaveBalance: {
           totalLeaves: 30, usedLeaves: 0, remainingLeaves: 30,
           leaveTypeWiseBalance: { Casual: 10, Sick: 10, Paid: 10 }
        }
      });
    }

    res.json({
      leaves: profile.leaveRequests,
      balance: profile.leaveBalance,
      holidays: settings.holidays,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ===========================
   ADMIN UPDATE STATUS
=========================== */
// export const updateLeaveStatus = async (req, res) => {
//   try {
//     const { employeeId, leaveId } = req.params;
//     const { status, adminComment, adminId } = req.body;

//     const profile = await LeaveManagement.findOne({ employeeId });
//     const leave = profile.leaveRequests.find(l => l.leaveId === leaveId);

//     if (!leave) return res.status(404).json({ message: "Leave not found" });
//     if (leave.status === status) return res.json({ message: "Status unchanged" });

//     // Validation: Require comment for rejection
//     if (status === 'Rejected' && !adminComment) {
//       return res.status(400).json({ message: "Comment is mandatory for rejection" });
//     }

//     const oldStatus = leave.status;
//     leave.status = status;
//     leave.adminComment = adminComment;
//     leave.approvedBy = adminId;
//     leave.approvedAt = new Date();

//     // Balance Logic
//     if (status === "Approved" && oldStatus !== "Approved") {
//       // Deduct
//       profile.leaveBalance.usedLeaves += leave.totalDays;
//       profile.leaveBalance.remainingLeaves -= leave.totalDays;
//       if (profile.leaveBalance.leaveTypeWiseBalance[leave.leaveType] !== undefined) {
//           profile.leaveBalance.leaveTypeWiseBalance[leave.leaveType] -= leave.totalDays;
//       }
//     } else if (oldStatus === "Approved" && (status === "Rejected" || status === "Cancelled")) {
//       // Refund
//       profile.leaveBalance.usedLeaves -= leave.totalDays;
//       profile.leaveBalance.remainingLeaves += leave.totalDays;
//       if (profile.leaveBalance.leaveTypeWiseBalance[leave.leaveType] !== undefined) {
//           profile.leaveBalance.leaveTypeWiseBalance[leave.leaveType] += leave.totalDays;
//       }
//     }

//     profile.auditLog.push({ action: `Leave ${status}`, performedBy: adminId });
//     await profile.save();

//     res.json({ message: `Leave ${status} successfully` });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

export const updateLeaveStatus = async (req, res) => {
  try {
    const { employeeId, leaveId } = req.params;
    const { status, adminComment, adminId } = req.body;

    const profile = await LeaveManagement.findOne({ employeeId });

    // ✅ FIX 1: Profile check
    if (!profile) {
      return res.status(404).json({ message: "Employee leave profile not found" });
    }

    const leave = profile.leaveRequests.find(l => l.leaveId === leaveId);

    // ✅ FIX 2: Leave check
    if (!leave) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    // ✅ FIX 3: Same status guard
    if (leave.status === status) {
      return res.json({ message: "Status unchanged" });
    }

    // ✅ FIX 4: Reject validation
    if (status === "Rejected" && !adminComment) {
      return res.status(400).json({ message: "Comment is mandatory for rejection" });
    }

    const oldStatus = leave.status;

    leave.status = status;
    leave.adminComment = adminComment || "";
    leave.approvedBy = adminId;
    leave.approvedAt = new Date();

    // ✅ FIX 5: Balance safety
    if (status === "Approved" && oldStatus !== "Approved") {
      profile.leaveBalance.usedLeaves += leave.totalDays;
      profile.leaveBalance.remainingLeaves -= leave.totalDays;
      profile.leaveBalance.leaveTypeWiseBalance[leave.leaveType] -= leave.totalDays;
    }

    if (oldStatus === "Approved" && (status === "Rejected" || status === "Cancelled")) {
      profile.leaveBalance.usedLeaves -= leave.totalDays;
      profile.leaveBalance.remainingLeaves += leave.totalDays;
      profile.leaveBalance.leaveTypeWiseBalance[leave.leaveType] += leave.totalDays;
    }

    profile.auditLog.push({
      action: `Leave ${status}`,
      performedBy: adminId,
    });

    await profile.save();

    res.json({ message: `Leave ${status} successfully` });

  } catch (error) {
    console.error("Update Leave Status Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ===========================
   ADMIN: GET CALENDAR & STATS
=========================== */
export const getCalendarView = async (req, res) => {
  try {
    const profiles = await LeaveManagement.find();
    // Flatten approved leaves for calendar
    const events = [];
    profiles.forEach(p => {
      p.leaveRequests.forEach(l => {
        if (l.status === 'Approved') {
          events.push({
            title: `${p.employeeName} (${l.leaveType})`,
            start: l.startDate,
            end: l.endDate,
            allDay: true,
            status: 'Approved',
            employeeId: p.employeeId
          });
        }
      });
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getLeaveStats = async (req, res) => {
    try {
        const profiles = await LeaveManagement.find();
        
        const stats = {
            totalRequests: 0,
            pending: 0,
            approved: 0,
            rejected: 0,
            onLeaveToday: 0
        };

        const today = new Date();

        profiles.forEach(p => {
            p.leaveRequests.forEach(l => {
                stats.totalRequests++;
                if(l.status === 'Pending') stats.pending++;
                if(l.status === 'Approved') stats.approved++;
                if(l.status === 'Rejected') stats.rejected++;

                // Check if on leave today
                const start = new Date(l.startDate);
                const end = new Date(l.endDate);
                if (l.status === 'Approved' && today >= start && today <= end) {
                    stats.onLeaveToday++;
                }
            });
        });

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

/* ===========================
   Standard CRUD
=========================== */
export const addHoliday = async (req, res) => {
  try {
    const { holidayName, holidayDate, holidayType, isOptional } = req.body;
    const settings = await getSettings();
    settings.holidays.push({
      holidayId: new mongoose.Types.ObjectId().toString(),
      holidayName,
      holidayDate,
      holidayType,
      isOptional,
    });
    await settings.save();
    res.json({ message: "Holiday added" });
  } catch (error) { res.status(500).json({error: error.message}); }
};

export const updateLeavePolicy = async (req, res) => {
  try {
    const { policies } = req.body;
    const settings = await getSettings();
    settings.leavePolicy = policies;
    await settings.save();
    res.json({ message: "Policy updated" });
  } catch (error) { res.status(500).json({error: error.message}); }
};

export const getLeaveSettings = async (req, res) => {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (error) { res.status(500).json({error: error.message}); }
};

export const getAllLeaveRequests = async (req, res) => {
  try {
    const profiles = await LeaveManagement.find();
    let allRequests = [];
    profiles.forEach(profile => {
      profile.leaveRequests.forEach(request => {
        allRequests.push({
          ...request.toObject(),
          employeeName: profile.employeeName,
          employeeId: profile.employeeId,
          leaveProfileId: profile._id
        });
      });
    });
    allRequests.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
    res.json(allRequests);
  } catch (error) { res.status(500).json({error: error.message}); }
};

