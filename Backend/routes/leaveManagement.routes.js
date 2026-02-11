import express from "express";
import {
  createLeaveProfile,
  applyLeave,
  getEmployeeLeaves,
  updateLeaveStatus,
  addHoliday,
  updateLeavePolicy,
  getLeaveSettings,
  getAllLeaveRequests,
  getCalendarView,
  getLeaveStats
} from "../controllers/leaveManagement.controllers.js";

import { protectAll } from "../middleware/auth.middleware.js"; 

const router = express.Router();

// Initialize profile (Admin)
router.post("/profile", protectAll, createLeaveProfile);

// Employee
router.post("/apply/:employeeId", protectAll, applyLeave);
router.get("/employee/:employeeId", protectAll, getEmployeeLeaves);
router.get("/calendar", getCalendarView);

// Admin
router.get("/stats", protectAll, getLeaveStats);
router.get("/settings", protectAll, getLeaveSettings);
router.get("/all-requests", protectAll, getAllLeaveRequests);
router.put("/status/:employeeId/:leaveId", protectAll, updateLeaveStatus);
router.post("/holiday", protectAll, addHoliday);
router.put("/policy", protectAll, updateLeavePolicy);

export default router;
