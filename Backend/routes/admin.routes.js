import express from "express";
import {
  registerAdmin,
  loginAdmin,
  ssoLogin,
  getAdminProfile,
  updateAdminProfile,
  logoutAdmin,
  changePassword,
  updateAdminPreferences,
} from "../controllers/admin.controller.js";

import { protectAdmin } from "../middleware/adminAuth.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.post("/sso-login", ssoLogin); // Microsoft SSO login
router.post("/logout", logoutAdmin);

router.get("/profile", protectAdmin, getAdminProfile);
router.put("/profile", protectAdmin, upload.single("profileImage"), updateAdminProfile);
router.put("/change-password", protectAdmin, changePassword);
router.put("/settings", protectAdmin, updateAdminPreferences);

export default router;
