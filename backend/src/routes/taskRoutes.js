import { Router } from "express";
import { allowedRoles, requireAuth } from "../middleware/authMiddleware.js";
import AsynHandler from "../utils/AsynHandler.js";
import {
  assignTask,
  assignTaskBulk,
  completeMyTask,
  createTask,
  deactivateTask,
  getEmployeeProgress,
  getEmployeeTasks,
  getMyProgress,
  getMyTask,
  getMyTasks,
  getTask,
  listTasks,
  startMyTask,
  updateTask,
} from "../controllers/taskController.js";

const router = Router();
const employee = [requireAuth, allowedRoles(["ENGINEER"])];
const engineeringAdmin = [requireAuth, allowedRoles(["ENGINEERING_ADMIN"])];

router.get("/my-tasks", ...employee, AsynHandler(getMyTasks));
router.get("/my-tasks/:assignmentId", ...employee, AsynHandler(getMyTask));

router.patch(
  "/my-tasks/:assignmentId/start",
  ...employee,
  AsynHandler(startMyTask),
);

router.patch(
  "/my-tasks/:assignmentId/complete",
  ...employee,
  AsynHandler(completeMyTask),
);

router.get("/my-progress", ...employee, AsynHandler(getMyProgress));

// ENGINEERING_ADMIN
router.post("/", ...engineeringAdmin, AsynHandler(createTask));
router.get("/", ...engineeringAdmin, AsynHandler(listTasks));
router.get(
  "/admin/employees/:employeeId/tasks",
  ...engineeringAdmin,
  AsynHandler(getEmployeeTasks),
);
router.get(
  "/admin/employees/:employeeId/progress",
  ...engineeringAdmin,
  AsynHandler(getEmployeeProgress),
);
router.get("/:taskId", ...engineeringAdmin, AsynHandler(getTask));
router.put("/:taskId", ...engineeringAdmin, AsynHandler(updateTask));
router.patch(
  "/:taskId/deactivate",
  ...engineeringAdmin,
  AsynHandler(deactivateTask),
);
router.post("/:taskId/assign", ...engineeringAdmin, AsynHandler(assignTask));
router.post(
  "/:taskId/assign-bulk",
  ...engineeringAdmin,
  AsynHandler(assignTaskBulk),
);

export default router;
