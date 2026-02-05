import mongoose from "mongoose";

const LeaveSettingsSchema = new mongoose.Schema(
  {
    /* =========================
       LEAVE POLICY
    ========================== */
    leavePolicy: [
      {
        leaveType: {
          type: String,
          enum: ["Casual", "Sick", "Paid"],
        },
        maxLeavesPerYear: Number,
        carryForwardAllowed: Boolean,
        carryForwardLimit: Number,
        requiresApproval: Boolean,
        requiresProof: Boolean,
      },
    ],

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
