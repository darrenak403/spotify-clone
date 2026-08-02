import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: String,
      required: true,
    }, // Mongo _id of the user who sent the message
    receiverId: {
      type: String,
      required: true,
    }, // Mongo _id of the user who received the message
    content: {
      type: String,
      required: true,
    },
  },
  {timestamps: true}
); // Automatically adds createdAt and updatedAt fields
const Message = mongoose.model("Message", messageSchema);
export default Message;
