import express from "express";
import {
  applyLeave,
  getEmployeeLeaves,
  getAllLeaveRequests,
  updateLeaveStatus
} from "../controllers/leaveApplication.controller.js";

const router = express.Router();

/* ==============================
   APPLY LEAVE (EMPLOYEE)
   POST /api/leave-applications
============================== */
router.post("/", applyLeave);

/* ==============================
   GET EMPLOYEE LEAVES
   GET /api/leave-applications/employee/:employeeId
============================== */
router.get("/employee/:employeeId", getEmployeeLeaves);

/* ==============================
   GET ALL LEAVE REQUESTS (ADMIN)
   GET /api/leave-applications
============================== */
router.get("/", getAllLeaveRequests);

/* ==============================
   APPROVE / REJECT LEAVE
   PUT /api/leave-applications/:id/status
============================== */
router.put("/:id/status", updateLeaveStatus);

export default router;