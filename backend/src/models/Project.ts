import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  ownerId: mongoose.Types.ObjectId;
  title: string;
  thumbnailUrl?: string;
  projectData: any; // The JSON payload for the blocks, sprites, etc.
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, default: 'Untitled Project' },
    thumbnailUrl: { type: String },
    projectData: { type: Schema.Types.Mixed, required: true, default: {} },
    isPublic: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const Project = mongoose.model<IProject>('Project', projectSchema);

export default Project;
