import { model, Schema, type Types } from 'mongoose';

export interface Lead {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  source: 'popup';
  assignmentStatus: 'unassigned' | 'assigned';
  createdAt: Date;
  updatedAt: Date;
}

const leadSchema = new Schema<Lead>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    source: { type: String, required: true, enum: ['popup'], default: 'popup' },
    assignmentStatus: {
      type: String,
      enum: ['unassigned', 'assigned'],
      default: 'unassigned',
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'leads',
  },
);

leadSchema.index({ createdAt: -1 });
leadSchema.index({ email: 1, createdAt: -1 });

export const LeadModel = model<Lead>('Lead', leadSchema);
