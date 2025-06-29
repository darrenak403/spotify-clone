import express from "express";
import dotenv from "dotenv";
import {clerkMiddleware} from "@clerk/express";
import fileUpload from "express-fileupload";
import path from "path";
import {connectDB} from "./lib/db.js";
import cors from "cors";
import {createServer} from "http";

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
    origin: "http://localhost:3000", //allow requests from this origin
    credentials: true, //to allow cookies to be sent with requests
  })
); //to allow cross-origin requests

app.use(express.json()); //to parse JSON bodies
app.use(clerkMiddleware()); //this will add auth to req obj => req.auth
app.use(
  fileUpload({
    useTempFiles: true, //to store files in a temporary directory
    tempFileDir: path.join(__dirname, "tmp"), //specify the temp directory
    createParentPath: true, //to create parent directories if they don't exist
    limits: {fileSize: 10 * 1024 * 1024}, //limit file size to 10MB
  })
); //to handle file uploads

app.use("/api/users", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/auth", authRouter);
app.use("/api/songs", songRouter);
app.use("/api/albums", albumRouter);
app.use("/api/stats", statRouter);

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

//todo: Socket.io
