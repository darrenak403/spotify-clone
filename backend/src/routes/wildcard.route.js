import {Router} from "express";
const router = Router();

router.get("/", (req, res, next) => {
  res.status(404).json({
    error: "Not Found",
    message: "The requested resource does not exist.",
  });
});
export default router;
