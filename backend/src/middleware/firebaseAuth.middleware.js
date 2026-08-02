import admin from "../lib/firebaseAdmin.js";

export const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({message: "No token provided"});

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({message: "No token provided"});

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.firebaseUser = {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
      admin: decoded.admin === true,
    };
    next();
  } catch (error) {
    console.error("Error verifying Firebase token:", error);
    return res.status(401).json({message: "Invalid token"});
  }
};

// Requires the Firebase custom claim `admin: true` to have been set on the
// caller's account beforehand (see backend/src/scripts/setAdminClaim.js).
export const requireFirebaseAdmin = (req, res, next) => {
  if (req.firebaseUser?.admin) return next();
  return res.status(403).json({message: "Forbidden - you must be an admin"});
};
