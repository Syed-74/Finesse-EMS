import cron from "node-cron";
import Employee from "../models/Employee.model.js";
import Attendance from "../models/attendance.model.js";
import Shift from "../models/shift.model.js";
import LeaveApplication from "../models/LeaveApplication.model.js";
import moment from "moment";

const markAbsentCron = () => {
  // Run every hour
  cron.schedule("0 * * * *", async () => {
    console.log("Running Attendance Cron Job: Checking for Absentees...");

    try {
      const now = moment().utcOffset("+05:30");
      const today = now.clone().startOf("day").toDate();

      const yesterday = now.clone().subtract(1, "day").startOf("day").toDate();

      // Check both yesterday and today to capture night shifts that started on the previous day
      const datesToCheck = [yesterday, today];

      // 1. Get all active employees with shifts
      const employees = await Employee.find({ isActive: true, shiftId: { $exists: true } }).populate("shiftId");

      for (const targetDate of datesToCheck) {
        for (const employee of employees) {
          // 2. Check if attendance already exists for this target date
          const attendance = await Attendance.findOne({
            employee: employee._id,
            date: targetDate
          });

          if (attendance) continue; 

          // 3. Check if on leave for this target date
          const leave = await LeaveApplication.findOne({
            employeeId: employee._id,
            startDate: { $lte: targetDate },
            endDate: { $gte: targetDate },
            status: "Approved",
            type: "Full Day"
          });

          if (leave) {
            await Attendance.create({
              employee: employee._id,
              date: targetDate,
              status: "Leave",
              remarks: "Full Day Leave Approved",
              autoMarked: true,
              shiftType: employee.shiftId.shiftType
            });
            continue;
          }

          // 4. Check Shift Start Time for this target date
          const [startH, startM] = employee.shiftId.startTime.split(":").map(Number);
          const shiftStartOnTargetDate = moment(targetDate).set({ hour: startH, minute: startM, second: 0, millisecond: 0 });

          const absentThreshold = shiftStartOnTargetDate.clone().add(4, "hours");

          // If current time is past the 4-hour grace period for this shift
          if (now.isAfter(absentThreshold)) {
            await Attendance.create({
              employee: employee._id,
              date: targetDate,
              status: "Absent",
              remarks: "Auto-marked Absent (No check-in within 4 hours of shift start)",
              autoMarked: true,
              shiftType: employee.shiftId.shiftType
            });
            console.log(`Employee ${employee.email} marked as Absent for ${targetDate.toDateString()}.`);
          }
        }
      }
    } catch (error) {
      console.error("Cron Job Error:", error);
    }
  });
};

export default markAbsentCron;
