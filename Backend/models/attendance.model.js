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
      enum: ["Present", "Late", "Absent", "Half Day", "Leave", "Holiday", "WFH"],
      default: "Present"
    },

    // ⏰ Punch times
    inTime: {
      type: String, // "09:05"
      required: function () {
        return this.status === "Present" || this.status === "Half Day";
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

    breaks: [
      {
        startTime: String, // "13:00"
        endTime: String,   // "14:00"
        duration: Number,  // in minutes
        type: { type: String, enum: ["Lunch", "Tea", "Medical", "Other"], default: "Lunch" }
      }
    ],

    totalBreakMinutes: {
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

    // 🛠️ Regularization & Audit
    isRegularized: {
      type: Boolean,
      default: false
    },

    originalStatus: {
      type: String
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
      ip: String,
      // 🌐 IP Validation Result: 'Office' | 'Remote' | 'Unauthorized'
      networkType: {
        type: String,
        enum: ["Office", "Remote", "Unauthorized"],
        default: "Remote"
      }
    },

    remarks: {
      type: String,
      trim: true
    },

    shiftType: {
      type: String,
      enum: ["Morning", "Afternoon", "Night"]
    },

    autoMarked: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);


// ✅ Prevent duplicate attendance for same employee & date
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

const Attendance = mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);
export default Attendance;
