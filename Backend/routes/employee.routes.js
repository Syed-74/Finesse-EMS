import express from "express";
import {
    createEmployee,
    getAllEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
    getEmployeeProfile,
    updateEmployeeProfileImage,
} from "../controllers/employee.controllers.js";

import { protectAdmin } from "../middleware/adminAuth.middleware.js";
import { protectAll } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

/* =========================
   SELF PROFILE (EMPLOYEE ACCESS)
========================= */
// Available to any authenticated user (Employee/Admin)
router.get("/me", protectAll, getEmployeeProfile);
router.put("/me/image", protectAll, upload.single("profileImage"), updateEmployeeProfileImage);


/* =========================
   ADMIN → EMPLOYEE ROUTES
========================= */

router.post("/", protectAdmin, createEmployee);
router.get("/", protectAdmin, getAllEmployees);
router.get("/:id", protectAdmin, getEmployeeById);
router.put("/:id", protectAdmin, updateEmployee);
router.delete("/:id", protectAdmin, deleteEmployee);


export default router;
