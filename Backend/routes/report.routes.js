
import express from "express";
import { protectAdmin } from "../middleware/adminAuth.middleware.js";
import {
    getDashboardSummary,
    getAttendanceTrends,
    getDepartmentStats,
    getLeaveAnalytics
} from "../controllers/report.controller.js";

const router = express.Router();

router.get("/summary", protectAdmin, getDashboardSummary);
router.get("/attendance-trend", protectAdmin, getAttendanceTrends);
router.get("/department-stats", protectAdmin, getDepartmentStats);
router.get("/leave-summary", protectAdmin, getLeaveAnalytics);

export default router;
