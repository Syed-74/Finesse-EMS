import Task from "../models/task.model.js";

/**
 * ✅ Create Task (Admin)
 */
export const createTask = async (req, res) => {
  try {
    console.log("--- Task Creation Debug ---");
    console.log("User from Request:", req.user ? req.user._id : "No user found");
    console.log("Payload:", JSON.stringify(req.body, null, 2));

    const { title, description, assignedTo, priority, deadline } = req.body;

    if (!title || !assignedTo || assignedTo.length === 0) {
      return res.status(400).json({ success: false, message: "Missing required fields (title, assignedTo)" });
    }

    const task = await Task.create({
      title,
      description,
      assignedTo,
      assignedBy: req.user._id,
      priority,
      deadline,
    });

    console.log("Task Created Successfully:", task._id);

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    console.error("Create Task Error Details:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error : undefined 
    });
  }
};

/**
 * ✅ Get All Tasks (Admin)
 */
export const getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ isDeleted: false })
      .populate("assignedBy", "firstName lastName email")
      .populate("assignedTo.employee", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ✅ Get My Tasks (Employee)
 */
export const getMyTasks = async (req, res) => {
  try {
    // If the logged in user is an employee, we must search by their linked Employee ID
    // Try req.user.employeeId first, then fallback to req.employee._id
    let searchId = req.user._id;
    if (req.user.role === 'employee') {
      searchId = req.user.employeeId || (req.employee ? req.employee._id : null);
    }

    if (!searchId) {
      return res.status(200).json({ success: true, tasks: [] });
    }

    const tasks = await Task.find({
      "assignedTo.employee": searchId,
      isDeleted: false,
    })
      .populate("assignedBy", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ✅ Update Task (Admin)
 */
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({
      success: true,
      message: "Task updated",
      task,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ✅ Soft Delete Task (Admin)
 */
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Task deleted",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ✅ Update Task Status (Employee)
 */
export const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    // Use linked Employee ID if user is an employee
    // Try req.user.employeeId first, then fallback to req.employee._id (attached by middleware)
    let searchId = req.user._id;
    if (req.user.role === 'employee') {
      searchId = req.user.employeeId || (req.employee ? req.employee._id : null);
    }

    console.log(`--- Status Update Debug ---`);
    console.log(`Task: ${task.title}`);
    console.log(`User Role: ${req.user.role}`);
    console.log(`Searching for ID: ${searchId}`);
    console.log(`Assigned Employees:`, task.assignedTo.map(e => e.employee.toString()));

    if (!searchId) {
      console.error("Error: Could not determine employee ID for this user");
      return res.status(403).json({ message: "Employee profile not found" });
    }

    const employeeTask = task.assignedTo.find(
      (emp) => emp.employee.toString() === searchId.toString()
    );

    if (!employeeTask) {
      return res.status(403).json({ message: "Not assigned to this task" });
    }

    const currentStatus = employeeTask.status;

    // Enforce status transition flow: Pending -> In Progress -> Completed
    if (currentStatus === "In Progress" && status === "Pending") {
      return res.status(400).json({ message: "Task status cannot be moved to a previous stage." });
    }
    if (currentStatus === "Completed" && (status === "In Progress" || status === "Pending")) {
      return res.status(400).json({ message: "Task status cannot be moved to a previous stage." });
    }

    employeeTask.status = status;
    employeeTask.updatedAt = new Date();

    await task.save();

    res.status(200).json({ success: true, message: "Status updated", task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ✅ Add Comment (Employee/Admin)
 */
export const addComment = async (req, res) => {
  try {
    const { text } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    task.comments.push({
      text,
      createdBy: req.user._id,
    });

    await task.save();

    res.status(200).json({
      success: true,
      message: "Comment added",
      task,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ✅ Get Single Task
 */
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assignedBy", "firstName lastName email")
      .populate("assignedTo.employee", "firstName lastName email")
      .populate("comments.createdBy", "firstName lastName");

    if (!task) return res.status(404).json({ message: "Task not found" });

    res.status(200).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};