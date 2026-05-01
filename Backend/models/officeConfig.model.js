import mongoose from "mongoose";

const officeConfigSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "Default Office",
      trim: true,
    },
    allowedIPs: {
      type: [String],
      required: [true, "At least one IP address is required"],
      validate: {
        validator: function (ips) {
          if (!Array.isArray(ips) || ips.length === 0) return false;

          return ips.every((ip) => {
            if (typeof ip !== "string") return false;
            const cleanedIp = ip.trim();
            
            // IPv4 validation
            const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
            if (ipv4Regex.test(cleanedIp)) {
              const parts = cleanedIp.split(".");
              return parts.every(num => {
                const n = Number(num);
                return n >= 0 && n <= 255;
              });
            }

            // IPv6 validation (including localhost ::1)
            const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^(([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
            return ipv6Regex.test(cleanedIp) || cleanedIp === "::1";
          });
        },
        message: "One or more IP addresses are invalid.",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Middleware to ensure only one config is active at a time
officeConfigSchema.pre("save", async function () {
  console.log("Pre-save hook triggered for document:", this._id);
  try {
    if (this.isActive) {
      console.log("Deactivating other configurations...");
      // Using this.constructor is safer and more reliable in Mongoose 9+
      await this.constructor.updateMany(
        { _id: { $ne: this._id } },
        { $set: { isActive: false } }
      );
      console.log("Deactivation completed successfully.");
    }
  } catch (error) {
    console.error("OfficeConfig pre-save CRITICAL error:", error);
    // In Mongoose 9, async hooks should throw to abort save
    throw error;
  }
});

const OfficeConfig = mongoose.models.OfficeConfig || mongoose.model("OfficeConfig", officeConfigSchema);

export default OfficeConfig;