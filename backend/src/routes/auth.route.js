import {Router} from "express";
import User from "../models/user.model.js"; // Assuming you have a User model defined
import {authCallback} from "../controller/auth.controller.js";

const router = Router();

router.post("/callback", authCallback);

export default router;
