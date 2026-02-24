import fs from "fs";
import path from "path";
import Employee from "../models/employee.model.js";

class EmployeeService {
    /**
     * Upsert Employee from Microsoft Graph Data
     * @param {Object} graphData - Formatted data from MS Graph
     * @param {string} profileImageUrl - Local path to saved photo
     * @returns {Promise<Object>} - Upserted Employee record
     */
    async upsertEmployeeFromGraph(graphData, profileImageUrl) {
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

        // 1. Link Manager if exists
        let reportingManagerId = null;
        if (managerEmail) {
            const manager = await Employee.findOne({ email: managerEmail });
            if (manager) {
                reportingManagerId = manager._id;
            }
        }

        // 2. Prepare Update Fields
        const updateFields = {
            firstName,
            lastName,
            email,
            designation: designation || "Employee",
            department: department || "General",
            officeLocation: officeLocation || "Remote",
            mobileNumber: mobileNumber || "",
            microsoftId: microsoftId,
            isActive: true,
            lastGraphSync: new Date(),
            address: address || "",
            city: city || "",
            state: state || "",
            country: country || "",
            profileImage: profileImageUrl || undefined,
        };

        if (employeeCode) {
            updateFields.employeeCode = employeeCode;
        }

        if (reportingManagerId) {
            updateFields.reportingManager = reportingManagerId;
        }

        // 3. Prepare SetOnInsert Fields
        const setOnInsertFields = {
            dateOfJoining: new Date(),
            employmentType: "FULL_TIME",
            salaryStructure: { basicSalary: 0, annualSalary: 0 },
            workLocation: "OFFICE",
            shift: "DAY"
        };

        // 4. Execute Upsert
        return await Employee.findOneAndUpdate(
            { email },
            {
                $set: updateFields,
                $setOnInsert: setOnInsertFields
            },
            { upsert: true, new: true, runValidators: true }
        );
    }

    /**
     * Sync All Users from Microsoft Graph (Batch Process)
     * @param {string} accessToken - Microsoft Graph Access Token
     * @returns {Promise<Object>} - Summary of sync results
     */
    async syncAllUsers(accessToken) {
        let nextLink = null;
        let totalProcessed = 0;
        let totalUpdated = 0;
        let totalErrors = 0;

        console.log("Starting Enterprise-wide Microsoft Graph Sync...");

        try {
            do {
                const result = await microsoftGraphService.getUsers(accessToken, nextLink);
                const users = result.users;
                nextLink = result.nextLink;

                console.log(`Processing batch of ${users.length} users...`);

                // Process batch
                // We use Promise.allSettled to ensure one failure doesn't stop the whole batch
                const results = await Promise.allSettled(users.map(async (userData) => {
                    // Format userData to match our graphData structure
                    const nameParts = (userData.displayName || "").split(' ');
                    const formattedData = {
                        microsoftId: userData.id,
                        firstName: userData.givenName || nameParts[0] || "User",
                        lastName: userData.surname || nameParts.slice(1).join(' ') || '.',
                        email: userData.mail || userData.userPrincipalName,
                        designation: userData.jobTitle || "Employee",
                        department: userData.department || "General",
                        officeLocation: userData.officeLocation || "Remote",
                        mobileNumber: userData.mobilePhone || "",
                        employeeCode: userData.employeeId || undefined,
                        address: userData.streetAddress || "",
                        city: userData.city || "",
                        state: userData.state || "",
                        country: userData.country || "",
                        managerEmail: null // Linking manager in batch is expensive, maybe skip or handle separately
                    };

                    // Check domain
                    const domain = formattedData.email.split('@')[1];
                    if (!["finesse-cs.tech", "email.com"].includes(domain)) {
                        throw new Error(`Domain ${domain} not allowed`);
                    }

                    return await this.upsertEmployeeFromGraph(formattedData, null);
                }));

                // Update counters
                results.forEach(res => {
                    totalProcessed++;
                    if (res.status === 'fulfilled') totalUpdated++;
                    else totalErrors++;
                });

                console.log(`Intermediate Progress: ${totalUpdated} updated, ${totalErrors} errors.`);

            } while (nextLink);

            console.log("Enterprise Sync Finished.");
            return {
                success: true,
                totalProcessed,
                totalUpdated,
                totalErrors,
                timestamp: new Date()
            };
        } catch (error) {
            console.error("Batch Sync Critical Failure:", error.message);
            throw error;
        }
    }

    /**
     * Save Profile Photo to Local Storage
     * @param {Buffer} photoBuffer - Buffer from MS Graph
     * @param {string} identifier - e.g. email or microsoftId
     * @returns {string|null} - Local path to saved photo or null
     */
    saveProfilePhoto(photoBuffer, identifier) {
        if (!photoBuffer) return null;

        try {
            const fileName = `${identifier.replace(/[@.]/g, '_')}.jpg`;
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
