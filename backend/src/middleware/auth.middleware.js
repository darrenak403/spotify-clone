import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import {clerkClient} from "@clerk/clerk-sdk-node"; // Thêm dòng này nếu chưa có

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

// Middleware bảo vệ route
export const protectRoute = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({message: "No token provided"});

  const token = authHeader.split(" ")[1];
  jwt.verify(token, getKey, {algorithms: ["RS256"]}, (err, decoded) => {
    if (err) {
      console.error("Error verifying token:", err);
      return res.status(401).json({message: "Invalid token"});
    }
    req.user = decoded;
    req.auth = decoded;
    next();
  });
};

// Middleware kiểm tra quyền admin
export const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.sub;
    if (!userId) {
      return res.status(401).json({message: "No userId in token"});
    }

    const user = await clerkClient.users.getUser(userId);
    if (!user) {
      return res.status(404).json({message: "User not found"});
    }

    // Lấy email theo primaryEmailAddressId
    let userEmail;
    if (user.primaryEmailAddressId && user.emailAddresses) {
      const primaryEmailObj = user.emailAddresses.find(
        (e) => e.id === user.primaryEmailAddressId
      );
      userEmail = primaryEmailObj?.emailAddress;
    }
    if (!userEmail && user.emailAddresses?.length > 0) {
      userEmail = user.emailAddresses[0].emailAddress;
    }

    // Kiểm tra email admin
    const adminEmail = process.env.ADMIN_EMAIL;
    if (userEmail !== adminEmail) {
      return res
        .status(403)
        .json({message: "Forbidden - you must be an admin"});
    }
    next();
  } catch (error) {
    console.error("Error in requireAdmin:", error);
    return res.status(500).json({message: "Internal server error"});
  }
};
