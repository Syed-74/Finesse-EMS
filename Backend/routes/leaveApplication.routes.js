import express from "express";
import {
   applyLeave,
   getEmployeeLeaves,
   getMyLeaves,
   getAllLeaveRequests,
   updateLeaveStatus,
   approveLeave,
   rejectLeave,
   getTodayLeave,
   getLeaveStats
} from "../controllers/leaveApplication.controller.js";

import upload from "../middleware/upload.middleware.js";
import { protectAdmin } from "../middleware/adminAuth.middleware.js";
import { protectEmployee } from "../middleware/employeeAuth.middleware.js";
import { protectAll } from "../middleware/auth.middleware.js";

const router = express.Router();

/* ==============================
   APPLY LEAVE (EMPLOYEE)
   POST /api/leaveapplication
============================== */
router.post("/", protectEmployee, upload.single("attachment"), applyLeave);

/* ==============================
   GET EMPLOYEE LEAVES
   GET /api/leaveapplication/employee/:employeeId
============================== */
router.get("/employee/:employeeId", protectAll, getEmployeeLeaves);
router.get("/my", protectEmployee, getMyLeaves);
router.get("/today", protectEmployee, getTodayLeave);

/* ==============================
   GET ALL LEAVE REQUESTS (ADMIN/SELF)
   GET /api/leaveapplication
============================== */
router.get("/", protectAll, getAllLeaveRequests);

/* ==============================
   APPROVE / REJECT LEAVE (ADMIN)
   PUT /api/leaveapplication/approve/:id
   PUT /api/leaveapplication/reject/:id
============================== */
router.get("/stats", protectAdmin, getLeaveStats);
router.put("/approve/:id", protectAdmin, approveLeave);
router.put("/reject/:id", protectAdmin, rejectLeave);
router.put("/:id/status", protectAdmin, updateLeaveStatus);

export default router;