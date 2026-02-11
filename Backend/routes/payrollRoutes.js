import express from "express";
const router = express.Router();

import { payrollController } from "../controllers/payrollController.js";

// 🔐 Auth Middleware
import { protectAdmin } from "../middleware/adminAuth.middleware.js";
import { protectEmployee } from "../middleware/employeeAuth.middleware.js";
import { protectAll } from "../middleware/auth.middleware.js";

/*
=========================================================
  ADMIN ROUTES
=========================================================
*/

// Generate payroll
router.post(
  "/generate",
  protectAdmin,
  payrollController.generate
);

// Get all payrolls
router.get(
  "/",
  protectAdmin,
  payrollController.getAll
);

// Approve payroll
router.put(
  "/approve/:id",
  protectAdmin,
  payrollController.approve
);

// Mark payroll as paid
router.put(
  "/pay/:id",
  protectAdmin,
  payrollController.markAsPaid
);

// Update payroll (Draft only)
router.put(
  "/:id",
  protectAdmin,
  payrollController.update
);

// Delete payroll (Draft only)
router.delete(
  "/:id",
  protectAdmin,
  payrollController.delete
);

/*
=========================================================
  EMPLOYEE ROUTES
=========================================================
*/

// Get my payrolls
router.get(
  "/my/list",
  protectEmployee,
  payrollController.getMy
);

// Get single payroll (employee can view their own)
router.get(
  "/my/:id",
  protectEmployee,
  payrollController.getOne
);

// Download payslip (Secure for both Admin & Employee)
router.get(
  "/payslip/:id",
  protectAll,
  payrollController.downloadPayslip
);

export default router;
