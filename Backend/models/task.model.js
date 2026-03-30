import mongoose from "mongoose";

/**
 * Comment Schema
 */
const commentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin", // Reference the User/Admin collection for auth
      required: true,
    },
  },
  { timestamps: true }
);

/**
 * Assigned Employee Schema (Advanced - per employee status)
 */
const assignedEmployeeSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed"],
      default: "Pending",
    },
    updatedAt: {
      type: Date,
    },
  },
  { _id: false }
);

/**
 * Task Schema
 */
const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    assignedTo: {
      type: [assignedEmployeeSchema],
      validate: [(val) => val.length > 0, "At least one employee is required"],
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin", // Admin who created the task
      required: true,
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },

    deadline: {
      type: Date,
    },

    attachments: [
      {
        type: String, // File URLs (Cloudinary / S3)
      },
    ],

    comments: [commentSchema],

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Indexes (Performance Optimization)
 */
taskSchema.index({ "assignedTo.employee": 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ deadline: 1 });
taskSchema.index({ createdAt: -1 });

/**
 * Middleware: Update assigned employee timestamp on status change
 */
taskSchema.pre("save", async function () {
  if (this.assignedTo && this.isModified("assignedTo")) {
    this.assignedTo.forEach((emp) => {
      emp.updatedAt = new Date();
    });
  }
});

const Task = mongoose.model("Task", taskSchema);

export default Task;