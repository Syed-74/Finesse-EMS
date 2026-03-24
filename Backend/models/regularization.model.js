import mongoose from "mongoose";

const regularizationSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true
    },
    attendanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attendance",
      required: true
    },
    requestedDate: {
      type: Date,
      required: true
    },
    requestedInTime: {
      type: String
    },
    requestedOutTime: {
      type: String
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending"
    },
    adminComment: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

const Regularization = mongoose.models.Regularization || mongoose.model("Regularization", regularizationSchema);
export default Regularization;
