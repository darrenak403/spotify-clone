import express from "express";
import dotenv from "dotenv";
import {clerkMiddleware} from "@clerk/express";

import {connectDB} from "./lib/db.js";

import userRouter from "./routes/user.route.js";
import adminRouter from "./routes/admin.route.js";
import authRouter from "./routes/auth.route.js";
import songRouter from "./routes/song.route.js";
import albumRouter from "./routes/album.route.js";
import statRouter from "./routes/stat.route.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(express.json()); //to parse JSON bodies

app.use(clerkMiddleware()); //this will add auth to req obj => 

app.use("/api/users", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/auth", authRouter);
app.use("/api/songs", songRouter);
app.use("/api/albums", albumRouter);
app.use("/api/stats", statRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  connectDB();
});
