import {Router} from "express";
import {verifyFirebaseToken} from "../middleware/firebaseAuth.middleware.js";
import {authCallback, createSession} from "../controller/auth.controller.js";

const router = Router();

router.post("/callback", verifyFirebaseToken, authCallback);
router.post("/session", verifyFirebaseToken, createSession);

export default router;
