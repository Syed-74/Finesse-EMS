import express from "express";
import {
  punchIn,
  punchOut,
  getMyAttendance,
  getEmployeeAttendance,
  getAllAttendance,
  updateAttendance,
  startBreak,
  endBreak,
  requestRegularization,
  getRegularizationRequests,
  approveRegularization,
  rejectRegularization,
  getAuditLogs
} from "../controllers/attendance.controller.js";
import { protectAdmin } from "../middleware/adminAuth.middleware.js";
import { protectEmployee } from "../middleware/employeeAuth.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();


// Employee actions
router.post(
  "/punch-in",
  protectEmployee,
  (req, res, next) => {
    upload.single("selfie")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  punchIn
);
router.post("/punch-out", protectEmployee, punchOut);
router.post("/start-break", protectEmployee, startBreak);
router.post("/end-break", protectEmployee, endBreak);
router.post("/regularize", protectEmployee, requestRegularization);
router.get("/my-attendance", protectEmployee, getMyAttendance);
router.get("/debug-my-shift", protectEmployee, async (req, res) => {
  try {
    const Employee = (await import("../models/Employee.model.js")).default;
    const emp = await Employee.findById(req.employee._id).populate("shiftId");
    res.json({
      employeeId: req.employee._id,
      hasProfile: !!emp,
      hasShiftId: !!emp?.shiftId,
      shiftInfo: emp?.shiftId || "None"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Admin view
router.get("/employee/:employeeId", protectAdmin, getEmployeeAttendance);
router.get("/all", protectAdmin, getAllAttendance); // Dashboard View
router.put("/:id", protectAdmin, updateAttendance); // Edit

// Regularization & Audit
router.get("/regularization-requests", protectAdmin, getRegularizationRequests);
router.post("/approve-regularize", protectAdmin, approveRegularization);
router.post("/reject-regularize", protectAdmin, rejectRegularization);
router.get("/audit-logs", protectAdmin, getAuditLogs);

export default router;
