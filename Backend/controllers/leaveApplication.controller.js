import LeaveApplication from "../models/LeaveApplication.model.js";
import LeavePolicy from "../models/LeavePolicy.model.js";
import LeaveBalance from "../models/LeaveBalance.model.js";


import {calculateLeaveDays} from "../utils/calculateLeaveDays.js";
import {checkLeaveOverlap} from "../utils/validateLeaveOverlap.js";

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

    const { employeeId, leaveType, startDate, endDate, employeeComment } = req.body;

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


    const totalDays = calculateLeaveDays(startDate, endDate, policy.holidays);


    const balance = await LeaveBalance.findOne({
      employeeId,
      leaveType,
      year: policy.year
    });


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
      employeeComment

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

    // update leave status
    leave.status = status;
    leave.adminComment = adminComment;
    leave.approvedAt = new Date();

    await leave.save();

    /* ==================================
       UPDATE LEAVE BALANCE IF APPROVED
    ================================== */

    if (status === "Approved") {
      const balance = await LeaveBalance.findOne({
        employeeId: leave.employeeId,
        leaveType: leave.leaveType,
      });

      if (balance) {
        balance.usedLeaves += leave.totalDays;
        balance.remainingLeaves -= leave.totalDays;

        await balance.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Leave status updated successfully",
      data: leave,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
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