import mongoose, { Schema, Document, models } from "mongoose";

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  friends: string[];
  avatar: string;
  online: boolean;   // ✔ statut en ligne
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  friends: { type: [String], default: [] },

  avatar: { type: String, default: "" },

  online: { type: Boolean, default: false }, // ✔ ajouté
});

const User = models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
