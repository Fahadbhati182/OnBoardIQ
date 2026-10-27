import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import ApiError from "./utils/ApiError.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);

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
});
