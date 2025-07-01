import express from "express";
import dotenv from "dotenv";
// import {clerkMiddleware} from "@clerk/express";
import fileUpload from "express-fileupload";
import path from "path";
import {connectDB} from "./lib/db.js";
import cors from "cors";
import fs from "fs";
import {createServer} from "http";
import cron from "node-cron";

import {initializeSocket} from "./lib/socket.js";

import userRouter from "./routes/user.route.js";
import adminRouter from "./routes/admin.route.js";
import authRouter from "./routes/auth.route.js";
import songRouter from "./routes/song.route.js";
import albumRouter from "./routes/album.route.js";
import statRouter from "./routes/stat.route.js";

dotenv.config();
const __dirname = path.resolve(); //to get the current directory path
const app = express();
const PORT = process.env.PORT;

const httpServer = createServer(app);
initializeSocket(httpServer);

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json()); //to parse JSON bodies
// app.use(clerkMiddleware()); //this will add auth to req obj => req.auth
app.use(
  fileUpload({
    useTempFiles: true, //to store files in a temporary directory
    tempFileDir: path.join(__dirname, "tmp"), //specify the temp directory
    createParentPath: true, //to create parent directories if they don't exist
    limits: {fileSize: 10 * 1024 * 1024}, //limit file size to 10MB
  })
); //to handle file uploads

// cron jobs
const tempDir = path.join(process.cwd(), "tmp");
cron.schedule("0 * * * *", () => {
  if (fs.existsSync(tempDir)) {
    fs.readdir(tempDir, (err, files) => {
      if (err) {
        console.log("error", err);
        return;
      }
      for (const file of files) {
        fs.unlink(path.join(tempDir, file), (err) => {});
      }
    });
  }
});

app.use("/api/users", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/auth", authRouter);
app.use("/api/songs", songRouter);
app.use("/api/albums", albumRouter);
app.use("/api/stats", statRouter);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../frontend", "dist", "index.html"));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error occurred:", err);
  res.status(500).json({
    message:
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message,
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  connectDB();
});
