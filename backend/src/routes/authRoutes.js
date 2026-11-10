import { Router } from "express";
import {
  getCurrentUser,
  updateCurrentUser,
  createEmployee,
  listEmployees,
  listDepartments,
  login,
  logout,
  refresh,
} from "../controllers/authController.js";
import {
  assignEngineerToTeam,
  listTeams,
} from "../controllers/teamController.js";
import { allowedRoles, requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", requireAuth, getCurrentUser);
router.patch("/me", requireAuth, updateCurrentUser);
router.post(
  "/employees",
  requireAuth,
  allowedRoles(["ENGINEERING_ADMIN"]),
  createEmployee,
);
router.get(
  "/employees",
  requireAuth,
  allowedRoles(["ENGINEERING_ADMIN"]),
  listEmployees,
);
router.get(
  "/departments",
  requireAuth,
  allowedRoles(["ENGINEERING_ADMIN"]),
  listDepartments,
);
router.get(
  "/teams",
  requireAuth,
  allowedRoles(["ENGINEER", "ENGINEERING_ADMIN"]),
  listTeams,
);
router.patch(
  "/employees/:employeeId/team",
  requireAuth,
  allowedRoles(["ENGINEERING_ADMIN"]),
  assignEngineerToTeam,
);

export default router;
