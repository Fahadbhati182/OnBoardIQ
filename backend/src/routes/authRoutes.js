import { Router } from "express";
import {
  getCurrentUser,
  listEmployees,
  listDepartments,
  login,
  logout,
  refresh,
  register,
} from "../controllers/authController.js";
import { allowedRoles, requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", requireAuth, getCurrentUser);
router.get(
  "/employees",
  requireAuth,
  allowedRoles(["HR_ADMIN", "IT_ADMIN"]),
  listEmployees,
);
router.get(
  "/departments",
  requireAuth,
  allowedRoles(["HR_ADMIN", "IT_ADMIN"]),
  listDepartments,
);

export default router;
