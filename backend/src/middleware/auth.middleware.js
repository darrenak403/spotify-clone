import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

const client = jwksClient({
  jwksUri: "https://deep-mink-44.clerk.accounts.dev/.well-known/jwks.json", // Nếu bạn dùng custom domain Clerk, sửa lại cho đúng
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key) {
    if (err) return callback(err);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

export const protectRoute = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({message: "No token provided"});

  const token = authHeader.split(" ")[1];
  jwt.verify(token, getKey, {algorithms: ["RS256"]}, (err, decoded) => {
    if (err) return res.status(401).json({message: "Invalid token"});
    req.user = decoded;
    next();
  });
};

export const requireAdmin = (req, res, next) => {
  const userEmail = req.user?.email;
  if (userEmail !== process.env.ADMIN_EMAIL) {
    return res.status(403).json({message: "Forbidden - you must be an admin"});
  }
  next();
};
