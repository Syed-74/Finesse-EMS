import bcrypt from "bcryptjs";
import Employee from "../models/employee.model.js";
import LeaveManagement from "../models/leaveManagement.model.js";
import Admin from "../models/admin.model.js";

/* =========================
   HELPER: GENERATE EMPLOYEE ID
   EMP001, EMP002, ...
========================= */
export const generateEmployeeId = async () => {
    const count = await Employee.countDocuments({ deletedAt: null });
    return `EMP${String(count + 1).padStart(3, "0")}`;
};

/* =========================
   CREATE EMPLOYEE (ADMIN)
========================= */
export const createEmployee = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            password,
            mobileNumber,
            designation,
            department,
            dateOfJoining,
            employmentType,
            workLocation,
            shift,
        } = req.body;

        const existingEmployee = await Employee.findOne({ email });
        if (existingEmployee) {
            return res.status(400).json({ message: "Employee already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const employee = await Employee.create({
            firstName,
            lastName,
            email,
            mobileNumber,
            password: hashedPassword,
            designation,
            department,
            dateOfJoining,
            employmentType,
            workLocation,
            shift,
            createdBy: req.admin._id,
        });

        res.status(201).json({
            message: "Employee created successfully",
            employee,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* =========================
   GET ALL EMPLOYEES (ADMIN)
========================= */
export const getAllEmployees = async (req, res) => {
    try {
        const employees = await Employee.find({ deletedAt: null })
            .select("-password")
            .sort({ createdAt: -1 });

        res.json(employees);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* =========================
   GET EMPLOYEE BY ID
========================= */
export const getEmployeeById = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id).select("-password");

        if (!employee || employee.deletedAt) {
            return res.status(404).json({ message: "Employee not found" });
        }

        res.json(employee);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* =========================
   UPDATE EMPLOYEE (ADMIN)
========================= */
export const updateEmployee = async (req, res) => {
    try {
        const updatedEmployee = await Employee.findByIdAndUpdate(
            req.params.id,
            {
                ...req.body,
                updatedBy: req.admin._id,
            },
            { new: true }
        ).select("-password");

        if (!updatedEmployee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        // ✅ Sync Leave Allocation with LeaveManagement model if provided
        if (req.body.leaveAllocation) {
            const allocation = req.body.leaveAllocation;

            // Find the corresponding Auth record to use its ID for syncing
            const authRecord = await Admin.findOne({ email: updatedEmployee.email });
            const targetId = authRecord ? authRecord._id : updatedEmployee._id;

            // Calculate totals
            let total = 0;
            let used = 0;
            const typeWise = {};
            const detailed = {};

            Object.entries(allocation).forEach(([type, data]) => {
                total += Number(data.total) || 0;
                used += Number(data.used) || 0;
                typeWise[type] = (Number(data.total) || 0) - (Number(data.used) || 0);
                detailed[type] = {
                    total: Number(data.total) || 0,
                    used: Number(data.used) || 0
                };
            });

            await LeaveManagement.findOneAndUpdate(
                { employeeId: targetId },
                {
                    $set: {
                        employeeId: targetId,
                        employeeName: `${updatedEmployee.firstName} ${updatedEmployee.lastName}`,
                        leaveBalance: {
                            totalLeaves: total,
                            usedLeaves: used,
                            remainingLeaves: total - used,
                            leaveTypeWiseBalance: typeWise,
                            detailedBalance: detailed
                        }
                    }
                },
                { upsert: true, new: true }
            );
        }

        res.json({
            message: "Employee updated successfully",
            employee: updatedEmployee,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* =========================
   DELETE EMPLOYEE (SOFT)
========================= */
export const deleteEmployee = async (req, res) => {
    try {
        const employee = await Employee.findByIdAndUpdate(
            req.params.id,
            {
                deletedAt: new Date(),
                isActive: false,
                updatedBy: req.admin._id,
            },
            { new: true }
        );

        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        res.json({ message: "Employee deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* =========================
   GET CURRENT EMPLOYEE PROFILE (SELF)
========================= */
export const getEmployeeProfile = async (req, res) => {
    try {
        // req.admin is set by protectAdmin middleware (User record)
        const email = req.admin.email;
        const employee = await Employee.findOne({ email })
            .select("-password")
            .populate("reportingManager", "firstName lastName");

        if (!employee) {
            return res.status(404).json({ message: "Employee profile not found" });
        }

        res.json(employee);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* =========================
   UPDATE PROFILE IMAGE (SELF)
========================= */
export const updateEmployeeProfileImage = async (req, res) => {
    try {
        const email = req.admin.email;

        if (!req.file) {
            return res.status(400).json({ message: "No image file provided" });
        }

        const profileImage = `/uploads/${req.file.filename}`;

        const employee = await Employee.findOneAndUpdate(
            { email },
            { profileImage },
            { new: true }
        ).select("-password");

        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        // Also update Admin record if it exists to keep in sync
        await Admin.findOneAndUpdate({ email }, { profileImage });

        res.json({
            message: "Profile image updated successfully",
            profileImage: employee.profileImage
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
