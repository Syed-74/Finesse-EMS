import express from "express";
import {
  registerAdmin,
  loginAdmin,
  ssoLogin,
  getAdminProfile,
  updateAdminProfile,
  logoutAdmin,
} from "../controllers/admin.controller.js";

import { protectAdmin } from "../middleware/adminAuth.middleware.js";

const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.post("/sso-login", ssoLogin); // Microsoft SSO login
router.post("/logout", logoutAdmin);

router.get("/profile", protectAdmin, getAdminProfile);
router.put("/profile", protectAdmin, updateAdminProfile);

export default router;
