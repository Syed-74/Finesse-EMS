import mongoose from "mongoose";

/* =====================================================
   LEAVE TYPE POLICY
===================================================== */
const LeaveTypeSchema = new mongoose.Schema(
  {
    leaveType: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: ["PAID", "UNPAID"],
      required: true,
    },

    totalPerYear: {
      type: Number,
      required: true,
      min: 0,
    },

    allocationType: {
      type: String,
      enum: ["YEARLY", "MONTHLY"],
      default: "YEARLY",
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
   HOLIDAY CALENDAR
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
      default: "Public",
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
   MAIN LEAVE POLICY SCHEMA
===================================================== */
const LeavePolicySchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      required: true,
      unique: true,
    },

    companyName: {
      type: String,
      default: "Default Company",
      trim: true,
    },

    leaveCycle: {
      cycleType: {
        type: String,
        enum: ["YEARLY", "FINANCIAL_YEAR"],
        default: "YEARLY",
      },

      cycleStartMonth: {
        type: Number,
        default: 0,
        min: 0,
        max: 11,
      },
    },

    leaveTypes: {
      type: [LeaveTypeSchema],
      default: [],
    },

    holidays: {
      type: [HolidaySchema],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const LeavePolicy =
  mongoose.models.LeavePolicy ||
  mongoose.model("LeavePolicy", LeavePolicySchema);

export default LeavePolicy;