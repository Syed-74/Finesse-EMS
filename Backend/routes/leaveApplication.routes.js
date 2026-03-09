import express from "express";
import {
   applyLeave,
   getEmployeeLeaves,
   getAllLeaveRequests,
   updateLeaveStatus,
   approveLeave,
   rejectLeave
} from "../controllers/leaveApplication.controller.js";

import upload from "../middleware/upload.middleware.js";

const router = express.Router();

/* ==============================
   APPLY LEAVE (EMPLOYEE)
   POST /api/leave-applications
============================== */
router.post("/", upload.single("attachment"), applyLeave);

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
   APPROVE / REJECT LEAVE (ADMIN)
   PUT /api/leaveapplication/approve/:id
   PUT /api/leaveapplication/reject/:id
============================== */
router.put("/approve/:id", approveLeave);
router.put("/reject/:id", rejectLeave);
router.put("/:id/status", updateLeaveStatus);

export default router;