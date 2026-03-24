import mongoose from "mongoose";

const shiftSchema = new mongoose.Schema(
  {
    shiftType: {
      type: String,
      enum: ["Morning", "Afternoon", "Night"],
      required: true,
      unique: true
    },
    startTime: {
      type: String, // "09:00"
      required: true
    },
    endTime: {
      type: String, // "18:00"
      required: true
    },
    duration: {
      type: Number, // 9 hours
      default: 9
    }
  },
  { timestamps: true }
);

const Shift = mongoose.models.Shift || mongoose.model("Shift", shiftSchema);
export default Shift;
