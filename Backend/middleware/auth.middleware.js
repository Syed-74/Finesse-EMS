import jwt from "jsonwebtoken";
import Admin from "../models/admin.model.js";
import Employee from "../models/employee.model.js";

export const protectAll = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find in Admin/User collection
    const user = await Admin.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is inactive" });
    }

    req.user = user;

    // If it's an employee, also attach employee profile
    if (user.role === 'employee') {
      const employee = await Employee.findOne({ email: user.email });
      if (employee) req.employee = employee;
    } else if (user.role === 'admin') {
      req.admin = user;
    }

    next();
  } catch (error) {
    console.error("Auth Error (All):", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Alias for convenience
export const protect = protectAll;

/**
 * ✅ Admin Only Middleware 
 */
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: "Access denied: Admin only" });
  }
};
