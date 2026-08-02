import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    // Firebase UID — the active lookup key for all new sign-ins.
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true, // allows legacy Clerk-only records (no firebaseUid yet) to coexist
    },
    // Legacy Clerk user id — read-only history, no longer used for lookups.
    legacyClerkId: {
      type: String,
      sparse: true,
    },
  },
  {timestamps: true}
);

const User = mongoose.model("User", userSchema);
export default User;
