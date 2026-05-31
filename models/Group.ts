import mongoose, { Schema, models } from "mongoose";

const GroupSchema = new Schema({
  name: { type: String, required: true },
  members: [{ type: String, required: true }], // emails
  createdBy: { type: String, required: true }, // email
  createdAt: { type: Date, default: Date.now },
});

export default models.Group || mongoose.model("Group", GroupSchema);
