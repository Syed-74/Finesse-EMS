import jwt from "jsonwebtoken";
import Admin from "../models/admin.model.js";

export const protectAdmin = async (req, res, next) => {
  try {
    let token;

    // 1. Check Authorization Header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }
    // 2. Check Cookies (if using withCredentials: true)
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized: No token provided. Ensure you are sending Authorization header or 'token' cookie."
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await Admin.findById(decoded.id).select("-password");
    if (!admin) {
      return res.status(401).json({ message: "Unauthorized: Admin user not found" });
    }

    if (admin.role !== "admin" && admin.role !== "super-admin") {
      return res.status(403).json({ message: "Forbidden: You do not have admin privileges" });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error("Admin Auth Middleware Error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired, please login again" });
    }

    return res.status(401).json({ message: "Invalid token or authentication failed" });
  }
};
