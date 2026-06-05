import jwt from "jsonwebtoken";
import Admin from "../models/admin.model.js";
import Employee from "../models/Employee.model.js";

class AuthService {
    /**
     * Generate JWT Token
     * @param {Object} user - Admin/Employee user object
     * @returns {string} - Signed JWT
     */
    generateToken(user) {
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not configured on the server.");
        }

        return jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );
    }

    /**
     * Handle Admin Record Sync for SSO
     * @param {Object} graphData - Data from MS Graph
     * @param {string} profileImageUrl - Local path to saved photo
     * @returns {Promise<Object>} - Updated Admin record
     */
    async syncAdminRecord(graphData, profileImageUrl) {
        if (!graphData || !graphData.email) {
            throw new Error("Invalid Graph data: Email is required for Admin sync");
        }
        const { email, firstName, lastName, microsoftId, mobileNumber } = graphData;
        const normalizedEmail = email.trim().toLowerCase();
        
        // Find existing employee to link record
        const employee = await Employee.findOne({ email: normalizedEmail });

        let admin = await Admin.findOne({ email: normalizedEmail });

        if (!admin) {
            admin = await Admin.create({
                firstName: firstName || "Employee",
                lastName: lastName || ".",
                email: normalizedEmail,
                mobileNumber: mobileNumber || '',
                password: '',
                ssoProvider: 'microsoft',
                ssoId: microsoftId,
                isActive: true,
                status: "APPROVED",
                role: "employee", // Default role for new SSO registrations
                profileImage: profileImageUrl || "",
                lastGraphSync: new Date(),
                employeeId: employee?._id || null
            });
        } else {
            // Keep existing isActive and status unless it's a legacy record with no status
            if (!admin.status) {
                admin.status = "APPROVED";
                admin.isActive = true;
            }
            admin.firstName = firstName || admin.firstName;
            admin.lastName = lastName || admin.lastName;
            admin.ssoProvider = 'microsoft';
            admin.ssoId = microsoftId || admin.ssoId;
            admin.lastGraphSync = new Date();
            if (profileImageUrl) admin.profileImage = profileImageUrl;
            if (employee) admin.employeeId = employee._id;
            await admin.save();
        }

        return admin;
    }
}

export default new AuthService();
