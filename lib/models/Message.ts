import mongoose, { Schema } from "mongoose";

const MessageSchema = new Schema(
  {
    sender: { type: String, required: true },   // email de l'expéditeur
    receiver: { type: String, required: true }, // email du destinataire
    content: { type: String, required: true },  // texte du message
  },
  { timestamps: true }
);

export default mongoose.models.Message ||
  mongoose.model("Message", MessageSchema);
