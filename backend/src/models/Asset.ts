import mongoose, { Document, Schema } from 'mongoose';

export interface IAsset extends Document {
  uploaderId: mongoose.Types.ObjectId;
  name: string;
  type: 'sprite' | 'sound' | 'background';
  url: string; // URL from Cloudinary or local storage path
  createdAt: Date;
}

const assetSchema = new Schema<IAsset>(
  {
    uploaderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['sprite', 'sound', 'background'], required: true },
    url: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const Asset = mongoose.model<IAsset>('Asset', assetSchema);

export default Asset;
