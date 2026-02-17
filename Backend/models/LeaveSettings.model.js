import mongoose from "mongoose";

const LeaveSettingsSchema = new mongoose.Schema(
  {
    /* =========================
       LEAVE POLICY
    ========================== */
    leavePolicy: {
      Casual: {
        totalPerYear: { type: Number, default: 12 },
        accrualType: { type: String, enum: ["YEARLY", "MONTHLY"], default: "YEARLY" },
        monthlyAccrual: { type: Number, default: 1 },
        carryForward: { type: Boolean, default: false },
        maxCarryForward: { type: Number, default: 0 },
      },
      Sick: {
        totalPerYear: { type: Number, default: 10 },
        accrualType: { type: String, enum: ["YEARLY", "MONTHLY"], default: "YEARLY" },
        monthlyAccrual: { type: Number, default: 0.8 },
        carryForward: { type: Boolean, default: false },
        maxCarryForward: { type: Number, default: 0 },
      },
      Paid: {
        totalPerYear: { type: Number, default: 15 },
        accrualType: { type: String, enum: ["YEARLY", "MONTHLY"], default: "YEARLY" },
        monthlyAccrual: { type: Number, default: 1.25 },
        carryForward: { type: Boolean, default: true },
        maxCarryForward: { type: Number, default: 5 },
      },
      Unpaid: {
        totalPerYear: { type: Number, default: 0 }, // Usually unlimited/tracked but let's have a cap
        accrualType: { type: String, enum: ["YEARLY", "MONTHLY"], default: "YEARLY" },
        monthlyAccrual: { type: Number, default: 0 },
        carryForward: { type: Boolean, default: false },
        maxCarryForward: { type: Number, default: 0 },
      },
    },

    leaveCycle: {
      cycleType: { type: String, enum: ["YEARLY", "MONTHLY", "FINANCIAL_YEAR"], default: "YEARLY" },
      cycleStartMonth: { type: Number, default: 0 }, // 0 = Jan, 3 = April
    },

    /* =========================
       HOLIDAY CALENDAR
    ========================== */
    holidays: [
      {
        holidayId: String,
        holidayName: String,
        holidayDate: Date,
        holidayType: {
          type: String,
          enum: ["National", "Company"],
        },
        isOptional: Boolean,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("LeaveSettings", LeaveSettingsSchema);
