import express from "express";
import { payrollController } from "../controllers/payrollController.js";

// 🔐 Auth Middleware
import { protectAdmin } from "../middleware/adminAuth.middleware.js";
import { protectEmployee } from "../middleware/employeeAuth.middleware.js";
import { protectAll } from "../middleware/auth.middleware.js";

const router = express.Router();

/* =========================================================
   ADMIN ROUTES
========================================================= */

/*
Generate Payroll
POST /api/payroll/generate
*/
router.post("/generate", protectAdmin, payrollController.generate);

/*
Get All Payrolls
GET /api/payroll
*/
router.get("/", protectAdmin, payrollController.getAll);

/*
Preview Payroll
GET & POST /api/payroll/preview
*/
router.get("/preview", protectAdmin, payrollController.preview);
router.post("/preview", protectAdmin, payrollController.preview);

/*
Approve Payroll
PUT /api/payroll/approve/:id
*/
router.put("/approve/:id", protectAdmin, payrollController.approve);

/*
Mark Payroll as Paid
PUT /api/payroll/pay/:id
*/
router.put("/pay/:id", protectAdmin, payrollController.markAsPaid);

/*
Update Payroll (Draft Only)
PUT /api/payroll/:id
*/
router.put("/:id", protectAdmin, payrollController.update);

/*
Delete Payroll (Draft Only)
DELETE /api/payroll/:id
*/
router.delete("/:id", protectAdmin, payrollController.delete);

/* =========================================================
   EMPLOYEE ROUTES
========================================================= */

/*
Get My Payroll List
GET /api/payroll/my/list
*/
router.get("/my/list", protectEmployee, payrollController.getMy);

/*
Get Single Payroll
GET /api/payroll/my/:id
*/
router.get("/my/:id", protectEmployee, payrollController.getOne);

/*
Download Payslip (Admin + Employee)
GET /api/payroll/payslip/:id
*/
router.get("/payslip/:id", protectAll, payrollController.downloadPayslip);

export default router;