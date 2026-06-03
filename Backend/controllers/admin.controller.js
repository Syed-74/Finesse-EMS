import bcrypt from "bcryptjs";
import Admin from "../models/admin.model.js";
import Employee from "../models/Employee.model.js";
import microsoftGraphService from "../services/microsoftGraph.service.js";
import authService from "../services/auth.service.js";
import employeeService from "../services/employee.service.js";

/* =========================
   EMAIL DOMAIN VALIDATION
========================= */
const allowedDomains = ["finesse-cs.tech", "email.com"];

const isAllowedEmail = (email) => {
  if (!email) return false;
  const parts = email.split("@");
  if (parts.length < 2) return false;
  const domain = parts[1].toLowerCase();
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
          "Email domain not allowed. Use @finesse-cs.tech or @email.com",
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
// export const loginAdmin = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     console.log("Login Attempt:", { email, password });

//     const admin = await Admin.findOne({ email });
//     if (!admin) {
//       return res.status(404).json({ message: "Admin not found" });
//     }

//     if (!admin.isActive && admin.status === "PENDING") {
//       return res.status(403).json({ message: "Your account is pending approval by an administrator." });
//     }
//     if (admin.status === "REJECTED") {
//       return res.status(403).json({
//         message: `Your account registration was rejected. Reason: ${admin.rejectionReason || 'No reason provided.'}`
//       });
//     }
//     if (!admin.isActive) {
//       return res.status(403).json({ message: "Account is inactive" });
//     }

//     const isMatch = await bcrypt.compare(password, admin.password);
//     if (!isMatch) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     const token = authService.generateToken(admin);

//     // Update security info
//     admin.security.lastLoginIP = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
//     admin.security.lastLoginTime = new Date();
//     await admin.save();

//     res.json({
//       message: "Login successful",
//       token,
//       admin: {
//         id: admin._id,
//         firstName: admin.firstName,
//         lastName: admin.lastName,
//         email: admin.email,
//         role: admin.role,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// ✅ FIXED loginAdmin
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login Attempt:", { email, password });

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (!admin.isActive && admin.status === "PENDING") {
      return res.status(403).json({
        message: "Account pending approval",
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({ message: "Account inactive" });
    }

    // Check if password exists (SSO users might not have one yet)
    if (!admin.password) {
      if (admin.isSSOUser) {
        return res.status(401).json({ 
          message: "No password set. Please login using SSO or set your password in settings first." 
        });
      }
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = authService.generateToken(admin);

    // ✅ FIX: ensure security object exists
    if (!admin.security) {
      admin.security = {};
    }

    admin.security.lastLoginIP =
      req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    admin.security.lastLoginTime = new Date();

    await admin.save();

    res.json({
      message: "Login successful",
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error); // ✅ important
    res.status(500).json({ message: error.message });
  }
};
/* =========================
   GET ADMIN PROFILE
========================= */
export const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id)
      .populate("employeeId", "designation department employeeCode dateOfJoining workLocation");
      
    if (!admin) {
      return res.status(404).json({ message: "Admin profile not found" });
    }

    const adminObj = admin.toObject();
    // Fetch password explicitly to check if set
    const adminWithPassword = await Admin.findById(req.admin.id).select("+password");
    adminObj.hasPassword = !!(adminWithPassword && adminWithPassword.password);
    adminObj.isSSOUser = !!(admin.ssoProvider);

    // Securely remove password before sending response
    delete adminObj.password;

    res.json(adminObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   UPDATE ADMIN PROFILE
========================= */
export const updateAdminProfile = async (req, res) => {
  try {
    const updates = { ...req.body };

    // If file uploaded, add path to updates
    if (req.file) {
      updates.profileImage = `/uploads/${req.file.filename}`;
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(
      req.admin.id,
      updates,
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
    if (!req.body) {
      return res.status(400).json({ message: "Request body is missing" });
    }

    const { name, email, accessToken } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required for SSO login" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (process.env.NODE_ENV === 'development') {
      console.log("-----------------------------------------");
      console.log("SSO LOGIN ATTEMPT:", { name, email: normalizedEmail, hasToken: !!accessToken });
    }

    // Early configuration check for security token generation
    if (!process.env.JWT_SECRET) {
      console.error("SSO CONFIG ERROR: JWT_SECRET environment variable is missing.");
      return res.status(500).json({ message: "Server configuration error: Authentication secret is missing." });
    }

    // ✅ Email domain restriction
    if (!isAllowedEmail(normalizedEmail)) {
      return res.status(400).json({
        message: "Email domain not allowed. Use @finesse-cs.tech or @email.com",
      });
    }

    let graphData = null;
    let profileImageUrl = null;

    if (accessToken) {
      try {
        // 1. Fetch data from MS Graph
        graphData = await microsoftGraphService.getProfile(accessToken);

        // 2. Handle Profile Photo
        if (graphData && graphData.email) {
          const photoBuffer = await microsoftGraphService.getProfilePhoto(accessToken);
          if (photoBuffer) {
            profileImageUrl = employeeService.saveProfilePhoto(photoBuffer, graphData.microsoftId || normalizedEmail);
          }
        }
      } catch (graphError) {
        console.error("Microsoft Graph Sync Error:", graphError.message);
      }
    }

    // Fallback graphData if MS Graph fails or no token
    if (!graphData) {
      const nameParts = (name || normalizedEmail.split('@')[0]).split(' ');

      graphData = {
        email: normalizedEmail,
        firstName: nameParts[0] || "User" || "Employee",
        lastName: nameParts.slice(1).join(' ') || ".",
        microsoftId: null,
      };
    } else {
      // Ensure the email matches the normalized one
      graphData.email = graphData.email.trim().toLowerCase();
    }

    // 3. Sync Admin/User record
    const admin = await authService.syncAdminRecord(graphData, profileImageUrl);
    if (!admin) {
      return res.status(500).json({ message: "Failed to sync user account record." });
    }

    // 4. Sync Employee record
    const employee = await employeeService.upsertEmployeeFromGraph(graphData, profileImageUrl);
    if (!employee) {
      return res.status(404).json({ message: "Failed to sync employee profile record." });
    }

    // Check Employee Approval Status
    if (employee.status === "PENDING") {
      return res.status(403).json({
        message: "Your registration is successful! Your account is currently pending approval by an administrator."
      });
    }
    if (employee.status === "REJECTED") {
      return res.status(403).json({
        message: `Your account registration was rejected. Reason: ${employee.rejectionReason || 'No reason provided.'}`
      });
    }
    if (!employee.isActive) {
      return res.status(403).json({ message: "Your account is currently inactive. Please contact your administrator." });
    }

    // Check Admin Approval Status (Defensive Check)
    if (admin.status === "PENDING") {
      return res.status(403).json({
        message: "Your user account is pending approval by an administrator."
      });
    }
    if (admin.status === "REJECTED") {
      return res.status(403).json({
        message: `Your user account was rejected. Reason: ${admin.rejectionReason || 'No reason provided.'}`
      });
    }
    if (!admin.isActive) {
      return res.status(403).json({ message: "Your user account is currently inactive. Please contact your administrator." });
    }

    // 5. Generate Token
    const token = authService.generateToken(admin);

    if (process.env.NODE_ENV === 'development') {
      console.log("SSO LOGIN COMPLETE for", normalizedEmail);
      console.log("-----------------------------------------");
    }

    res.json({
      message: "SSO Login successful",
      token,
      admin: {
        id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        role: admin.role,
        profileImage: admin.profileImage,
        isSSOUser: admin.isSSOUser || false,
        hasPassword: !!admin.password
      },
    });
  } catch (error) {
    console.error("CRITICAL SSO ERROR:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Database validation failed during SSO user synchronization",
        error: error.message
      });
    }
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Database conflict: duplicate record found during synchronization",
        error: error.message
      });
    }
    res.status(500).json({
      message: "SSO Processing Failed",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/* =========================
   LOGOUT ADMIN
========================= */
export const logoutAdmin = async (req, res) => {
  res.json({ message: "Logged out successfully" });
};

/* =========================
   CHANGE PASSWORD
   ========================= */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = await Admin.findById(req.user._id);

    if (!admin) {
      return res.status(404).json({ message: "User not found" });
    }

    // SSO users might not have a password yet
    if (!admin.password) {
      return res.status(400).json({ message: "No password set for this account. Please use 'Set Password' first." });
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid current password" });
    }

    // Prevent reusing the same password
    const isSame = await bcrypt.compare(newPassword, admin.password);
    if (isSame) {
      return res.status(400).json({ message: "New password cannot be the same as current password" });
    }

    if (newPassword.length < 6 || newPassword.length > 20) {
      return res.status(400).json({ message: "Password must be between 6 and 20 characters" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
    await admin.save();

    // Also sync with Employee model if it exists
    const employee = await Employee.findOne({ email: admin.email });
    if (employee) {
      employee.password = hashedPassword;
      await employee.save();
    }

    res.json({ message: "Password changed successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   SET INITIAL PASSWORD (FOR SSO USERS)
   ========================= */
export const setPassword = async (req, res) => {
  try {
    console.log("SET_PASSWORD_BODY:", req.body);
    const { password, confirmPassword } = req.body;

    // 1. Validation
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (password.length < 6 || password.length > 20) {
      return res.status(400).json({ message: "Password must be between 6 and 20 characters" });
    }

    // 2. Find User
    const admin = await Admin.findById(req.user._id);
    if (!admin) {
      return res.status(404).json({ message: "User not found" });
    }

    // 3. Prevent overwriting if already set (optional security)
    if (admin.password) {
      return res.status(400).json({ message: "Password already set. Use Change Password instead." });
    }

    // 4. Hash and Save
    const hashedPassword = await bcrypt.hash(password, 10);
    admin.password = hashedPassword;
    await admin.save();

    // 5. Also sync with Employee model if it exists
    const employee = await Employee.findOne({ email: admin.email });
    if (employee) {
      employee.password = hashedPassword;
      await employee.save();
    }

    res.json({ message: "Password set successfully! You can now login using email and password." });
  } catch (error) {
    console.error("SET PASSWORD ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   UPDATE ADMIN PREFERENCES
   ========================= */
export const updateAdminPreferences = async (req, res) => {
  try {
    const { preferences, security } = req.body;

    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (preferences) {
      admin.preferences = { ...admin.preferences, ...preferences };
    }

    if (security && typeof security.twoFactorEnabled !== 'undefined') {
      admin.security.twoFactorEnabled = security.twoFactorEnabled;
    }

    await admin.save();

    res.json({
      message: "Settings updated successfully",
      preferences: admin.preferences,
      security: admin.security
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   BATCH SYNC ALL USERS
   ========================= */
export const syncAllUsers = async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ message: "Microsoft Access Token is required for batch sync." });
    }

    // This might take a long time, ideally run in background
    // For now we'll run it and return results
    const results = await employeeService.syncAllUsers(accessToken);

    res.json({
      message: "Batch sync completed successfully",
      results
    });
  } catch (error) {
    console.error("Batch Sync Controller Error:", error);
    res.status(500).json({
      message: "Batch sync failed",
      error: error.message
    });
  }
};
