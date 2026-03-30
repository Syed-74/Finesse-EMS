import express from "express";
import {
  createTask,
  getAllTasks,
  getMyTasks,
  updateTask,
  deleteTask,
  updateTaskStatus,
  addComment,
  getTaskById,
} from "../controllers/task.controller.js";

import { protect, isAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * 🔹 Admin Routes
 */
router.post("/create", protect, isAdmin, createTask);
router.get("/all", protect, isAdmin, getAllTasks);
router.put("/update/:id", protect, isAdmin, updateTask);
router.delete("/delete/:id", protect, isAdmin, deleteTask);

/**
 * 🔹 Employee Routes
 */
router.get("/my-tasks", protect, getMyTasks);
router.put("/update-status/:id", protect, updateTaskStatus);

/**
 * 🔹 Common
 */
router.post("/add-comment/:id", protect, addComment);
router.get("/:id", protect, getTaskById);

export default router;