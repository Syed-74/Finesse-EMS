import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String, // e.g., "ATTENDANCE_UPDATE", "REGULARIZATION_APPROVED"
      required: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin", // Or User with Admin role
      required: true
    },
    targetType: {
      type: String,
      enum: ["Attendance", "Regularization", "Employee"],
      required: true
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    oldData: {
      type: mongoose.Schema.Types.Mixed
    },
    newData: {
      type: mongoose.Schema.Types.Mixed
    },
    remarks: {
      type: String
    }
  },
  { timestamps: true }
);

const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
