import mongoose, { Schema, models } from "mongoose";

const GroupMessageSchema = new Schema({
  groupId: { type: String, required: true },
  sender: { type: String, required: true }, // email
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

export default models.GroupMessage || mongoose.model("GroupMessage", GroupMessageSchema);
