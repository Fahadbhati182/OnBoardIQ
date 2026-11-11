import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import ApiError from "./utils/ApiError.js";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import openApiSpec from "./apiDocs.js";
import { connectRedis } from "./config/redis.js";

const app = express();
const port = process.env.PORT || 3000;

const allowedOrigin = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  process.env.AI_BACKEND_URL || "http://localhost:8000",
];

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.get("/api-docs.json", (_req, res) => {
  res.json(openApiSpec);
});

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    customSiteTitle: "OnboardIQ API Docs",
  }),
);

app.get("/", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/teams", teamRoutes);

app.use((err, _req, res, _next) => {
  const status = Number.isInteger(err.status) ? err.status : 500;
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({
    success: false,
    message: status >= 500 ? "Internal server error" : err.message,
  });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  connectRedis().catch((error) => {
    console.warn("Redis caching is unavailable:", error.message);
  });
});
