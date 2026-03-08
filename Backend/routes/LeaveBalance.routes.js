import express from "express";
import {
  createLeaveBalance,
  getAllLeaveBalances,
  getLeaveBalanceByEmployee,
  updateLeaveBalance,
  deleteLeaveBalance
} from "../controllers/LeaveBalance.controller.js";

const router = express.Router();


// Create Leave Balance
router.post("/create", createLeaveBalance);


// Get All Leave Balances
router.get("/", getAllLeaveBalances);


// Get Leave Balance by Employee
router.get("/employee/:employeeId", getLeaveBalanceByEmployee);


// Update Leave Balance
router.put("/update/:id", updateLeaveBalance);


// Delete Leave Balance
router.delete("/delete/:id", deleteLeaveBalance);


export default router;