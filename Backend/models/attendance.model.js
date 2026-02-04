import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true
    },

    date: {
      type: Date,
      required: true
    },

    status: {
      type: String,
      enum: ["PRESENT", "ABSENT", "LEAVE", "HALF_DAY", "HOLIDAY", "WFH"],
      default: "PRESENT"
    },

    // ⏰ Punch times
    inTime: {
      type: String, // "09:05"
      required: function () {
        return this.status === "PRESENT" || this.status === "HALF_DAY";
      }
    },

    outTime: {
      type: String // "18:10"
    },

    // 📊 Calculated fields
    totalWorkingMinutes: {
      type: Number,
      default: 0
    },

    breakMinutes: {
      type: Number,
      default: 0
    },

    lateByMinutes: {
      type: Number,
      default: 0
    },

    overtimeMinutes: {
      type: Number,
      default: 0
    },

    // 🏢 Work info
    shift: {
      type: String,
      default: "Day"
    },

    workLocation: {
      type: String,
      enum: ["Office", "Remote", "Hybrid"],
      default: "Office"
    },
    
    // 📸 Proof of Attendance
    selfieUrl: {
      type: String, // Path to uploaded selfie
    },

    location: {
      latitude: Number,
      longitude: Number,
      address: String,
      isInsideOffice: Boolean // Geo-fencing result
    },

    deviceInfo: {
        userAgent: String,
        ip: String
    },

    remarks: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);


// ✅ Prevent duplicate attendance for same employee & date
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;
