import express from "express";
import {
  createLeaveBalance,
  getAllLeaveBalances,
  getLeaveBalanceByEmployee,
  updateLeaveBalance,
  deleteLeaveBalance
} from "../controllers/LeaveBalance.controller.js";
import { protectAdmin } from "../middleware/adminAuth.middleware.js";
import { protectEmployee } from "../middleware/employeeAuth.middleware.js";
import { protectAll } from "../middleware/auth.middleware.js";

const router = express.Router();


// Create Leave Balance
router.post("/create", protectAdmin, createLeaveBalance);


// Get All Leave Balances
router.get("/", protectAdmin, getAllLeaveBalances);


// Get Leave Balance by Employee
router.get("/employee/:employeeId", protectAll, getLeaveBalanceByEmployee);
router.get("/my", protectEmployee, getLeaveBalanceByEmployee);


// Update Leave Balance
router.put("/update/:id", protectAdmin, updateLeaveBalance);


// Delete Leave Balance
router.delete("/delete/:id", protectAdmin, deleteLeaveBalance);


export default router;