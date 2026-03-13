import LeaveBalance from "../models/LeaveBalance.model.js";


// Create Leave Balance
export const createLeaveBalance = async (req, res) => {
  try {
    const leaveBalance = new LeaveBalance(req.body);
    const savedLeaveBalance = await leaveBalance.save();

    res.status(201).json(savedLeaveBalance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Get All Leave Balances
export const getAllLeaveBalances = async (req, res) => {
  try {
    const balances = await LeaveBalance.find().populate("employeeId");

    res.status(200).json(balances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Get Leave Balance by Employee
export const getLeaveBalanceByEmployee = async (req, res) => {
  try {
    // If req.employee exists (protectedEmployee middleware used), 
    // enforce their own ID. Otherwise (admin), use param.
    const employeeId = req.employee ? req.employee._id : req.params.employeeId;

    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID is required" });
    }

    const balances = await LeaveBalance.find({ employeeId }).populate("employeeId");

    res.status(200).json(balances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Update Leave Balance
export const updateLeaveBalance = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedBalance = await LeaveBalance.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    res.status(200).json(updatedBalance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Delete Leave Balance
export const deleteLeaveBalance = async (req, res) => {
  try {
    const { id } = req.params;

    await LeaveBalance.findByIdAndDelete(id);

    res.status(200).json({ message: "Leave Balance deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};