import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// Runs behind verifyFirebaseToken — identity is derived exclusively from the
// verified token payload, never from client-supplied request-body fields.
// findOneAndUpdate + upsert is atomic per document, so two near-simultaneous
// first sign-ins from the same account cannot create duplicate user records.
export const authCallback = async (req, res, next) => {
  try {
    const {uid, email, name, picture} = req.firebaseUser;

    const user = await User.findOneAndUpdate(
      {firebaseUid: uid},
      {
        $setOnInsert: {
          firebaseUid: uid,
          fullName: name || email || "Spotify User",
          imageUrl: picture || "",
        },
      },
      {upsert: true, new: true, setDefaultsOnInsert: true}
    );

    res.status(200).json({success: true, user});
  } catch (error) {
    console.error("Error in auth callback", error);
    next(error);
  }
};

// Exchanges a verified Firebase sign-in for a backend-signed session token,
// scoped for use as the Socket.io handshake credential only (Phase 3) — not
// a substitute for the Firebase ID token on ordinary REST calls.
export const createSession = async (req, res, next) => {
  try {
    const user = await User.findOne({firebaseUid: req.firebaseUser.uid});
    if (!user) {
      return res
        .status(404)
        .json({message: "User not found — sign in via /api/auth/callback first"});
    }

    const token = jwt.sign(
      {sub: user._id.toString(), firebaseUid: req.firebaseUser.uid},
      process.env.SESSION_JWT_SECRET,
      {expiresIn: "24h"}
    );

    res.status(200).json({token});
  } catch (error) {
    console.error("Error creating session token", error);
    next(error);
  }
};
