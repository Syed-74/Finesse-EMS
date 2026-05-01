import OfficeConfig from "../models/officeConfig.model.js";

/**
 * @desc    Get all office configurations
 */
export const getAllConfigs = async (req, res) => {
  try {
    const configs = await OfficeConfig.find().sort({ createdAt: -1 });
    res.status(200).json(configs);
  } catch (error) {
    console.error("Get All Configs Error:", error);
    res.status(500).json({ message: "Failed to fetch configurations", error: error.message });
  }
};

/**
 * @desc    Create a new office configuration
 */
export const createConfig = async (req, res) => {
  try {
    console.log("Create Config Body:", req.body);
    const { name, allowedIPs, isActive } = req.body;

    // 1. Validate allowedIPs presence
    if (!allowedIPs || !Array.isArray(allowedIPs)) {
      return res.status(400).json({ message: "allowedIPs must be an array of strings." });
    }

    // 2. Clean and validate IPs
    const cleanedIPs = allowedIPs
      .filter(ip => typeof ip === 'string')
      .map(ip => ip.trim())
      .filter(ip => ip !== "");

    if (cleanedIPs.length === 0) {
      return res.status(400).json({ message: "At least one valid IP address is required." });
    }

    // 3. Remove duplicates
    const uniqueIPs = [...new Set(cleanedIPs)];
    
    const newConfig = new OfficeConfig({
      name: name || "Default Office",
      allowedIPs: uniqueIPs,
      isActive: isActive !== undefined ? isActive : true,
    });

    await newConfig.save();
    res.status(201).json(newConfig);
  } catch (error) {
    console.error("Create Config Error Details:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
      body: req.body
    });
    
    // Distinguish between validation errors and server errors
    if (error.name === "ValidationError") {
      const validationErrors = error.errors 
        ? Object.values(error.errors).map(err => err.message)
        : [error.message];

      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validationErrors 
      });
    }

    res.status(500).json({ 
      message: "An internal server error occurred while creating the configuration.", 
      error: error.message,
      stack: error.stack // Temporarily return stack trace to debug
    });
  }
};

/**
 * @desc    Update an office configuration
 */
export const updateConfig = async (req, res) => {
  try {
    const { name, allowedIPs, isActive } = req.body;
    const { id } = req.params;

    const config = await OfficeConfig.findById(id);
    if (!config) {
      return res.status(404).json({ message: "Configuration not found" });
    }

    if (name) config.name = name;
    
    if (allowedIPs !== undefined) {
      if (!Array.isArray(allowedIPs)) {
        return res.status(400).json({ message: "allowedIPs must be an array." });
      }
      
      const cleanedIPs = allowedIPs
        .filter(ip => typeof ip === 'string')
        .map(ip => ip.trim())
        .filter(ip => ip !== "");
        
      if (cleanedIPs.length === 0 && config.isActive) {
        return res.status(400).json({ message: "An active configuration must have at least one IP." });
      }
      
      config.allowedIPs = [...new Set(cleanedIPs)];
    }

    if (isActive !== undefined) config.isActive = isActive;

    await config.save();
    res.status(200).json(config);
  } catch (error) {
    console.error("Update Config Error:", error);
    
    if (error.name === "ValidationError") {
      const validationErrors = error.errors 
        ? Object.values(error.errors).map(err => err.message)
        : [error.message];

      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validationErrors 
      });
    }

    res.status(500).json({ 
      message: "An internal server error occurred while updating the configuration.", 
      error: error.message 
    });
  }
};

/**
 * @desc    Delete an office configuration
 */
export const deleteConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await OfficeConfig.findByIdAndDelete(id);
    
    if (!deleted) {
      return res.status(404).json({ message: "Configuration not found" });
    }

    res.status(200).json({ message: "Configuration deleted successfully" });
  } catch (error) {
    console.error("Delete Config Error:", error);
    res.status(500).json({ message: "Failed to delete configuration", error: error.message });
  }
};