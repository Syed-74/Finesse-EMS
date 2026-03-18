import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema(
  {
    /* =========================
       EMPLOYEE REFERENCE
    ========================= */

    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true
    },

    /* =========================
       EMPLOYEE SNAPSHOT
       (Stored for history)
    ========================= */

    employeeDetails: {
      employeeCode: {
        type: String,
        // Optional because it's not always required in Employee model
      },
      fullName: {
        type: String,
        required: true
      },
      department: String,
      designation: String
    },

    /* =========================
       PAYROLL PERIOD
    ========================= */

    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },

    year: {
      type: Number,
      required: true
    },

    /* =========================
       ATTENDANCE SUMMARY
    ========================= */

    totalWorkingDays: {
      type: Number
    },

    presentDays: {
      type: Number,
      default: 0
    },

    paidLeaves: {
      type: Number,
      default: 0
    },

    unpaidLeaves: {
      type: Number,
      default: 0
    },

    paidLeavesTaken: {
      type: Number,
      default: 0
    },

    totalLeavesTaken: {
      type: Number,
      default: 0
    },

    /* =========================
       SALARY STRUCTURE
       (Fetched from Employee)
    ========================= */

    salaryStructure: {
      basicSalary: {
        type: Number,
        required: true
      }
    },

    /* =========================
       PAYROLL CALCULATIONS
    ========================= */

    perDaySalary: {
      type: Number,
      default: 0
    },

    leaveDeduction: {
      type: Number,
      default: 0
    },

    /* =========================
       EXTRA EARNINGS
    ========================= */

    earnings: [
      {
        componentName: {
          type: String,
          trim: true
        },
        amount: {
          type: Number,
          default: 0
        }
      }
    ],

    /* =========================
       EXTRA DEDUCTIONS
    ========================= */

    deductions: [
      {
        componentName: {
          type: String,
          trim: true
        },
        amount: {
          type: Number,
          default: 0
        }
      }
    ],

    /* =========================
       STATUTORY DEDUCTIONS
    ========================= */

    taxPercentage: {
      type: Number,
      default: 0
    },

    pfPercentage: {
      type: Number,
      default: 0
    },

    esiPercentage: {
      type: Number,
      default: 0
    },

    professionalTax: {
      type: Number,
      default: 0
    },

    /* =========================
       SALARY SUMMARY
    ========================= */

    grossSalary: {
      type: Number,
      required: true
    },

    totalEarnings: {
      type: Number,
      required: true
    },

    totalDeductions: {
      type: Number,
      required: true
    },

    netSalary: {
      type: Number,
      required: true
    },

    /* =========================
       PAYROLL STATUS
    ========================= */

    status: {
      type: String,
      enum: ["DRAFT", "APPROVED", "PAID"],
      default: "DRAFT"
    },

    paymentDate: Date,

    remarks: {
      type: String,
      trim: true
    },

    /* =========================
       PAYSLIP
    ========================= */

    payslipGenerated: {
      type: Boolean,
      default: false
    },

    payslipGeneratedAt: Date
  },
  { timestamps: true }
);

/* =========================
   PREVENT DUPLICATE PAYROLL
========================= */

payrollSchema.index(
  { employee: 1, month: 1, year: 1 },
  { unique: true }
);

const Payroll = mongoose.models.Payroll || mongoose.model("Payroll", payrollSchema);

export default Payroll;