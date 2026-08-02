import {Router} from "express";
import {
  verifyFirebaseToken,
  requireFirebaseAdmin,
} from "../middleware/firebaseAuth.middleware.js";
import {getStats} from "../controller/stat.controller.js";

const router = Router();

router.get("/", verifyFirebaseToken, requireFirebaseAdmin, getStats);

export default router;
