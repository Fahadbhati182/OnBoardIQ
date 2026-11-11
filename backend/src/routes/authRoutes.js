import { Router } from "express";
import {
  getCurrentUser,
  updateCurrentUser,
  createEmployee,
  completeEmployeePasswordSetup,
  listEmployees,
  listDepartments,
  login,
  logout,
  refresh,
  resendEmployeeInvite,
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
router.post("/password-setup", completeEmployeePasswordSetup);
router.get("/me", requireAuth, getCurrentUser);
router.patch("/me", requireAuth, updateCurrentUser);
router.post(
  "/employees",
  requireAuth,
  allowedRoles(["ENGINEERING_ADMIN"]),
  createEmployee,
);
router.post(
  "/employees/:employeeId/password-setup",
  requireAuth,
  allowedRoles(["ENGINEERING_ADMIN"]),
  resendEmployeeInvite,
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
