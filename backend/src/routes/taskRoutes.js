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

const rolesAvailable = ["EMPLOYEE", "HR_ADMIN", "IT_ADMIN"];

const router = Router();
const employee = [requireAuth, allowedRoles(["EMPLOYEE"])];
const hr = [requireAuth, allowedRoles(["HR_ADMIN"])];

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

// HR_ADMIN
router.post("/", ...hr, AsynHandler(createTask));
router.get("/", ...hr, AsynHandler(listTasks));
router.get(
  "/admin/employees/:employeeId/tasks",
  ...hr,
  AsynHandler(getEmployeeTasks),
);
router.get(
  "/admin/employees/:employeeId/progress",
  ...hr,
  AsynHandler(getEmployeeProgress),
);
router.get("/:taskId", ...hr, AsynHandler(getTask));
router.put("/:taskId", ...hr, AsynHandler(updateTask));
router.patch("/:taskId/deactivate", ...hr, AsynHandler(deactivateTask));
router.post("/:taskId/assign", ...hr, AsynHandler(assignTask));
router.post("/:taskId/assign-bulk", ...hr, AsynHandler(assignTaskBulk));

export default router;
