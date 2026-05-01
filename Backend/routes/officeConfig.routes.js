import express from "express";
import {
  getAllConfigs,
  createConfig,
  updateConfig,
  deleteConfig,
} from "../controllers/officeConfig.controller.js";
import { protectAdmin } from "../middleware/adminAuth.middleware.js";

const router = express.Router();

// All routes are protected by admin authentication
router.use(protectAdmin);

router.get("/", getAllConfigs);
router.post("/", createConfig);
router.put("/:id", updateConfig);
router.delete("/:id", deleteConfig);

export default router;
