import express from "express";
import {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} from "../controllers/employee.controllers.js";

import { protectAdmin } from "../middleware/adminAuth.middleware.js";

const router = express.Router();

/* =========================
   ADMIN → EMPLOYEE ROUTES
========================= */

router.post("/", protectAdmin, createEmployee);
router.get("/", protectAdmin, getAllEmployees);
router.get("/:id", protectAdmin, getEmployeeById);
router.put("/:id", protectAdmin, updateEmployee);
router.delete("/:id", protectAdmin, deleteEmployee);


 


export default router;
