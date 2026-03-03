import mongoose from "mongoose";
import LeaveSettings from "../models/LeaveSettings.model.js";
import LeaveManagement from "../models/leaveManagement.model.js";

/* =====================================================
   ADMIN: CREATE OR UPDATE GLOBAL LEAVE SETTINGS
===================================================== */
export const upsertLeaveSettings = async (req, res) => {
  try {
    const existing = await LeaveSettings.findOne();

    if (existing) {
      const updated = await LeaveSettings.findByIdAndUpdate(
        existing._id,
        req.body,
        { new: true, runValidators: true }
      );

      return res.status(200).json({
        success: true,
        message: "Leave settings updated successfully",
        data: updated,
      });
    }

    const created = await LeaveSettings.create(req.body);

    res.status(201).json({
      success: true,
      message: "Leave settings created successfully",
      data: created,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =====================================================
   GET ACTIVE LEAVE SETTINGS
===================================================== */
export const getLeaveSettings = async (req, res) => {
  try {
    const settings = await LeaveSettings.findOne({ isActive: true });

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: "No leave settings found",
      });
    }

    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =====================================================
   APPLY LEAVE (WITH HOLIDAY EXCLUSION)
===================================================== */
export const applyLeave = async (req, res) => {

  try {
    const { employeeId, leaveType, startDate, endDate, employeeComment } =
      req.body;

    if (!employeeId || !leaveType || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    const settings = await LeaveSettings.findOne({ isActive: true });
    if (!settings) {
      return res.status(400).json({
        success: false,
        message: "Leave policy not configured",
      });
    }

    const policy = settings.leaveTypes.find(
      (l) => l.leaveType === leaveType
    );

    if (!policy) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave type",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date",
      });
    }

    /* =========================
       CALCULATE TOTAL DAYS
       (Exclude Holidays)
    ========================== */
    let totalDays = 0;
    let currentDate = new Date(start);

    while (currentDate <= end) {
      const day = currentDate.getDay();

      const isWeekend = day === 0 || day === 6; // Sunday=0, Saturday=6

      const isHoliday = settings.holidays.some(
        (holiday) =>
          holiday.holidayDate.toDateString() ===
          currentDate.toDateString()
      );

      if (!isWeekend && !isHoliday) {
        totalDays++;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (totalDays <= 0) {
      return res.status(400).json({
        success: false,
        message: "Selected dates fall on holidays only",
      });
    }

    /* =========================
       CALCULATE USED LEAVES
    ========================== */
    const used = await LeaveManagement.aggregate([
      {
        $match: {
          employeeId: new mongoose.Types.ObjectId(employeeId),
          leaveType,
          status: "Approved",
        },
      },
      {
        $group: {
          _id: null,
          totalUsed: { $sum: "$totalDays" },
        },
      },
    ]);

    const totalUsed = used[0]?.totalUsed || 0;

    /* =========================
       CALCULATE ALLOCATION
    ========================== */
    let allocated = 0;

    if (policy.allocationType === "YEARLY") {
      allocated = policy.totalPerYear;
    } else {
      const month = new Date().getMonth() + 1;
      allocated = policy.monthlyAccrual * month;
    }

    const remaining = allocated - totalUsed;

    if (remaining < totalDays) {
      return res.status(400).json({
        success: false,
        message: "Insufficient leave balance",
      });
    }

    /* =========================
       CREATE LEAVE REQUEST
    ========================== */
    const leave = await LeaveManagement.create({
      employeeId,
      leaveSettingId: settings._id,
      leaveType,
      startDate,
      endDate,
      totalDays,
      employeeComment,
    });

    res.status(201).json({
      success: true,
      message: "Leave applied successfully",
      data: leave,
    });
  } catch (error) {
    console.error("Apply Leave Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =====================================================
   GET ALL LEAVES (ADMIN)
===================================================== */
export const getAllLeaves = async (req, res) => {
  try {
    const leaves = await LeaveManagement.find()
      .populate("employeeId", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =====================================================
   GET LEAVES BY EMPLOYEE
===================================================== */
export const getEmployeeLeaves = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const leaves = await LeaveManagement.find({ employeeId }).sort({
      createdAt: -1,
    });

    res.status(200).json({ success: true, data: leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =====================================================
   UPDATE LEAVE STATUS (ADMIN)
===================================================== */
export const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminComment } = req.body;

    if (!["Pending", "Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const updated = await LeaveManagement.findByIdAndUpdate(
      id,
      { status, adminComment },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Leave updated successfully",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =====================================================
   GET UNPAID LEAVE SUMMARY FOR PAYROLL
   GET /api/leavemanagement/unpaid-summary/:employeeId?month=MM&year=YYYY
===================================================== */
export const getUnpaidLeaveSummary = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month, year } = req.query;

    if (!employeeId || !month || !year) {
      return res.status(400).json({
        success: false,
        message: "Employee ID, month, and year are required",
      });
    }

    const m = parseInt(month);
    const y = parseInt(year);

    // Get Leave Settings for Holidays
    const settings = await LeaveSettings.findOne({ isActive: true });
    const holidays = settings ? settings.holidays : [];

    // Define the start and end of the requested month
    const monthStart = new Date(y, m - 1, 1);
    const monthEnd = new Date(y, m, 0); // Last day of month

    // Fetch all Approved UNPAID leave requests for this employee
    // that overlap with the target month
    const leaves = await LeaveManagement.find({
      employeeId,
      leaveType: "UNPAID",
      status: "Approved",
      $or: [
        { startDate: { $lte: monthEnd }, endDate: { $gte: monthStart } }
      ]
    });

    let totalUnpaidDays = 0;

    leaves.forEach(leave => {
      // Find overlap between leave period and requested month
      const start = leave.startDate < monthStart ? monthStart : leave.startDate;
      const end = leave.endDate > monthEnd ? monthEnd : leave.endDate;

      let current = new Date(start);
      // Ensure we clear time for accurate date comparison
      current.setHours(0, 0, 0, 0);
      const overlapEnd = new Date(end);
      overlapEnd.setHours(0, 0, 0, 0);

      while (current <= overlapEnd) {
        const day = current.getDay();
        const isWeekend = day === 0 || day === 6; // Sunday=0, Saturday=6

        const isHoliday = holidays.some(
          (h) => {
            const hDate = new Date(h.holidayDate);
            hDate.setHours(0, 0, 0, 0);
            return hDate.getTime() === current.getTime();
          }
        );

        if (!isWeekend && !isHoliday) {
          totalUnpaidDays++;
        }

        current.setDate(current.getDate() + 1);
      }
    });

    res.status(200).json({
      success: true,
      unpaidLeaves: totalUnpaidDays
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};