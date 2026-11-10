import { Router } from "express";
import {
  createTeam,
  deleteTeam,
  listTeams,
  updateTeam,
} from "../controllers/teamController.js";
import { allowedRoles, requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.use(requireAuth);
router.get("/", allowedRoles(["ENGINEERING_ADMIN"]), listTeams);
router.post("/", allowedRoles(["ENGINEERING_ADMIN"]), createTeam);
router.patch("/:teamId", allowedRoles(["ENGINEERING_ADMIN"]), updateTeam);
router.delete("/:teamId", allowedRoles(["ENGINEERING_ADMIN"]), deleteTeam);

export default router;
