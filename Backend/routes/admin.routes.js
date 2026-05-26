import express from "express";
import {
  registerAdmin,
  loginAdmin,
  ssoLogin,
  getAdminProfile,
  updateAdminProfile,
  logoutAdmin,
  changePassword,
  setPassword,
  updateAdminPreferences,
  syncAllUsers,
} from "../controllers/admin.controller.js";

import { protectAdmin, protectUser } from "../middleware/adminAuth.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.post("/sso-login", ssoLogin); // Microsoft SSO login
router.post("/logout", logoutAdmin);

router.get("/profile", protectUser, getAdminProfile);
router.put("/profile", protectAdmin, upload.single("profileImage"), updateAdminProfile);
router.post("/set-password", protectUser, setPassword);
router.put("/change-password", protectUser, changePassword);
router.put("/preferences", protectAdmin, updateAdminPreferences);
router.post("/sync/all", protectAdmin, syncAllUsers);

export default router;
