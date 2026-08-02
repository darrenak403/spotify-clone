import {Router} from "express";
import {verifyFirebaseToken} from "../middleware/firebaseAuth.middleware.js";
import {attachDbUser} from "../middleware/dbUser.middleware.js";
import {getAllUsers, getMessages} from "../controller/user.controller.js";
const router = Router();

router.get("/", verifyFirebaseToken, attachDbUser, getAllUsers);
router.get("/messages/:userId", verifyFirebaseToken, attachDbUser, getMessages);

export default router;
