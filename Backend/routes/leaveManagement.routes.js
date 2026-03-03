import express from "express";
import {
   upsertLeaveSettings,
   getLeaveSettings,
   applyLeave,
   getAllLeaves,
   getEmployeeLeaves,
   updateLeaveStatus,
   getUnpaidLeaveSummary,
} from "../controllers/leaveManagement.controllers.js";

const router = express.Router();

/* =====================================================
   GLOBAL LEAVE SETTINGS (ADMIN)
===================================================== */

// Create or Update Global Leave Policy
router.post("/settings", upsertLeaveSettings);

// Get Active Leave Policy
router.get("/settings", getLeaveSettings);


/* =====================================================
   LEAVE REQUESTS
===================================================== */

// Apply Leave (Employee)
router.post("/", applyLeave);

// Get All Leave Requests (Admin)
router.get("/", getAllLeaves);

// Get Leave Requests By Employee
router.get("/employee/:employeeId", getEmployeeLeaves);

// Update Leave Status (Approve / Reject)
router.patch("/:id/status", updateLeaveStatus);

// Get Unpaid Leave Summary (Admin/Payroll)
router.get("/unpaid-summary/:employeeId", getUnpaidLeaveSummary);

export default router;