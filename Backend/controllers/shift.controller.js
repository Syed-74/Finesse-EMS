import Shift from "../models/shift.model.js";
import Employee from "../models/Employee.model.js";

// Create Shift
export const createShift = async (req, res) => {
  try {
    const { shiftType, startTime, endTime, duration } = req.body;

    const existing = await Shift.findOne({ shiftType });
    if (existing) {
      return res.status(400).json({
        message: `Shift type ${shiftType} already exists`
      });
    }

    const shift = await Shift.create({
      shiftType,
      startTime,
      endTime,
      duration
    });

    res.status(201).json({
      message: "Shift created successfully",
      shift
    });

  } catch (error) {

    // ✅ HANDLE DUPLICATE KEY ERROR (IMPORTANT)
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Shift already exists"
      });
    }

    console.error("Create Shift Error:", error);

    res.status(500).json({
      message: "Server Error while creating shift"
    });
  }
};

// Get All Shifts
export const getAllShifts = async (req, res) => {
  try {
    const shifts = await Shift.find();
    res.json(shifts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign Shift to Employee
export const assignShiftToEmployee = async (req, res) => {
  try {
    const { employeeId, shiftId } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const shift = await Shift.findById(shiftId);
    if (!shift) {
      return res.status(404).json({ message: "Shift not found" });
    }

    employee.shiftId = shiftId;
    employee.shift = shift.shiftType; // Also update string for compatibility
    await employee.save();

    res.json({ message: "Shift assigned to employee successfully", employee });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get My Shift (Employee)
export const getMyShift = async (req, res) => {
  try {
    const employeeId = req.employee._id;
    const employeeProfile = await Employee.findById(employeeId).populate("shiftId");

    if (!employeeProfile || !employeeProfile.shiftId) {
      let searchType = employeeProfile?.shift || "Morning";
      // Map legacy "DAY" to "Morning"
      if (searchType === "DAY") searchType = "Morning";
      if (searchType === "NIGHT") searchType = "Night";

      const fallbackShift = await Shift.findOne({ shiftType: searchType });
      if (fallbackShift) {
        return res.status(200).json(fallbackShift);
      }

      // Final attempt: just get the first available shift
      const anyShift = await Shift.findOne();
      if (anyShift) {
        return res.status(200).json(anyShift);
      }

      return res.status(200).json(null);
    }

    res.json(employeeProfile.shiftId);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Shift
export const updateShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { startTime, endTime, duration } = req.body;

    const shift = await Shift.findById(id);
    if (!shift) return res.status(404).json({ message: "Shift not found" });

    if (startTime) shift.startTime = startTime;
    if (endTime) shift.endTime = endTime;
    if (duration) shift.duration = duration;

    await shift.save();
    res.json({ message: "Shift updated", shift });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Shift
export const deleteShift = async (req, res) => {
  try {
    const { id } = req.params;
    await Shift.findByIdAndDelete(id);
    res.json({ message: "Shift deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
