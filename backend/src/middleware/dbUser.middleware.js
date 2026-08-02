import User from "../models/user.model.js";

// Resolves the verified Firebase caller to their local Mongo user record,
// attaching it as req.dbUser so downstream controllers use the internal
// _id (the canonical FK for chat/playlists) instead of the provider uid.
export const attachDbUser = async (req, res, next) => {
  try {
    const user = await User.findOne({firebaseUid: req.firebaseUser.uid});
    if (!user) {
      return res
        .status(404)
        .json({message: "User not found — sign in via /api/auth/callback first"});
    }
    req.dbUser = user;
    next();
  } catch (error) {
    next(error);
  }
};
