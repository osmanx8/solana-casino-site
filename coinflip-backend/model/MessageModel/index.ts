import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  message: {
    type: String,
    require: true,
  },
  wallet: {
    type: String,
    require: true,
  },
  createdAt: {
    type: Number,
  },
});

const MessageModel = mongoose.model("message", MessageSchema);

export default MessageModel;
