import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema(
  {
    // 🔹 Employee Reference
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    employeeDetails: {
      employeeCode: String,
      fullName: String,
      department: String,
      designation: String,
    },

    // 🔹 Payroll Period
    month: {
      type: Number,
      required: true, // 1 - 12
    },
    year: {
      type: Number,
      required: true,
    },

    // 🔹 Attendance Summary
    totalWorkingDays: { type: Number, default: 0 },
    presentDays: { type: Number, default: 0 },
    paidLeaves: { type: Number, default: 0 },
    unpaidLeaves: { type: Number, default: 0 },

    // 🔹 Salary Structure (Fixed Components)
    salaryStructure: {
      basicSalary: { type: Number, required: true },
      hra: { type: Number, default: 0 },
      allowance: { type: Number, default: 0 },
      specialAllowance: { type: Number, default: 0 },
    },

    // 🔹 Earnings (Dynamic)
    earnings: [
      {
        componentName: String,
        amount: Number,
      },
    ],

    // 🔹 Deductions (Dynamic)
    deductions: [
      {
        componentName: String,
        amount: Number,
      },
    ],

    // 🔹 Loan / Advance Deduction
    loanDeduction: {
      loanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Loan",
      },
      amount: { type: Number, default: 0 },
    },

    // 🔹 Tax & Percentage-Based Deductions
    taxPercentage: { type: Number, default: 0 },
    pfPercentage: { type: Number, default: 0 },
    esiPercentage: { type: Number, default: 0 },
    professionalTax: { type: Number, default: 0 },

    // 🔹 Salary Calculation Summary
    grossSalary: { type: Number, required: true },
    totalEarnings: { type: Number, required: true },
    totalDeductions: { type: Number, required: true },
    netSalary: { type: Number, required: true },

    // 🔹 Payroll Status
    status: {
      type: String,
      enum: ["DRAFT", "APPROVED", "PAID"],
      default: "DRAFT",
    },

    paymentDate: Date,
    remarks: String,

    // 🔹 Payslip Info
    payslipGenerated: {
      type: Boolean,
      default: false,
    },
    payslipGeneratedAt: Date,
  },
  { timestamps: true }
);

// 🚫 Prevent duplicate payroll for same employee per month
payrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

const Payroll = mongoose.model("Payroll", payrollSchema);
export default Payroll;
