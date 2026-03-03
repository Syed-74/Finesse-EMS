import mongoose from "mongoose";

/* =====================================================
   LEAVE TYPE POLICY SCHEMA
===================================================== */
const LeaveTypeSchema = new mongoose.Schema(
  {
    leaveType: {
      type: String,
      required: true,
      trim: true,
    },

    totalPerYear: {
      type: Number,
      required: true,
      min: 0,
    },

    allocationType: {
      type: String,
      enum: ["YEARLY", "MONTHLY"],
      required: true,
    },

    monthlyAccrual: {
      type: Number,
      default: 0,
      min: 0,
    },

    carryForward: {
      type: Boolean,
      default: false,
    },

    maxCarryForward: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: true }
);

/* =====================================================
   HOLIDAY SCHEMA
===================================================== */
const HolidaySchema = new mongoose.Schema(
  {
    holidayName: {
      type: String,
      required: true,
      trim: true,
    },

    holidayDate: {
      type: Date,
      required: true,
    },

    holidayType: {
      type: String,
      enum: ["National", "Public", "Company"],
      required: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    isOptional: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

/* =====================================================
   MAIN LEAVE SETTINGS SCHEMA
===================================================== */
const LeaveSettingsSchema = new mongoose.Schema(
  {
    /* -----------------------------
       COMPANY INFO
    ------------------------------ */
    companyName: {
      type: String,
      default: "Default Company",
      trim: true,
    },

    /* -----------------------------
       LEAVE CYCLE CONFIG
    ------------------------------ */
    leaveCycle: {
      cycleType: {
        type: String,
        enum: ["YEARLY", "FINANCIAL_YEAR"],
        default: "YEARLY",
      },

      // 0 = January, 3 = April (Financial Year example)
      cycleStartMonth: {
        type: Number,
        default: 0,
        min: 0,
        max: 11,
      },
    },

    /* -----------------------------
       GLOBAL LEAVE TYPES
    ------------------------------ */
    leaveTypes: {
      type: [LeaveTypeSchema],
      default: [],
    },

    /* -----------------------------
       CENTRALIZED HOLIDAY CALENDAR
    ------------------------------ */
    holidays: {
      type: [HolidaySchema],
      default: [],
    },

    /* -----------------------------
       SYSTEM CONTROL
    ------------------------------ */
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

/* =====================================================
   EXPORT MODEL
===================================================== */
const LeaveSettings =
  mongoose.models.LeaveSettings ||
  mongoose.model("LeaveSettings", LeaveSettingsSchema);

export default LeaveSettings;