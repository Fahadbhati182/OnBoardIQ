import { Router } from "express";
import multer from "multer";
import {
  allowedRoles,
  requireAuth,
  requireServiceAuth,
} from "../middleware/authMiddleware.js";
import AsynHandler from "../utils/AsynHandler.js";
import {
  archiveDocument,
  downloadDocument,
  downloadDocumentForInternal,
  getDocument,
  listDocuments,
  listEmployeeDocuments,
  listVersions,
  listVersionsForInternal,
  publishDocument,
  updateDocument,
  uploadDocument,
  uploadVersion,
} from "../controllers/documentController.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Number(process.env.MAX_DOCUMENT_SIZE_BYTES || 10 * 1024 * 1024),
  },
});

const administrators = [requireAuth, allowedRoles(["ENGINEERING_ADMIN"])];

router.get("/", requireAuth, AsynHandler(listDocuments));
router.get(
  "/employee",
  requireAuth,
  allowedRoles(["ENGINEER"]),
  AsynHandler(listEmployeeDocuments),
);

router.post(
  "/",
  ...administrators,
  upload.single("file"),
  AsynHandler(uploadDocument),
);

router.get("/:id/download", requireAuth, AsynHandler(downloadDocument));
router.get("/:id/versions", requireAuth, AsynHandler(listVersions));

router.post(
  "/:id/versions",
  ...administrators,
  upload.single("file"),
  AsynHandler(uploadVersion),
);

router.patch("/:id/archive", ...administrators, AsynHandler(archiveDocument));
router.patch("/:id/publish", ...administrators, AsynHandler(publishDocument));
router.patch("/:id", ...administrators, AsynHandler(updateDocument));
router.get("/:id", requireAuth, AsynHandler(getDocument));

// internal route for interservice communication
router.get(
  "/internal/:id/download",
  requireServiceAuth,
  AsynHandler(downloadDocumentForInternal),
);

router.get(
  "/internal/:id/versions",
  requireServiceAuth,
  AsynHandler(listVersionsForInternal),
);

export default router;

