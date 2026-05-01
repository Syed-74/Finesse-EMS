import OfficeConfig from "../models/officeConfig.model.js";

/**
 * Validates if the employee is allowed to punch in based on their work location and IP address.
 * 
 * @param {Object} req - The Express request object.
 * @param {Object} employee - The employee document from the database.
 * @returns {Promise<Object>} - { allowed: Boolean, workMode: String, message: String }
 */
export const validateAttendanceLocation = async (req, employee) => {
  try {
    const workLocation = employee.workLocation || "Onsite";

    // Debugging: Log initial context
    console.log("-----------------------------------------");
    console.log(`🔍 Attendance Validation for: ${employee.email}`);
    console.log(`👤 Work Location: ${workLocation}`);
    if (workLocation === "Remote") {
      console.log("✅ Validation Skipped: Remote workers bypass IP check.");
      console.log("-----------------------------------------");
      return { allowed: true, workMode: "Remote" };
    }

    // 2. Fetch Active Office Configuration
    const activeConfig = await OfficeConfig.findOne({ isActive: true });

    // Fail-safe: If no active config or no IPs listed, allow attendance
    if (!activeConfig || !activeConfig.allowedIPs || activeConfig.allowedIPs.length === 0) {
      // console.log("Employee Work Location:", workLocation);
      // console.log("🌐 Employee IP (detected):", clientIp);
      // console.log("📡 Allowed Office IPs:", activeConfig?.allowedIPs);
      // console.log("👤 Employee Work Location:", employee.workLocation);
      // console.log("⚠️  Attendance Validation: No active office network IP configuration found. Allowing attendance as fail-safe.");
      // console.log("-----------------------------------------");
      return { allowed: true, workMode: workLocation === "Hybrid" ? "Remote" : "Onsite" };
    }

    // 3. Get Employee's Current IP
    // req.ip handled by Express, but we also check X-Forwarded-For for proxy/load balancer
    let clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    // console.log("Headers:", req.headers);
    // console.log("Socket:", req.socket.remoteAddress);
    // console.log("Client IP (Final):", clientIp);


    // If x-forwarded-for is a comma-separated list, take the first one
    if (clientIp && clientIp.includes(",")) {
      clientIp = clientIp.split(",")[0].trim();
    }

    // Normalize IPv4 mapped IPv6 addresses (::ffff:192.168.1.1 -> 192.168.1.1)
    if (clientIp && clientIp.startsWith("::ffff:")) {
      clientIp = clientIp.substring(7);
    }

    // Handle localhost ::1
    if (clientIp === "::1") {
      clientIp = "127.0.0.1";
    }

    const isOfficeIp = activeConfig.allowedIPs.includes(clientIp);

    // Debugging: Log IP comparison results
    // console.log("🌐 Detected Client IP:", clientIp);
    // console.log("📡 Allowed Office IPs:", activeConfig.allowedIPs);
    // console.log(`✅ IP Match Status: ${isOfficeIp ? "MATCHED" : "MISMATCH"}`);
    // console.log("-----------------------------------------");

    // 4. Hybrid: If IP matches -> Onsite, else -> Remote (always allowed)
    if (workLocation === "Hybrid") {
      return {
        allowed: true,
        workMode: isOfficeIp ? "Onsite" : "Remote"
      };
    }

    // 5. Onsite: Strictly must match Office IP
    if (workLocation === "Onsite") {
      if (isOfficeIp) {
        return { allowed: true, workMode: "Onsite" };
      } else {
        return {
          allowed: false,
          workMode: "Onsite",
          message: "You must be connected to the office network to mark attendance"
        };
      }
    }

    // Default fallback
    return { allowed: true, workMode: "Remote" };

  } catch (error) {
    console.error("Attendance Validation Service Error:", error);
    // Fail-safe: Allow attendance on internal error
    return { allowed: true, workMode: "Remote" };
  }
};
