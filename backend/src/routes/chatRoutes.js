import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import AsynHandler from "../utils/AsynHandler.js";
import {
  createChatSession,
  deleteChatSession,
  listChatMessages,
  listChatSessions,
  renameChatSession,
  sendChatMessage,
} from "../controllers/chatController.js";

const router = Router();
router.use(requireAuth);
router.post("/sessions", AsynHandler(createChatSession));
router.get("/sessions", AsynHandler(listChatSessions));
router.get("/sessions/:sessionId/messages", AsynHandler(listChatMessages));
router.post("/sessions/:sessionId/messages", AsynHandler(sendChatMessage));
router.patch("/sessions/:sessionId", AsynHandler(renameChatSession));
router.delete("/sessions/:sessionId", AsynHandler(deleteChatSession));

export default router;
