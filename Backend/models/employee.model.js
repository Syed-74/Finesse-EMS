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

    profileImage: {
      type: String, // image URL or path
    },

    /* =========================
       🔐 AUTH & ACCOUNT
    ========================= */
    password: {
      type: String,
      required: true,
      select: false, // never return password by default
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
      enum: ["OFFICE", "REMOTE", "HYBRID"],
      default: "OFFICE",
    },

    shift: {
      type: String,
      enum: ["DAY", "NIGHT", "CUSTOM"],
      default: "DAY",
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
  },
  {
    timestamps: true, // createdAt & updatedAt
  }
);

const Employee = mongoose.model("Employee", employeeSchema);

export default Employee;
