import {Router} from "express";
import {protectRoute, requireAdmin} from "../middleware/auth.middleware";

const router = Router();

router.get("/", protectRoute, requireAdmin, createSong);

export default router;
