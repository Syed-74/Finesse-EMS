import express from "express";
import { createShift, getAllShifts, assignShiftToEmployee, getMyShift, updateShift, deleteShift } from "../controllers/shift.controller.js";
import { protectAdmin } from "../middleware/adminAuth.middleware.js";
import { protectEmployee } from "../middleware/employeeAuth.middleware.js";

const router = express.Router();

// Admin routes
router.post("/", protectAdmin, createShift);
router.get("/all", protectAdmin, getAllShifts);
router.put("/:id", protectAdmin, updateShift);
router.delete("/:id", protectAdmin, deleteShift);
router.post("/assign", protectAdmin, assignShiftToEmployee);

// Employee routes
router.get("/my-shift", protectEmployee, getMyShift);

export default router;
