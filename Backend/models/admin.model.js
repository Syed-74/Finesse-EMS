import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (email) {
          return (
            email.endsWith("@finesse-cs.tech") ||
            email.endsWith("@email.com")
          );
        },
        message:
          "Email domain must be @finesse-cs.tech or @email.com",
      },
    },

    mobileNumber: {
      type: String,
      trim: true,
    },

    profileImage: {
      type: String,
    },

    password: {
      type: String,
      required: function () {
        return !this.ssoProvider; // Password not required for SSO users
      },
    },

    ssoProvider: {
      type: String,
      enum: ["microsoft", "google", null],
      default: null,
    },

    ssoId: {
      type: String,
      sparse: true, // Allow multiple null values
    },

    role: {
      type: String,
      enum: ["admin", "employee"],
      default: "employee",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    preferences: {
      emailNotifications: { type: Boolean, default: true },
      payrollAlerts: { type: Boolean, default: true },
      leaveAlerts: { type: Boolean, default: true },
    },

    security: {
      twoFactorEnabled: { type: Boolean, default: false },
      lastLoginIP: { type: String },
      lastLoginTime: { type: Date },
    },

    lastGraphSync: {
      type: Date,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      sparse: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

const Admin = mongoose.model("Admin", adminSchema);
export default Admin;