import mongoose from "mongoose";

const LeaveManagementSchema = new mongoose.Schema(
  {
    /* =========================
       EMPLOYEE REFERENCE
    ========================== */

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    leaveSettingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaveSettings",
      required: true,
    },
    /* =========================
       LEAVE DETAILS
    ========================== */

    leaveType: {
      type: String,
      enum: ["CASUAL", "SICK", "PAID", "UNPAID"],
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    totalDays: {
      type: Number,
      required: true,
    },

    employeeComment: {
      type: String,
      default: "",
    },

    adminComment: {
      type: String,
      default: "",
    },

    /* =========================
       APPROVAL STATUS
    ========================== */

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true } // adds createdAt & updatedAt automatically
);

const LeaveManagement =
  mongoose.models.LeaveManagement ||
  mongoose.model("LeaveManagement", LeaveManagementSchema);

export default LeaveManagement;