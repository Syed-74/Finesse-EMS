import cron from "node-cron";
import Employee from "../models/Employee.model.js";
import Attendance from "../models/attendance.model.js";
import Shift from "../models/shift.model.js";
import LeaveApplication from "../models/LeaveApplication.model.js";

const markAbsentCron = () => {
  // Run every hour
  cron.schedule("0 * * * *", async () => {
    console.log("Running Attendance Cron Job: Checking for Absentees...");

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 1. Get all active employees with shifts
      const employees = await Employee.find({ isActive: true, shiftId: { $exists: true } }).populate("shiftId");

      for (const employee of employees) {
        // 2. Check if attendance already exists for today
        const attendance = await Attendance.findOne({
          employee: employee._id,
          date: today
        });

        if (attendance) continue; // Already marked (Present/Late/Half Day/Already Absent)

        // 3. Check if on leave
        const leave = await LeaveApplication.findOne({
          employeeId: employee._id,
          startDate: { $lte: today },
          endDate: { $gte: today },
          status: "Approved",
          type: "Full Day"
        });

        if (leave) {
          // Mark as LEAVE if not already marked
          await Attendance.create({
            employee: employee._id,
            date: today,
            status: "Leave",
            remarks: "Full Day Leave Approved",
            autoMarked: true,
            shiftType: employee.shiftId.shiftType
          });
          continue;
        }

        // 4. Check Shift Start Time
        const [startH, startM] = employee.shiftId.startTime.split(":").map(Number);
        const shiftStartToday = new Date(today);
        shiftStartToday.setHours(startH, startM, 0, 0);

        const absentThreshold = new Date(shiftStartToday);
        absentThreshold.setHours(absentThreshold.getHours() + 4);

        if (new Date() > absentThreshold) {
          // Mark as Absent
          await Attendance.create({
            employee: employee._id,
            date: today,
            status: "Absent",
            remarks: "Auto-marked Absent (No check-in within 4 hours)",
            autoMarked: true,
            shiftType: employee.shiftId.shiftType
          });
          console.log(`Employee ${employee.email} marked as Absent.`);
        }
      }
    } catch (error) {
      console.error("Cron Job Error:", error);
    }
  });
};

export default markAbsentCron;
