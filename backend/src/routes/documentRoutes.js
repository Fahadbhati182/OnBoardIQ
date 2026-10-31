import { Router } from "express";
import multer from "multer";
import {
  allowedRoles,
  requireAuth,
} from "../middleware/authMiddleware.js";
import AsynHandler from "../utils/AsynHandler.js";
import {
  archiveDocument,
  downloadDocument,
  getDocument,
  listDocuments,
  listVersions,
  publishDocument,
  updateDocument,
  uploadDocument,
  uploadVersion,
} from "../controllers/documentController.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: Number(process.env.MAX_DOCUMENT_SIZE_BYTES || 10 * 1024 * 1024) },
});

const administrators = [
  requireAuth,
  allowedRoles(["HR_ADMIN"]),
];


router.get("/", requireAuth, AsynHandler(listDocuments));
router.post("/", ...administrators, upload.single("file"), AsynHandler(uploadDocument));
router.get("/:id/download", requireAuth, AsynHandler(downloadDocument));
router.get("/:id/versions", requireAuth, AsynHandler(listVersions));
router.post("/:id/versions", ...administrators, upload.single("file"), AsynHandler(uploadVersion));

router.patch("/:id/archive", ...administrators, AsynHandler(archiveDocument));
router.patch("/:id/publish", ...administrators, AsynHandler(publishDocument));
router.patch("/:id", ...administrators, AsynHandler(updateDocument));
router.get("/:id", requireAuth, AsynHandler(getDocument));

export default router;
