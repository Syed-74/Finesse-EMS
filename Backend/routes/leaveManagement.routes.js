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

import authMiddleware from "../middleware/auth.middleware.js"; 

const router = express.Router();

// Initialize profile (Admin)
router.post("/profile", authMiddleware, createLeaveProfile);

// Employee
router.post("/apply/:employeeId", authMiddleware, applyLeave);
router.get("/employee/:employeeId", authMiddleware, getEmployeeLeaves);
router.get("/calendar", getCalendarView);

// Admin
router.get("/stats", authMiddleware, getLeaveStats);
router.get("/settings", authMiddleware, getLeaveSettings);
router.get("/all-requests", authMiddleware, getAllLeaveRequests);
router.put("/status/:employeeId/:leaveId", authMiddleware, updateLeaveStatus);
router.post("/holiday", authMiddleware, addHoliday);
router.put("/policy", authMiddleware, updateLeavePolicy);

export default router;
