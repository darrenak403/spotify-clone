import {User} from "../models/user.model";

export const authCallback = async (req, res) => {
  try {
    const {id, firstName, lastName, imageUrl} = req.body;

    //check if user already exists
    const user = await User.findOne({clerkId: id});

    if (!user) {
      // If user does not exist, create a new user
      await User.create({
        clerkId: id,
        fullName: `${firstName} ${lastName}`,
        imageUrl: imageUrl,
      });
    }
    res.status(200).json({success: true});
  } catch (error) {
    console.error("Error in auth callback:", error);
    res.status(500).json({success: false, message: "Internal Server Error"});
  }
};
