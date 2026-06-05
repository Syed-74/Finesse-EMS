import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    /* =========================
       🆔 BASIC IDENTIFICATION
    ========================= */
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    mobileNumber: {
      type: String,
      trim: true,
    },

    employeeCode: {
      type: String,
      unique: true,
      sparse: true,
    },

    profileImage: {
      type: String, // image URL or path
    },

    /* =========================
       🔐 AUTH & ACCOUNT
    ========================= */
    password: {
      type: String,
      required: false,
      select: false,
    },

    role: {
      type: String,
      enum: ["employee"],
      default: "employee",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "APPROVED",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },

    approvedAt: {
      type: Date,
    },

    rejectionReason: {
      type: String,
    },

    lastLogin: {
      type: Date,
    },

    passwordChangedAt: {
      type: Date,
    },

    resetPasswordToken: {
      type: String,
    },

    resetPasswordExpiry: {
      type: Date,
    },

    /* =========================
       🧑‍💼 JOB / WORK INFO
    ========================= */
    designation: {
      type: String,
      required: true,
    },

    department: {
      type: String,
      required: true,
    },

    reportingManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },

    employmentType: {
      type: String,
      enum: ["FULL_TIME", "PART_TIME", "INTERN", "CONTRACT"],
      default: "FULL_TIME",
    },

    dateOfJoining: {
      type: Date,
      required: true,
    },

    workLocation: {
      type: String,
      enum: ["Onsite", "Remote", "Hybrid"],
      default: "Onsite",
    },

    officeDays: {
      type: [String], // ["MONDAY", "WEDNESDAY"] - For Hybrid users
      default: [],
    },

    officeLocation: {
      type: String,
      trim: true,
    },

    microsoftId: {
      type: String,
      unique: true,
      sparse: true,
    },

    shift: {
      type: String,
      enum: ["DAY", "NIGHT", "CUSTOM", "Morning", "Afternoon", "Night"],
      default: "DAY",
    },

    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
    },

    /* =========================
       ⏱️ ATTENDANCE & LEAVE
    ========================= */
    attendanceRequired: {
      type: Boolean,
      default: true,
    },

    leaveBalance: {
      type: Number,
      default: 0,
    },

    weeklyOff: {
      type: [String], // ["SATURDAY", "SUNDAY"]
      default: ["SUNDAY"],
    },

    holidayCalendar: {
      type: String, // optional calendar name or ID
    },

    /* =========================
       💰 SALARY STRUCTURE
    ========================= */
    salaryStructure: {
      basicSalary: { type: Number, required: true, default: 0 },
      annualSalary: { type: Number, default: 0 },
    },

    /* =========================
       📍 ADDRESS & PERSONAL
    ========================= */
    address: {
      type: String,
    },

    city: {
      type: String,
    },

    state: {
      type: String,
    },

    country: {
      type: String,
    },

    emergencyContact: {
      type: String,
    },

    /* =========================
       🛡️ SYSTEM & AUDIT
    ========================= */
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },

    deletedAt: {
      type: Date,
    },

    lastGraphSync: {
      type: Date,
    },
  },
  {
    timestamps: true, // createdAt & updatedAt
  }
);

const Employee =
  mongoose.models.Employee || mongoose.model("Employee", employeeSchema);

export default Employee;
