import fs from "fs";
import path from "path";
import Employee from "../models/Employee.model.js";

class EmployeeService {

    /**
    
    * Upsert Employee from Microsoft Graph Data
    * Prevents duplicate employees during SSO login
      */
    async upsertEmployeeFromGraph(graphData, profileImageUrl) {
        if (!graphData || !graphData.email) {
            throw new Error("Email is required for employee creation");
        }

        const {
            email,
            firstName,
            lastName,
            designation,
            department,
            officeLocation,
            mobileNumber,
            microsoftId,
            employeeCode,
            address,
            city,
            state,
            country,
            managerEmail
        } = graphData;

        const normalizedEmail = email.trim().toLowerCase();

        // 1️⃣ Check if employee already exists
        let employee = await Employee.findOne({ email: normalizedEmail });

        // 2️⃣ Find reporting manager if available
        let reportingManagerId = null;

        if (managerEmail) {
            const manager = await Employee.findOne({ email: managerEmail.trim().toLowerCase() });
            if (manager) {
                reportingManagerId = manager._id;
            }
        }

        // 3️⃣ Prepare update fields
        const updateFields = {
            firstName: firstName || "Employee",
            lastName: lastName || ".",
            designation: designation || "Employee",
            department: department || "General",
            officeLocation: officeLocation || "Remote",
            mobileNumber: mobileNumber || "",
            microsoftId: microsoftId || null,
            address: address || "",
            city: city || "",
            state: state || "",
            country: country || "",
            lastGraphSync: new Date()
        };

        if (profileImageUrl) {
            updateFields.profileImage = profileImageUrl;
        }

        if (employeeCode) {
            updateFields.employeeCode = employeeCode;
        }

        if (reportingManagerId) {
            updateFields.reportingManager = reportingManagerId;
        }

        // 4️⃣ Update existing employee
        if (employee) {
            // Priority: Always use Graph employeeCode if available, otherwise keep existing/generate
            if (employeeCode) {
                employee.employeeId = employeeCode;
            } else if (!employee.employeeId) {
                employee.employeeId = await this.generateEmployeeId();
            }

            Object.assign(employee, updateFields);
            await employee.save();
            return employee;
        }

        // 5️⃣ Create new employee
        // const empId = employeeCode || await this.generateEmployeeId();
        // const newEmployee = await Employee.create({
        //     employeeId: empId,
        //     employeeCode: employeeCode || null, // Also store in auxiliary field for reference
        //     email,
        //     ...updateFields,
        //     dateOfJoining: new Date(),
        //     employmentType: "FULL_TIME",
        //     salaryStructure: {
        //         basicSalary: 0,
        //         annualSalary: 0
        //     },
        //     status: "PENDING",
        //     isActive: false,
        //     workLocation: "Onsite",
        //     shift: "DAY"
        // });
        // 5️⃣ Create new employee
        const empId = employeeCode || await this.generateEmployeeId();

        try {
            const newEmployee = await Employee.create({
                employeeId: empId,
                employeeCode: employeeCode || null,
                email: normalizedEmail,
                ...updateFields,
                dateOfJoining: new Date(),
                employmentType: "FULL_TIME",
                salaryStructure: {
                    basicSalary: 0,
                    annualSalary: 0
                },
                status: "APPROVED",
                isActive: true,
                workLocation: "Onsite",
                shift: "DAY"
            });

            return newEmployee;
        } catch (err) {
            console.error("Employee creation error:", err);

            // If it's a duplicate key error, return existing employee
            if (err.code === 11000) {
                console.log("Duplicate employee found, returning existing");
                return await Employee.findOne({ email: normalizedEmail });
            }

            throw err;
        }

        // return newEmployee;


    }

    /**
    
    * Generate a unique Employee ID (e.g., EMP001)
      */
    async generateEmployeeId() {
        const count = await Employee.countDocuments({ deletedAt: null });
        return `EMP${String(count + 1).padStart(3, "0")}`;
    }

    /**
    
    * Save Profile Photo to Local Storage
      */
    // saveProfilePhoto(photoBuffer, identifier) {


    //     if (!photoBuffer) return null;



    //     try {

    //         const fileName = `${identifier.replace(/[@.]/g, "_")}.jpg`;

    //         const uploadDir = path.join(process.cwd(), "uploads", "profile-photos");

    //         if (!fs.existsSync(uploadDir)) {
    //             fs.mkdirSync(uploadDir, { recursive: true });
    //         }

    //         const filePath = path.join(uploadDir, fileName);

    //         fs.writeFileSync(filePath, Buffer.from(photoBuffer));

    //         return `/uploads/profile-photos/${fileName}`;

    //     } catch (error) {

    //         console.error("Error saving profile photo:", error.message);

    //         return null;
    //     }


    // }
    saveProfilePhoto(photoBuffer, identifier) {

        if (!photoBuffer) {
            console.log("⚠️ No profile photo received from Microsoft Graph");
            return null;
        }

        try {
            const fileName = `${identifier.replace(/[@.]/g, "_")}.jpg`;

            const uploadDir = path.join(process.cwd(), "uploads", "profile-photos");

            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const filePath = path.join(uploadDir, fileName);

            fs.writeFileSync(filePath, Buffer.from(photoBuffer));


            return `/uploads/profile-photos/${fileName}`;

        } catch (error) {
            console.error("Error saving profile photo:", error.message);
            return null;
        }
    }

}

export default new EmployeeService();
