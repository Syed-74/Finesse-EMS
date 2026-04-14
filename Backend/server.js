// server.js - Restart Trigger
import express from "express";
import dns from "dns";
import dotenv from "dotenv";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

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
import shiftRoutes from "./routes/shift.routes.js";
import markAbsentCron from "./services/attendanceCron.js";
import taskRoutes from "./routes/task.routes.js";

dotenv.config();
connectDB();
markAbsentCron();

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173 ", "https://finesse-ems-git-main-syed-nusraths-projects.vercel.app/", // Common Vite port
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.get("/test", (req, res) => {
  res.send("Welcome to the Employee Management System API!.And this is a test endpoint to check if the server is running properly.");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaveapplication", leaveApplicationRoutes);
app.use("/api/leavepolicy", leavePolicyRoutes);
app.use("/api/leavebalance", leaveBalanceRoutes); 
app.use("/api/payroll", payrollRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/shifts", shiftRoutes);
app.use("/api/tasks", taskRoutes);

// Static uploads
app.use("/uploads", express.static("uploads"));


// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(`Root Error: ${err.message}`);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    // Hide stack trace in production
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🔥`);
});

