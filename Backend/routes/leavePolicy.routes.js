import express from "express";
import {
  createLeavePolicy,
  getCurrentLeavePolicy,
  getAllLeavePolicies,
  updateLeavePolicy
} from "../controllers/LeavePolicy.controllers.js";

const router = express.Router();

/* ==============================
   CREATE NEW LEAVE POLICY
   POST /api/leave-policy
============================== */
router.post("/", createLeavePolicy);

/* ==============================
   GET CURRENT ACTIVE POLICY
   GET /api/leave-policy/current
============================== */
router.get("/current", getCurrentLeavePolicy);

/* ==============================
   GET ALL LEAVE POLICIES
   GET /api/leave-policy
============================== */
router.get("/", getAllLeavePolicies);

/* ==============================
   UPDATE LEAVE POLICY
   PUT /api/leave-policy/:id
============================== */
router.put("/:id", updateLeavePolicy);

export default router;