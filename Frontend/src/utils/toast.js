import { toast } from "react-hot-toast";

/**
 * Modern Toast Notifications Utility
 */
export const showSuccess = (message) => {
  toast.success(message, {
    duration: 4000,
    style: {
      background: "#fff",
      color: "#1e293b",
      fontWeight: "600",
      fontSize: "14px",
      borderRadius: "12px",
      border: "1px solid #e2e8f0",
      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
    },
    iconTheme: {
      primary: "#10b981",
      secondary: "#fff",
    },
  });
};

export const showError = (message) => {
  toast.error(message || "Something went wrong!", {
    duration: 5000,
    style: {
      background: "#fff",
      color: "#1e293b",
      fontWeight: "600",
      fontSize: "14px",
      borderRadius: "12px",
      border: "1px solid #fee2e2",
      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
    },
    iconTheme: {
      primary: "#ef4444",
      secondary: "#fff",
    },
  });
};

export const showWarning = (message) => {
  toast(message, {
    icon: "⚠️",
    duration: 5000,
    style: {
      background: "#fff",
      color: "#1e293b",
      fontWeight: "600",
      fontSize: "14px",
      borderRadius: "12px",
      border: "1px solid #fef3c7",
      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
    },
  });
};

export const showInfo = (message) => {
  toast(message, {
    icon: "ℹ️",
    duration: 4000,
    style: {
      background: "#fff",
      color: "#1e293b",
      fontWeight: "600",
      fontSize: "14px",
      borderRadius: "12px",
      border: "1px solid #e0f2fe",
      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
    },
  });
};
