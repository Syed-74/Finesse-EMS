import LeaveApplication from "../models/LeaveApplication.model.js";
import LeavePolicy from "../models/LeavePolicy.model.js";
import LeaveBalance from "../models/LeaveBalance.model.js";


import { calculateLeaveDays } from "../utils/calculateLeaveDays.js";
import { checkLeaveOverlap } from "../utils/validateLeaveOverlap.js";

/* ==============================
   APPLY LEAVE (EMPLOYEE)
============================== */
// export const applyLeave = async (req, res) => {
//   try {
//     const activePolicy = await LeavePolicy.findOne({ isActive: true });

//     if (!activePolicy) {
//       return res.status(400).json({
//         success: false,
//         message: "No active leave policy available",
//       });
//     }

//     const leave = await LeaveApplication.create({
//       ...req.body,
//       leavePolicyId: activePolicy._id,
//     });

//     res.status(201).json({
//       success: true,
//       message: "Leave request submitted",
//       data: leave,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

export const applyLeave = async (req, res) => {

  try {

    const { employeeId, leaveType, startDate, endDate, employeeComment, isHalfDay } = req.body;

    const policy = await LeavePolicy.findOne({ isActive: true });

    if (!policy) {
      return res.status(400).json({ message: "No active leave policy" });
    }


    const leaveTypePolicy = policy.leaveTypes.find(
      l => l.leaveType === leaveType
    );

    if (!leaveTypePolicy) {
      return res.status(400).json({ message: "Invalid leave type" });
    }


    const overlap = await checkLeaveOverlap(employeeId, startDate, endDate);

    if (overlap) {
      return res.status(400).json({ message: "Leave dates overlap" });
    }


    const totalDays = calculateLeaveDays(startDate, endDate, policy.holidays, isHalfDay);

    // Feature Requirement: Sick Leave → Attachment is required.
    if (leaveType === "Sick Leave" && !req.file) {
      return res.status(400).json({
        message: "Attachment is required for Sick Leave."
      });
    }

    let balance = await LeaveBalance.findOne({
      employeeId,
      leaveType,
      year: policy.year
    });

    if (!balance) {
      balance = await LeaveBalance.create({
        employeeId,
        leaveType,
        totalAllocated: leaveTypePolicy.totalPerYear,
        usedLeaves: 0,
        remainingLeaves: leaveTypePolicy.totalPerYear,
        year: policy.year,
      });
    }


    if (leaveTypePolicy.category === "PAID") {

      if (!balance || balance.remainingLeaves < totalDays) {
        return res.status(400).json({
          message: "Insufficient leave balance"
        });
      }

    }


    const leave = await LeaveApplication.create({

      employeeId,
      leavePolicyId: policy._id,
      leaveType,
      startDate,
      endDate,
      totalDays,
      employeeComment,
      attachment: req.file ? req.file.filename : null

    });


    res.status(201).json({
      success: true,
      data: leave
    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }

};
/* ==============================
   GET EMPLOYEE LEAVES
============================== */
export const getEmployeeLeaves = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const leaves = await LeaveApplication.find({ employeeId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: leaves,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ==============================
   GET ALL LEAVE REQUESTS (ADMIN)
============================== */
export const getAllLeaveRequests = async (req, res) => {
  try {
    const leaves = await LeaveApplication.find()
      .populate("employeeId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: leaves,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ==============================
   APPROVE / REJECT LEAVE
============================== */
/* ==============================
   UPDATE LEAVE STATUS
============================== */
export const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminComment } = req.body;

    const leave = await LeaveApplication.findById(id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    const previousStatus = leave.status;

    // Handle Balance Updates
    if (status === "Approved" && previousStatus !== "Approved") {
      // Get associated policy to know the year and allocation
      const policy = await LeavePolicy.findById(leave.leavePolicyId);
      if (!policy) {
        return res.status(400).json({
          success: false,
          message: "Associated leave policy not found",
        });
      }

      // Find or Initialize Balance
      let balance = await LeaveBalance.findOne({
        employeeId: leave.employeeId,
        leaveType: leave.leaveType,
        year: policy.year,
      });

      if (!balance) {
        const typePolicy = policy.leaveTypes.find(
          (t) => t.leaveType === leave.leaveType
        );

        if (!typePolicy) {
          return res.status(400).json({
            success: false,
            message: `Leave type ${leave.leaveType} not found in policy`,
          });
        }

        // Auto-create balance record
        balance = await LeaveBalance.create({
          employeeId: leave.employeeId,
          leaveType: leave.leaveType,
          totalAllocated: typePolicy.totalPerYear,
          usedLeaves: 0,
          remainingLeaves: typePolicy.totalPerYear,
          year: policy.year,
        });
      }

      // Check balance availability
      if (balance.remainingLeaves < leave.totalDays) {
        return res.status(400).json({
          success: false,
          message: `Insufficient balance: ${balance.remainingLeaves} days remaining, but ${leave.totalDays} requested.`,
        });
      }

      // Deduct Balance
      balance.usedLeaves += leave.totalDays;
      balance.remainingLeaves -= leave.totalDays;
      await balance.save();
    } else if (previousStatus === "Approved" && status !== "Approved") {
      // Restore Balance
      const policy = await LeavePolicy.findById(leave.leavePolicyId);
      const balance = await LeaveBalance.findOne({
        employeeId: leave.employeeId,
        leaveType: leave.leaveType,
        year: policy?.year || new Date().getFullYear(),
      });

      if (balance) {
        balance.usedLeaves -= leave.totalDays;
        balance.remainingLeaves += leave.totalDays;
        await balance.save();
      }
    }

    // Update leave application
    leave.status = status;
    leave.adminComment = adminComment || leave.adminComment;
    if (status === "Approved") {
      leave.approvedAt = new Date();
    }

    await leave.save();

    res.status(200).json({
      success: true,
      message: `Leave status updated to ${status}`,
      data: leave,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ==============================
   APPROVE LEAVE (ADMIN)
============================== */
export const approveLeave = async (req, res) => {
  req.body.status = "Approved";
  return updateLeaveStatus(req, res);
};

/* ==============================
   REJECT LEAVE (ADMIN)
============================== */
export const rejectLeave = async (req, res) => {
  req.body.status = "Rejected";
  return updateLeaveStatus(req, res);
};
// export const updateLeaveStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status, adminComment } = req.body;

//     const leave = await LeaveApplication.findByIdAndUpdate(
//       id,
//       {
//         status,
//         adminComment,
//         approvedAt: new Date(),
//       },
//       { new: true }
//     );

//     res.status(200).json({
//       success: true,
//       message: "Leave status updated",
//       data: leave,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };