import {Router} from "express";
import {
  getAllSongs,
  getFeaturedSongs,
  getMadeForYouSongs,
  getTrendingSongs,
} from "../controller/song.controller.js";
import {
  verifyFirebaseToken,
  requireFirebaseAdmin,
} from "../middleware/firebaseAuth.middleware.js";

const router = Router();

router.get("/", verifyFirebaseToken, requireFirebaseAdmin, getAllSongs);
router.get("/featured", getFeaturedSongs);
router.get("/made-for-you", getMadeForYouSongs);
router.get("/trending", getTrendingSongs);

export default router;
