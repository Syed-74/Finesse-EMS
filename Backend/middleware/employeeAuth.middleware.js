import jwt from "jsonwebtoken";
import Employee from "../models/employee.model.js";
import Admin from "../models/admin.model.js";

export const protectEmployee = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 1. Check if user exists in Admin (User) collection first (since token carries Admin ID)
    const user = await Admin.findById(decoded.id).select("-password");

    if (!user || user.role !== 'employee') {
      // Fallback: Check if token WAS an Employee ID (legacy support or direct login?)
      // But for now, assuming standard flow uses Admin ID.
      return res.status(401).json({ message: "Unauthorized: Not an employee" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is inactive" });
    }

    // 2. Find the linked Employee Record by Email
    const employee = await Employee.findOne({ email: user.email });

    if (!employee) {
      return res.status(404).json({ message: "Employee profile not found" });
    }

    req.employee = employee;
    req.user = user; // Optional: user info
    next();
  } catch (error) {
    console.error("Auth Error (Employee):", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
