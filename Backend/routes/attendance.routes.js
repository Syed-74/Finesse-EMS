import express from "express";
import {
  punchIn,
  punchOut,
  getMyAttendance,
  getEmployeeAttendance,
  getAllAttendance,
  updateAttendance
} from "../controllers/attendance.controller.js";
import { protectAdmin } from "../middleware/adminAuth.middleware.js";
import { protectEmployee } from "../middleware/employeeAuth.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();


// Employee actions
router.post("/punch-in", protectEmployee, upload.single("selfie"), punchIn);
router.post("/punch-out", protectEmployee, punchOut);
router.get("/my-attendance", protectEmployee, getMyAttendance);


// Admin view
router.get("/employee/:employeeId", protectAdmin, getEmployeeAttendance);
router.get("/all", protectAdmin, getAllAttendance); // Dashboard View
router.put("/:id", protectAdmin, updateAttendance); // Edit / Approve

export default router;
