import mongoose from "mongoose";
import Payroll from "../models/Payroll.model.js";
import Employee from "../models/Employee.model.js";
import LeavePolicy from "../models/LeavePolicy.model.js";
import LeaveApplication from "../models/LeaveApplication.model.js";
import Attendance from "../models/attendance.model.js";
import { calculateWorkingDays } from "../utils/calculateWorkingDays.js";
import { generatePayslipPDF } from "../utils/pdfGenerator.js";

/* ==================================================
   SALARY CALCULATION HELPER
================================================== */

const calculateSalary = (data) => {
  const {
    salaryStructure,
    earnings = [],
    deductions = [],
    taxPercentage = 0,
    pfPercentage = 0,
    esiPercentage = 0,
    professionalTax = 0,
    unpaidLeaves = 0, // This can be decimal (e.g. 1.5 for full + half day)
    totalWorkingDays = 30,
  } = data;

  const basicSalary = parseFloat(salaryStructure.basicSalary) || 0;

  // Dynamic Per Day Salary Calculation
  const perDaySalary = totalWorkingDays > 0 ? basicSalary / totalWorkingDays : 0;

  // Calculate Leave Deduction (handles half-days if unpaidLeaves is decimal)
  const leaveDeduction = parseFloat((perDaySalary * unpaidLeaves).toFixed(2));

  const extraEarnings = earnings.reduce(
    (acc, item) => acc + (parseFloat(item.amount) || 0),
    0
  );

  const taxAmount = parseFloat(((basicSalary * taxPercentage) / 100).toFixed(2));
  const pfAmount = parseFloat(((basicSalary * pfPercentage) / 100).toFixed(2));
  const esiAmount = parseFloat(((basicSalary * esiPercentage) / 100).toFixed(2));

  const extraDeductions = deductions.reduce(
    (acc, item) => acc + (parseFloat(item.amount) || 0),
    0
  );

  const totalDeductions = parseFloat((
    taxAmount +
    pfAmount +
    esiAmount +
    (parseFloat(professionalTax) || 0) +
    leaveDeduction +
    extraDeductions
  ).toFixed(2));

  const grossSalary = parseFloat((basicSalary + extraEarnings).toFixed(2));

  const netSalary = Math.max(
    0,
    parseFloat((grossSalary - totalDeductions).toFixed(2))
  );

  return {
    perDaySalary,
    leaveDeduction,
    grossSalary,
    totalEarnings: grossSalary,
    totalDeductions,
    netSalary,
  };
};

/* ==================================================
   PAYROLL CONTROLLER
================================================== */

export const payrollController = {
  /* ==========================================
     GENERATE PAYROLL (ADMIN)
  ========================================== */

  generate: async (req, res) => {
    try {
      const {
        employeeId,
        month,
        year,
        earnings = [],
        deductions = [],
        taxPercentage = 0,
        pfPercentage = 0,
        esiPercentage = 0,
        professionalTax = 0,
        remarks = ""
      } = req.body;

      // 1. Fetch Employee
      const employee = await Employee.findById(employeeId);
      if (!employee)
        return res.status(404).json({ message: "Employee not found" });

      // 2. Prevent Duplicate Payroll
      const existing = await Payroll.findOne({ employee: employeeId, month, year });
      if (existing)
        return res.status(400).json({
          message: "Payroll already exists for this employee this month",
        });

      // 3. Fetch Policy & Identity Unpaid Leave Types
      const policy = await LeavePolicy.findOne({ year, isActive: true });
      if (!policy) return res.status(400).json({ message: "No active leave policy found for this year" });

      const holidays = policy.holidays || [];
      const unpaidLeaveTypeNames = policy.leaveTypes
        .filter(t => t.category === "UNPAID")
        .map(t => t.leaveType);

      // 4. Calculate Dynamic Working Days
      const totalWorkingDays = calculateWorkingDays(month, year, holidays, employee.weeklyOff);

      // 5. Fetch Approved Leaves (All types for reporting, Unpaid for deduction)
      const startDate = new Date(Date.UTC(year, month - 1, 1));
      const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

      const approvedLeaves = await LeaveApplication.find({
        employeeId: new mongoose.Types.ObjectId(employeeId),
        status: "Approved",
        startDate: { $lte: endDate },
        endDate: { $gte: startDate }
      });

      const absentDays = await Attendance.countDocuments({
        employee: employeeId,
        date: { $gte: startDate, $lte: endDate },
        status: "ABSENT"
      });

      let unpaidLeaves = absentDays;
      let totalLeavesTaken = 0;
      let paidLeavesTaken = 0;

      approvedLeaves.forEach(leave => {
        // Calculate days within the current month only (handles overlaps)
        const leaveStart = new Date(Math.max(new Date(leave.startDate).getTime(), startDate.getTime()));
        const leaveEnd = new Date(Math.min(new Date(leave.endDate).getTime(), endDate.getTime()));

        let daysInMonth = 0;
        for (let d = new Date(leaveStart); d <= leaveEnd; d.setDate(d.getDate() + 1)) {
          const day = d.getDay();
          const isWeekend = day === 0 || day === 6;

          const dStr = d.toISOString().split('T')[0];
          const isHoliday = holidays.some(h => {
            const hDateStr = new Date(h.holidayDate).toISOString().split('T')[0];
            return hDateStr === dStr;
          });

          if (!isWeekend && !isHoliday) {
            daysInMonth += 1;
          }
        }

        // Adjust for half-days if indicated in totalDays (e.g. if leave spans 1 day but totalDays is 0.5)
        // If it's a 1-day leave but marked as 0.5, we treat the month portion proportionally
        const ratio = leave.totalDays / daysInMonth;
        const effectiveDays = (ratio < 1) ? leave.totalDays : daysInMonth;

        totalLeavesTaken += effectiveDays;

        if (unpaidLeaveTypeNames.includes(leave.leaveType)) {
          unpaidLeaves += effectiveDays;
        } else {
          paidLeavesTaken += effectiveDays;
        }
      });

      if (!employee.salaryStructure) {
        return res.status(400).json({ message: `Salary structure not defined for employee ${employee.firstName} ${employee.lastName}` });
      }

      const salaryStructure = {
        basicSalary: employee.salaryStructure.basicSalary || 0,
      };

      // 6. Calculate Salary
      const salaryData = calculateSalary({
        salaryStructure,
        earnings,
        deductions,
        taxPercentage,
        pfPercentage,
        esiPercentage,
        professionalTax,
        unpaidLeaves,
        totalWorkingDays,
      });

      // 7. Save Payroll as DRAFT
      const payroll = await Payroll.create({
        employee: employeeId,
        employeeDetails: {
          employeeCode: employee.employeeCode,
          fullName: `${employee.firstName} ${employee.lastName}`,
          department: employee.department,
          designation: employee.designation,
        },
        month,
        year,
        totalWorkingDays,
        presentDays: totalWorkingDays - unpaidLeaves,
        unpaidLeaves,
        totalLeavesTaken, // New field for reporting
        paidLeavesTaken,  // New field for reporting
        salaryStructure,
        earnings,
        deductions,
        taxPercentage,
        pfPercentage,
        esiPercentage,
        professionalTax,
        remarks,
        ...salaryData,
        status: "DRAFT"
      });

      res.status(201).json({
        message: "Payroll generated successfully",
        payroll,
      });
    } catch (err) {
      console.error("Payroll Generation Error:", err);
      res.status(500).json({ message: err.message });
    }
  },

  /* ==========================================
     PREVIEW PAYROLL (ADMIN)
  ========================================== */

  preview: async (req, res) => {
    try {
      const {
        employeeId,
        month,
        year,
        earnings = [],
        deductions = [],
        taxPercentage = 0,
        pfPercentage = 0,
        esiPercentage = 0,
        professionalTax = 0
      } = req.method === 'POST' ? req.body : req.query;

      console.log("Employee:", employeeId);
      console.log("Month:", month, "Year:", year);

      if (!employeeId || !month || !year) {
        return res.status(400).json({ message: "Missing required parameters: employeeId, month, year" });
      }

      const m = parseInt(month);
      const y = parseInt(year);

      // 1. Fetch Employee
      const employee = await Employee.findById(employeeId);
      if (!employee)
        return res.status(404).json({ message: "Employee not found" });

      // 2. Fetch Holidays & Unpaid Types
      const policy = await LeavePolicy.findOne({ year: y, isActive: true });
      if (!policy) return res.status(400).json({ message: "No active leave policy found" });

      const holidays = policy.holidays || [];
      const unpaidLeaveTypeNames = policy.leaveTypes
        .filter(t => t.category === "UNPAID")
        .map(t => t.leaveType);

      // 4. Calculate Working Days
      const totalWorkingDays = calculateWorkingDays(m, y, holidays, employee.weeklyOff);

      // 5. Fetch Approved Leaves
      const startDate = new Date(Date.UTC(y, m - 1, 1));
      const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));

      const approvedLeaves = await LeaveApplication.find({
        employeeId: new mongoose.Types.ObjectId(employeeId),
        status: "Approved",
        startDate: { $lte: endDate },
        endDate: { $gte: startDate }
      });

      const absentDays = await Attendance.countDocuments({
        employee: employeeId,
        date: { $gte: startDate, $lte: endDate },
        status: "ABSENT"
      });

      let unpaidLeaves = absentDays;
      let totalLeavesTaken = 0;
      let paidLeavesTaken = 0;

      approvedLeaves.forEach(leave => {
        const leaveStart = new Date(Math.max(new Date(leave.startDate).getTime(), startDate.getTime()));
        const leaveEnd = new Date(Math.min(new Date(leave.endDate).getTime(), endDate.getTime()));

        let daysInMonth = 0;
        for (let d = new Date(leaveStart); d <= leaveEnd; d.setDate(d.getDate() + 1)) {
          const day = d.getDay();
          const isWeekend = day === 0 || day === 6;

          const dStr = d.toISOString().split('T')[0];
          const isHoliday = holidays.some(h => {
            const hDateStr = new Date(h.holidayDate).toISOString().split('T')[0];
            return hDateStr === dStr;
          });

          if (!isWeekend && !isHoliday) {
            daysInMonth++;
          }
        }

        const ratio = leave.totalDays / daysInMonth;
        const effectiveDays = (ratio < 1) ? leave.totalDays : daysInMonth;

        totalLeavesTaken += effectiveDays;

        if (unpaidLeaveTypeNames.includes(leave.leaveType)) {
          unpaidLeaves += effectiveDays;
        } else {
          paidLeavesTaken += effectiveDays;
        }
      });

      if (!employee.salaryStructure) {
        return res.status(400).json({ message: `Salary structure not defined for employee ${employee.firstName} ${employee.lastName}` });
      }

      const salaryStructure = {
        basicSalary: employee.salaryStructure.basicSalary || 0,
      };

      // 6. Calculate Salary
      const salaryData = calculateSalary({
        salaryStructure,
        earnings,
        deductions,
        taxPercentage,
        pfPercentage,
        esiPercentage,
        professionalTax,
        unpaidLeaves,
        totalWorkingDays,
      });

      res.json({
        employeeId,
        month: m,
        year: y,
        totalWorkingDays,
        unpaidLeaves,
        totalLeavesTaken,  // New field
        paidLeavesTaken,   // New field
        presentDays: totalWorkingDays - unpaidLeaves,
        salaryStructure,
        ...salaryData
      });
    } catch (err) {
      console.error("Payroll Preview Error:", err);
      res.status(500).json({ message: err.message });
    }
  },

  /* ==========================================
     GET ALL PAYROLLS (ADMIN)
  ========================================== */

  getAll: async (req, res) => {
    try {
      const payrolls = await Payroll.find()
        .populate("employee", "firstName lastName employeeCode")
        .sort({ year: -1, month: -1 });

      res.json(payrolls);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  /* ==========================================
     GET MY PAYROLLS (EMPLOYEE)
  ========================================== */

  getMy: async (req, res) => {
    try {
      const payrolls = await Payroll.find({
        employee: req.employee._id,
      }).sort({ year: -1, month: -1 });

      res.json(payrolls);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  /* ==========================================
     GET SINGLE PAYROLL
  ========================================== */

  getOne: async (req, res) => {
    try {
      const payroll = await Payroll.findById(req.params.id);

      if (!payroll)
        return res.status(404).json({ message: "Payroll not found" });

      if (
        req.employee &&
        payroll.employee.toString() !== req.employee._id.toString()
      ) {
        return res
          .status(403)
          .json({ message: "Unauthorized access to this payroll" });
      }

      res.json(payroll);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  /* ==========================================
     UPDATE PAYROLL (DRAFT ONLY)
  ========================================== */

  update: async (req, res) => {
    try {
      const payroll = await Payroll.findById(req.params.id);

      if (!payroll)
        return res.status(404).json({ message: "Payroll not found" });

      if (payroll.status !== "DRAFT")
        return res
          .status(400)
          .json({ message: "Only draft payroll can be edited" });

      const {
        earnings,
        deductions,
        taxPercentage,
        pfPercentage,
        esiPercentage,
        professionalTax,
        unpaidLeaves,
        totalWorkingDays,
        remarks
      } = req.body;

      if (earnings !== undefined) payroll.earnings = earnings;
      if (deductions !== undefined) payroll.deductions = deductions;
      if (taxPercentage !== undefined) payroll.taxPercentage = taxPercentage;
      if (pfPercentage !== undefined) payroll.pfPercentage = pfPercentage;
      if (esiPercentage !== undefined) payroll.esiPercentage = esiPercentage;
      if (professionalTax !== undefined) payroll.professionalTax = professionalTax;
      if (unpaidLeaves !== undefined) payroll.unpaidLeaves = unpaidLeaves;
      if (totalWorkingDays !== undefined) payroll.totalWorkingDays = totalWorkingDays;
      if (remarks !== undefined) payroll.remarks = remarks;

      const salaryData = calculateSalary({
        salaryStructure: payroll.salaryStructure,
        earnings: payroll.earnings,
        deductions: payroll.deductions,
        taxPercentage: payroll.taxPercentage,
        pfPercentage: payroll.pfPercentage,
        esiPercentage: payroll.esiPercentage,
        professionalTax: payroll.professionalTax,
        unpaidLeaves: payroll.unpaidLeaves,
        totalWorkingDays: payroll.totalWorkingDays
      });

      Object.assign(payroll, salaryData);

      await payroll.save();

      res.json({
        message: "Payroll updated successfully",
        payroll,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  /* ==========================================
     APPROVE PAYROLL
  ========================================== */

  approve: async (req, res) => {
    try {
      const payroll = await Payroll.findById(req.params.id);

      if (!payroll)
        return res.status(404).json({ message: "Payroll not found" });

      if (payroll.status !== "DRAFT")
        return res.status(400).json({ message: "Payroll already processed" });

      payroll.status = "APPROVED";

      await payroll.save();

      res.json({
        message: "Payroll approved",
        payroll,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  /* ==========================================
     MARK PAYROLL AS PAID
  ========================================== */

  markAsPaid: async (req, res) => {
    try {
      const payroll = await Payroll.findById(req.params.id);

      if (!payroll)
        return res.status(404).json({ message: "Payroll not found" });

      if (payroll.status !== "APPROVED")
        return res
          .status(400)
          .json({ message: "Payroll must be approved first" });

      payroll.status = "PAID";
      payroll.paymentDate = new Date();

      payroll.payslipGenerated = true;
      payroll.payslipGeneratedAt = new Date();

      await payroll.save();

      res.json({
        message: "Payroll marked as PAID",
        payroll,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  /* ==========================================
     DELETE PAYROLL (DRAFT ONLY)
  ========================================== */

  delete: async (req, res) => {
    try {
      const payroll = await Payroll.findById(req.params.id);

      if (!payroll)
        return res.status(404).json({ message: "Payroll not found" });

      if (payroll.status !== "DRAFT")
        return res
          .status(400)
          .json({ message: "Only draft payroll can be deleted" });

      await payroll.deleteOne();

      res.json({ message: "Payroll deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  /* ==========================================
     DOWNLOAD PAYSLIP
  ========================================== */

  downloadPayslip: async (req, res) => {
    try {
      const payroll = await Payroll.findById(req.params.id);

      if (!payroll)
        return res.status(404).json({ message: "Payroll not found" });

      if (
        req.employee &&
        payroll.employee.toString() !== req.employee._id.toString()
      ) {
        return res
          .status(403)
          .json({ message: "Unauthorized access to this payslip" });
      }

      if (payroll.status !== "PAID")
        return res.status(400).json({
          message: "Payslip available only after payment",
        });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=payslip_${payroll.month}_${payroll.year}.pdf`
      );

      generatePayslipPDF(payroll, res);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
};