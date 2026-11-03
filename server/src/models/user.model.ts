import { type InferSchemaType, model, Schema } from 'mongoose';
import { toJSONOptions } from './to-json.js';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    // Not returned by queries unless explicitly requested with .select('+passwordHash')
    passwordHash: { type: String, required: true, select: false },
  },
  {
    timestamps: true,
    // Also strip passwordHash in case a query selected it (e.g. during login)
    toJSON: toJSONOptions(['passwordHash']),
  },
);

export type User = InferSchemaType<typeof userSchema>;

export const UserModel = model('User', userSchema);
