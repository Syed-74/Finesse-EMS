import LeaveManagement from "../models/LeaveManagement.model.js";
import LeaveSettings from "../models/LeaveSettings.model.js";
import mongoose from "mongoose";
import { isWeekend, eachDayOfInterval, isSameDay, parseISO, differenceInMonths, startOfYear, isWithinInterval, format, isValid, isAfter } from "date-fns";

/* ===========================
   HELPER: Get Settings
=========================== */
const getSettings = async () => {
  let settings = await LeaveSettings.findOne();
  if (!settings) {
    settings = await LeaveSettings.create({
      leavePolicy: {
        Casual: { totalPerYear: 12, accrualType: "YEARLY", monthlyAccrual: 1, carryForward: false, maxCarryForward: 0 },
        Sick: { totalPerYear: 10, accrualType: "YEARLY", monthlyAccrual: 0.8, carryForward: false, maxCarryForward: 0 },
        Paid: { totalPerYear: 15, accrualType: "YEARLY", monthlyAccrual: 1.25, carryForward: true, maxCarryForward: 5 },
        Unpaid: { totalPerYear: 0, accrualType: "YEARLY", monthlyAccrual: 0, carryForward: false, maxCarryForward: 0 },
      },
      leaveCycle: { cycleType: "YEARLY", cycleStartMonth: 0 }, // Jan
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
    if (isWeekend(day)) return false;
    const isHoliday = holidays.some(h => isSameDay(new Date(h.holidayDate), day));
    if (isHoliday) return false;
    return true;
  });

  return workingDays.length;
};

/* ===========================
   HELPER: Dynamic Balance Calculation
=========================== */
const calculateLeaveBalance = (profile, settings) => {
  const policy = settings.leavePolicy;
  const cycle = settings.leaveCycle || { cycleType: "YEARLY", cycleStartMonth: 0 };
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-11

  // Calculate months passed in current cycle
  let monthsPassed = currentMonth - cycle.cycleStartMonth;
  if (monthsPassed < 0) monthsPassed += 12; // Wrap around if cycle starts later in year

  const balance = {
    totalLeaves: 0,
    usedLeaves: 0,
    remainingLeaves: 0,
    leaveTypeWiseBalance: {},
    detailedBalance: {}
  };

  const types = ["Casual", "Sick", "Paid", "Unpaid"];

  types.forEach(type => {
    const p = policy[type] || {};
    const stored = (profile.leaveBalance?.detailedBalance && profile.leaveBalance.detailedBalance[type])
      ? profile.leaveBalance.detailedBalance[type]
      : { used: 0, carriedForward: 0 };

    // 1. Calculate Total Allocation
    let total = 0;
    if (p.accrualType === "MONTHLY") {
      // Monthly Accrual: (Months Passed + 1) * Monthly Rate
      // +1 assumes accrual happens at start of month. If end, remove +1. 
      // HR standard is usually start or pro-rated. Let's start.
      total = ((monthsPassed + 1) * (p.monthlyAccrual || 0));
      // Cap at yearly max if defined (implied by totalPerYear acting as max)
      if (p.totalPerYear && total > p.totalPerYear) total = p.totalPerYear;
    } else {
      // Yearly Allocation
      total = p.totalPerYear || 0;
    }

    // Add Carry Forward
    if (p.carryForward) {
      total += (stored.carriedForward || 0);
    }

    // 2. Get Used
    const used = stored.used || 0;

    // 3. Remaining
    const remaining = Math.max(0, total - used);

    // Populate Balance Object
    balance.detailedBalance[type] = {
      total: Number(total.toFixed(1)),
      used: Number(used.toFixed(1)),
      remaining: Number(remaining.toFixed(1)),
      carriedForward: stored.carriedForward || 0,
      maxLeaves: p.totalPerYear || 0
    };

    balance.leaveTypeWiseBalance[type] = Number(remaining.toFixed(1));

    // Global Sums (excluding Unpaid usually, but let's include all valid types)
    if (type !== 'Unpaid') {
      balance.totalLeaves += Number(total.toFixed(1));
      balance.usedLeaves += Number(used.toFixed(1));
      balance.remainingLeaves += Number(remaining.toFixed(1));
    }
  });

  return balance;
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

    // Initialize with zeros, calculation happens on read
    const initialBalance = {
      totalLeaves: 0,
      usedLeaves: 0,
      remainingLeaves: 0,
      leaveTypeWiseBalance: {
        Casual: 0, Sick: 0, Paid: 0, Unpaid: 0
      },
      detailedBalance: {
        Casual: { total: 0, used: 0, carriedForward: 0 },
        Sick: { total: 0, used: 0, carriedForward: 0 },
        Paid: { total: 0, used: 0, carriedForward: 0 },
        Unpaid: { total: 0, used: 0, carriedForward: 0 },
      }
    };

    const profile = await LeaveManagement.create({
      employeeId,
      employeeName,
      departmentId,
      leaveBalance: initialBalance,
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
  console.log("Apply Leave Request Received:", { params: req.params, body: req.body });
  try {
    const { employeeId } = req.params;
    const { leaveType, startDate, endDate, reason, attachment, halfDay } = req.body;

    // 1. Validation Logic
    if (!employeeId || !mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ message: "Invalid or missing Employee ID" });
    }

    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ message: "Missing required fields: leaveType, startDate, endDate, and reason are mandatory." });
    }

    const startObj = new Date(startDate);
    const endObj = new Date(endDate);

    if (!isValid(startObj) || !isValid(endObj)) {
      return res.status(400).json({ message: "Invalid date format. Please use YYYY-MM-DD." });
    }

    if (isAfter(startObj, endObj)) {
      return res.status(400).json({ message: "Start date cannot be after end date." });
    }

    const profile = await LeaveManagement.findOne({ employeeId });
    if (!profile) {
      console.error(`Leave profile not found for employeeId: ${employeeId}`);
      return res.status(404).json({ message: "Leave profile not found. Please contact Admin to initialize your leave account." });
    }

    const settings = await getSettings();

    // 2. Calculate Days
    let calculatedDays = 0;
    try {
      if (halfDay) {
        calculatedDays = 0.5;
      } else {
        calculatedDays = calculateLeaveDays(startDate, endDate, settings.holidays);
      }
    } catch (calcError) {
      console.error("Calculation Error:", calcError);
      return res.status(400).json({ message: "Error calculating leave days." });
    }

    if (calculatedDays === 0) {
      return res.status(400).json({ message: "Selected dates are holidays or weekends. No working days found." });
    }

    // 2.1 Check Fixed Holidays in range
    const daysRequested = eachDayOfInterval({ start: startObj, end: endObj });
    for (const day of daysRequested) {
      const holiday = settings.holidays.find(h => isSameDay(new Date(h.holidayDate), day));
      if (holiday && !holiday.isOptional) {
        return res.status(400).json({ message: `Cannot apply leave on ${holiday.holidayName} (Fixed Holiday)` });
      }
    }

    // 3. Check Dynamic Balance
    const dynamicBalance = calculateLeaveBalance(profile, settings);
    const typeBalance = dynamicBalance.detailedBalance[leaveType];

    if (!typeBalance) {
      return res.status(400).json({ message: `Invalid leave type: ${leaveType}` });
    }

    if (typeBalance.remaining < calculatedDays) {
      return res.status(400).json({
        message: `Insufficient ${leaveType} balance. Remaining: ${typeBalance.remaining}, Requested: ${calculatedDays}`
      });
    }

    // 4. Overlap Check
    const isOverlap = profile.leaveRequests.some(req => {
      if (req.status === 'Rejected' || req.status === 'Cancelled') return false;
      const reqStart = new Date(req.startDate);
      const reqEnd = new Date(req.endDate);
      return (startObj <= reqEnd && endObj >= reqStart);
    });

    if (isOverlap) {
      return res.status(400).json({ message: "You already have a leave request for this period." });
    }

    // 5. Team Conflict Rule (Max 3 in same department)
    if (profile.departmentId) {
      const profilesInDept = await LeaveManagement.find({
        departmentId: profile.departmentId,
        employeeId: { $ne: employeeId }
      });
      const maxPerDept = 3;

      for (const day of daysRequested) {
        if (isWeekend(day)) continue;
        let count = 0;
        profilesInDept.forEach(p => {
          p.leaveRequests.forEach(l => {
            if (l.status === 'Approved' && isWithinInterval(day, { start: new Date(l.startDate), end: new Date(l.endDate) })) {
              count++;
            }
          });
        });

        if (count >= maxPerDept) {
          return res.status(400).json({
            message: `Department leave limit reached for ${format(day, 'MMM d')}. Max ${maxPerDept} employees allowed.`
          });
        }
      }
    }

    // 6. Final Push
    const leaveId = new mongoose.Types.ObjectId().toString();
    profile.leaveRequests.push({
      leaveId,
      leaveType,
      startDate: startObj,
      endDate: endObj,
      totalDays: calculatedDays,
      reason,
      attachment,
      halfDay,
      status: "Pending"
    });

    profile.auditLog.push({ action: "Leave Applied", performedBy: employeeId.toString() });
    await profile.save();

    console.log(`Success: Leave applied for ${employeeId}, LeaveID: ${leaveId}`);
    res.json({ message: "Leave applied successfully!", leaveId, days: calculatedDays });

  } catch (error) {
    console.error("APPLY LEAVE CRASH:", error);
    res.status(500).json({
      message: "Internal Server Error during leave application.",
      error: error.message
    });
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
      // Auto-create for UX if missing
      profile = await LeaveManagement.create({
        employeeId,
        employeeName: "Employee",
        leaveBalance: {
          totalLeaves: 0, usedLeaves: 0, remainingLeaves: 0,
          leaveTypeWiseBalance: { Casual: 0, Sick: 0, Paid: 0, Unpaid: 0 },
          detailedBalance: {
            Casual: { total: 0, used: 0, carriedForward: 0 },
            Sick: { total: 0, used: 0, carriedForward: 0 },
            Paid: { total: 0, used: 0, carriedForward: 0 },
            Unpaid: { total: 0, used: 0, carriedForward: 0 }
          }
        }
      });
    }

    // Calculate Dynamic Balance to send to frontend
    const dynamicBalance = calculateLeaveBalance(profile, settings);

    res.json({
      leaves: profile.leaveRequests,
      balance: dynamicBalance, // Send calculated balance
      holidays: settings.holidays,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ===========================
   ADMIN UPDATE STATUS
=========================== */
export const updateLeaveStatus = async (req, res) => {
  try {
    const { employeeId, leaveId } = req.params;
    const { status, adminComment, adminId } = req.body;

    const profile = await LeaveManagement.findOne({ employeeId });
    if (!profile) return res.status(404).json({ message: "Employee leave profile not found" });

    const leave = profile.leaveRequests.find(l => l.leaveId === leaveId);
    if (!leave) return res.status(404).json({ message: "Leave request not found" });

    if (leave.status === status) return res.json({ message: "Status unchanged" });

    if (status === "Rejected" && !adminComment) {
      return res.status(400).json({ message: "Comment is mandatory for rejection" });
    }

    const oldStatus = leave.status;
    leave.status = status;
    leave.adminComment = adminComment || "";
    leave.approvedBy = adminId;
    leave.approvedAt = new Date();

    // Update USED balance only. Total/Remaining are calculated dynamically.
    if (status === "Approved" && oldStatus !== "Approved") {
      profile.leaveBalance.usedLeaves += leave.totalDays;

      // Update Detailed Balance
      if (!profile.leaveBalance.detailedBalance) profile.leaveBalance.detailedBalance = {};

      if (!profile.leaveBalance.detailedBalance[leave.leaveType]) {
        profile.leaveBalance.detailedBalance[leave.leaveType] = { total: 0, used: 0, carriedForward: 0 };
      }

      profile.leaveBalance.detailedBalance[leave.leaveType].used += leave.totalDays;
      // We do NOT subtract from total here because total is dynamic. 
      // We only track USED.
    }

    if (oldStatus === "Approved" && (status === "Rejected" || status === "Cancelled")) {
      profile.leaveBalance.usedLeaves -= leave.totalDays;

      if (profile.leaveBalance.detailedBalance && profile.leaveBalance.detailedBalance[leave.leaveType]) {
        profile.leaveBalance.detailedBalance[leave.leaveType].used -= leave.totalDays;
      }
    }

    profile.auditLog.push({ action: `Leave ${status}`, performedBy: adminId });
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
    const settings = await getSettings();
    const events = [];

    // Add Leaves
    profiles.forEach(p => {
      p.leaveRequests.forEach(l => {
        // Multi-status for employee view
        events.push({
          id: l.leaveId,
          title: `${p.employeeName} (${l.leaveType})`,
          start: l.startDate,
          end: l.endDate,
          status: l.status,
          employeeId: p.employeeId,
          employeeName: p.employeeName,
          type: 'leave',
          leaveType: l.leaveType,
          departmentId: p.departmentId
        });
      });
    });

    // Add Holidays
    settings.holidays.forEach(h => {
      events.push({
        id: h.holidayId,
        title: h.holidayName,
        start: h.holidayDate,
        end: h.holidayDate,
        type: 'holiday',
        holidayType: h.holidayType,
        isOptional: h.isOptional
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
    const settings = await getSettings();

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
        if (l.status === 'Pending') stats.pending++;
        if (l.status === 'Approved') stats.approved++;
        if (l.status === 'Rejected') stats.rejected++;

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
/* ===========================
   HOLIDAY CRUD
=========================== */
export const addHoliday = async (req, res) => {
  try {
    const { holidayName, holidayDate, holidayType, isOptional } = req.body;
    const settings = await getSettings();

    // Prevent Duplicates
    const exists = settings.holidays.some(h => isSameDay(new Date(h.holidayDate), new Date(holidayDate)));
    if (exists) return res.status(400).json({ message: "A holiday already exists on this date." });

    settings.holidays.push({
      holidayId: new mongoose.Types.ObjectId().toString(),
      holidayName,
      holidayDate,
      holidayType,
      isOptional: isOptional || false,
    });
    await settings.save();
    res.json({ message: "Holiday added successfully" });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const updateHoliday = async (req, res) => {
  try {
    const { holidayId } = req.params;
    const { holidayName, holidayDate, holidayType, isOptional } = req.body;
    const settings = await getSettings();

    const hIndex = settings.holidays.findIndex(h => h.holidayId === holidayId);
    if (hIndex === -1) return res.status(404).json({ message: "Holiday not found" });

    settings.holidays[hIndex] = {
      ...settings.holidays[hIndex].toObject(),
      holidayName,
      holidayDate,
      holidayType,
      isOptional
    };

    await settings.save();
    res.json({ message: "Holiday updated successfully" });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const deleteHoliday = async (req, res) => {
  try {
    const { holidayId } = req.params;
    const settings = await getSettings();
    settings.holidays = settings.holidays.filter(h => h.holidayId !== holidayId);
    await settings.save();
    res.json({ message: "Holiday deleted successfully" });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const updateLeavePolicy = async (req, res) => {
  try {
    const { leavePolicy, leaveCycle } = req.body; // Expecting structured object now
    const settings = await getSettings();

    if (leavePolicy) settings.leavePolicy = leavePolicy;
    if (leaveCycle) settings.leaveCycle = leaveCycle;

    await settings.save();
    res.json({ message: "Policy updated", settings });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const getLeaveSettings = async (req, res) => {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (error) { res.status(500).json({ error: error.message }); }
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
  } catch (error) { res.status(500).json({ error: error.message }); }
};

