import {Router} from "express";
import {getArtistBySlug} from "../controller/artist.controller.js";

const router = Router();

router.get("/:slug", getArtistBySlug);

export default router;
