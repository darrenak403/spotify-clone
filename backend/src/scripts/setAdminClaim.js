// One-time script: grants the `admin: true` Firebase custom claim to the
// account matching process.env.ADMIN_EMAIL.
//
// Run this ONCE against the real Firebase project, and confirm it succeeds,
// BEFORE relying on requireFirebaseAdmin in production — the admin route
// checks this claim directly and has no fallback if it isn't set.
//
// Usage: node src/scripts/setAdminClaim.js
import dotenv from "dotenv";
dotenv.config();

import admin from "../lib/firebaseAdmin.js";

async function main() {
  const email = process.env.ADMIN_EMAIL;
  if (!email) {
    console.error("ADMIN_EMAIL env var is not set.");
    process.exit(1);
  }

  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().setCustomUserClaims(user.uid, {admin: true});

  console.log(`Set admin:true custom claim for ${email} (uid: ${user.uid}).`);
  console.log(
    "Note: the user must sign out and back in (or force-refresh their ID token) for the new claim to appear in their token."
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to set admin claim:", error);
    process.exit(1);
  });
