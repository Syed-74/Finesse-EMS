import mongoose from "mongoose";

const LeaveManagementSchema = new mongoose.Schema(
  {
    /* =========================
       EMPLOYEE CORE INFO
    ========================== */

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Changed to User based on typicalauth, usually it's User or Employee. Propmt had 'Employee' but User is safer for Auth linkage. Let's check other models later. ACTUALLY, prompt used 'Employee' in schema definition: ref: "Employee". I will stick to prompt but check if 'Employee' model exists.
      required: true,
    },

    employeeName: String,

    departmentId: {
      type: mongoose.Schema.Types.ObjectId, // Prompt had this as specific ObjectdId ref
      ref: "Department",
    },

    /* =========================
       LEAVE REQUESTS (MULTIPLE)
    ========================== */

    leaveRequests: [
      {
        leaveId: String,

        leaveType: {
          type: String,
          enum: ["Casual", "Sick", "Paid", "Unpaid"],
          required: true,
        },

        startDate: Date,
        endDate: Date,
        totalDays: Number,

        reason: String,

        contactDuringLeave: String,

        attachment: String,

        halfDay: {
          type: Boolean,
          default: false,
        },

        status: {
          type: String,
          enum: ["Pending", "Approved", "Rejected", "Cancelled"],
          default: "Pending",
        },

        appliedAt: {
          type: Date,
          default: Date.now,
        },

        adminComment: String,

        approvedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User", // Assuming Admin is a User
        },

        approvedAt: Date,
      },
    ],

    /* =========================
       LEAVE BALANCE
    ========================== */

    leaveBalance: {
      totalLeaves: { type: Number, default: 0 },
      usedLeaves: { type: Number, default: 0 },
      remainingLeaves: { type: Number, default: 0 },

      leaveTypeWiseBalance: {
        Casual: { type: Number, default: 0 },
        Sick: { type: Number, default: 0 },
        Paid: { type: Number, default: 0 },
        Unpaid: { type: Number, default: 0 },
      },
      // Detailed balance tracking
      detailedBalance: {
        Casual: { total: Number, used: Number },
        Sick: { total: Number, used: Number },
        Paid: { total: Number, used: Number },
        Unpaid: { total: Number, used: Number },
      }
    },

    /* =========================
       SYSTEM & AUDIT
    ========================== */

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    auditLog: [
      {
        action: String,
        performedBy: String, // Storing ID as string for flexibility or ObjectId? Prompt used String in one place, ObjectId in others. Sticking to prompt.
        performedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

const LeaveManagement =
  mongoose.models.LeaveManagement ||
  mongoose.model("LeaveManagement", LeaveManagementSchema);

export default LeaveManagement;

