import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";
import authRoutes from "./routes/admin.routes.js";
import employeeRoutes from "./routes/employee.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import leaveApplicationRoutes from "./routes/leaveApplication.routes.js";
import leavePolicyRoutes from "./routes/leavePolicy.routes.js";
import leaveBalanceRoutes from "./routes/LeaveBalance.routes.js";
import payrollRoutes from "./routes/payrollRoutes.js";
import reportRoutes from "./routes/report.routes.js";

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaveapplication", leaveApplicationRoutes);
app.use("/api/leavepolicy", leavePolicyRoutes);
app.use("/api/leavebalance", leaveBalanceRoutes); 
app.use("/api/payroll", payrollRoutes);
app.use("/api/reports", reportRoutes);

// Static uploads
app.use("/uploads", express.static("uploads"));


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🔥`);
});
