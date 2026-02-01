import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/admin.model.js";

/* =========================
   EMAIL DOMAIN VALIDATION
========================= */
const allowedDomains = ["finesse-cs.tech", "andemail.com"];

const isAllowedEmail = (email) => {
  const domain = email.split("@")[1];
  return allowedDomains.includes(domain);
};

/* =========================
   REGISTER ADMIN
========================= */
export const registerAdmin = async (req, res) => {
  try {
    const { firstName, lastName, email, password, mobileNumber } = req.body;

    // ✅ Email domain restriction
    if (!isAllowedEmail(email)) {
      return res.status(400).json({
        message:
          "Email domain not allowed. Use @finesse-cs.tech or @andemail.com",
      });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await Admin.create({
      firstName,
      lastName,
      email,
      mobileNumber,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "Admin created successfully",
      admin: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   LOGIN ADMIN
========================= */
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (!admin.isActive) {
      return res.status(403).json({ message: "Account is inactive" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      admin: {
        id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   GET ADMIN PROFILE
========================= */
export const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select("-password");
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   UPDATE ADMIN PROFILE
========================= */
export const updateAdminProfile = async (req, res) => {
  try {
    const updatedAdmin = await Admin.findByIdAndUpdate(
      req.admin.id,
      req.body,
      { new: true }
    ).select("-password");

    res.json({
      message: "Profile updated successfully",
      admin: updatedAdmin,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   SSO LOGIN (Microsoft)
========================= */
export const ssoLogin = async (req, res) => {
  try {
    const { name, email } = req.body;

    // ✅ Email domain restriction
    if (!isAllowedEmail(email)) {
      return res.status(400).json({
        message:
          "Email domain not allowed. Use @finesse-cs.tech or @andemail.com",
      });
    }

    // Find existing admin or create new one
    let admin = await Admin.findOne({ email });
    
    if (!admin) {
      // Create new admin for SSO user
      const nameParts = name.split(' ');
      const firstName = nameParts[0] || name;
      const lastName = nameParts.slice(1).join(' ') || '';
      
      admin = await Admin.create({
        firstName,
        lastName,
        email,
        mobileNumber: '', // Empty for SSO users
        password: '', // No password for SSO users
        ssoProvider: 'microsoft',
        isActive: true,
      });
    } else {
      // Update last login and ensure account is active
      admin.isActive = true;
      await admin.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "SSO Login successful",
      token,
      admin: {
        id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("SSO Login Error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   LOGOUT ADMIN
========================= */
export const logoutAdmin = async (req, res) => {
  res.json({ message: "Logged out successfully" });
};
