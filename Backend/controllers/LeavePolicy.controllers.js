import LeavePolicy from "../models/LeavePolicy.model.js";
import LeaveBalance from "../models/LeaveBalance.model.js";
import Employee from "../models/Employee.model.js";
/* ==============================
   CREATE LEAVE POLICY (ADMIN)
============================== */
// export const createLeavePolicy = async (req, res) => {
//   try {
//     const { year } = req.body;

//     const existingPolicy = await LeavePolicy.findOne({ year });

//     if (existingPolicy) {
//       return res.status(400).json({
//         success: false,
//         message: "Leave policy for this year already exists",
//       });
//     }

//     // deactivate old policies
//     await LeavePolicy.updateMany({}, { isActive: false });

//     const policy = await LeavePolicy.create(req.body);

//     res.status(201).json({
//       success: true,
//       message: "Leave policy created successfully",
//       data: policy,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

export const createLeavePolicy = async (req, res) => {
  try {
    const { year } = req.body;

    const existingPolicy = await LeavePolicy.findOne({ year });

    if (existingPolicy) {
      return res.status(400).json({
        success: false,
        message: "Leave policy for this year already exists",
      });
    }

    // deactivate old policies
    await LeavePolicy.updateMany({}, { isActive: false });

    // create new policy
    const policy = await LeavePolicy.create(req.body);

    /* ==================================
       GENERATE LEAVE BALANCE FOR EMPLOYEES
    ================================== */

    const employees = await Employee.find();

    for (const emp of employees) {
      for (const type of policy.leaveTypes) {
        await LeaveBalance.create({
          employeeId: emp._id,
          leaveType: type.leaveType,
          totalAllocated: type.totalPerYear,
          usedLeaves: 0,
          remainingLeaves: type.totalPerYear,
          year: policy.year,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: "Leave policy created and leave balances generated",
      data: policy,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ==============================
   GET CURRENT ACTIVE POLICY
============================== */
export const getCurrentLeavePolicy = async (req, res) => {
  try {
    const policy = await LeavePolicy.findOne({ isActive: true });

    if (!policy) {
      return res.status(200).json({
        success: true,
        data: null,
        message: "No active leave policy found",
      });
    }

    res.status(200).json({
      success: true,
      data: policy,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ==============================
   GET ALL POLICIES
============================== */
export const getAllLeavePolicies = async (req, res) => {
  try {
    const policies = await LeavePolicy.find().sort({ year: -1 });

    res.status(200).json({
      success: true,
      data: policies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ==============================
   UPDATE POLICY
============================== */
export const updateLeavePolicy = async (req, res) => {
  try {
    const { id } = req.params;

    const policy = await LeavePolicy.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    res.status(200).json({
      success: true,
      message: "Leave policy updated",
      data: policy,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};