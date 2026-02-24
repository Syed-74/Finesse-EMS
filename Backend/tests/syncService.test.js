import employeeService from "../services/employee.service.js";
import Employee from "../models/employee.model.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

/**
 * Sync Service Test
 * This script verifies the EmployeeService upsert logic with mock data.
 */
async function testSyncService() {
    console.log("--- Starting Sync Service Verification ---");

    try {
        // Connect to DB for test (optional, can also just verify logic if mocked)
        // If DB_URI is available, we can do a real test on a scratch record
        if (process.env.MONGO_URI) {
            await mongoose.connect(process.env.MONGO_URI);
            console.log("Connected to MongoDB for testing.");
        }

        const mockGraphData = {
            microsoftId: "test-ms-id-001",
            firstName: "Alex",
            lastName: "Enterprise",
            email: "alex.sync@finesse-cs.tech",
            designation: "Systems Architect",
            department: "Cloud Services",
            officeLocation: "Bangalore HQ",
            mobileNumber: "+91 9000000001",
            employeeCode: "FIN-TEST-001",
            address: "123 Tech Park",
            city: "Bangalore",
            state: "Karnataka",
            country: "India",
            managerEmail: null
        };

        console.log("Testing upsertEmployeeFromGraph with mock data...");
        const result = await employeeService.upsertEmployeeFromGraph(mockGraphData, "/uploads/profile-photos/test.jpg");

        console.log("Upsert Result Data:");
        console.log("- ID:", result._id);
        console.log("- Name:", result.firstName, result.lastName);
        console.log("- Last Sync Date:", result.lastGraphSync);
        console.log("- Employee Code:", result.employeeCode);

        if (result.email === mockGraphData.email && result.lastGraphSync) {
            console.log("✅ Sync Logic Verified Successfully.");
        } else {
            console.error("❌ Sync Logic Verification Failed: Data mismatch.");
        }

    } catch (error) {
        console.error("❌ Sync Service Verification Error:", error.message);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
            console.log("Disconnected from MongoDB.");
        }
    }
}

testSyncService();
