import mongoose from "mongoose";

const LeaveApplicationSchema = new mongoose.Schema(
  {
    /* =========================
       EMPLOYEE
    ========================== */

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    leavePolicyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeavePolicy",
      required: true,
    },

    /* =========================
       LEAVE DETAILS
    ========================== */

    leaveType: {
      type: String,
      required: true,
      trim: true,
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
      min: 1,
    },

    employeeComment: {
      type: String,
      default: "",
      trim: true,
    },

    adminComment: {
      type: String,
      default: "",
      trim: true,
    },

    /* =========================
       APPROVAL STATUS
    ========================== */

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Cancelled"],
      default: "Pending",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    approvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const LeaveApplication =
  mongoose.models.LeaveApplication ||
  mongoose.model("LeaveApplication", LeaveApplicationSchema);

export default LeaveApplication;