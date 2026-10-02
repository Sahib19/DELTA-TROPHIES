import { model, Schema, type Types } from 'mongoose';

export interface Inquiry {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  product?: Types.ObjectId | null;
  message?: string;
  status: 'new' | 'contacted' | 'closed';
  assignmentStatus: 'unassigned' | 'assigned';
  createdAt: Date;
  updatedAt: Date;
}

const inquirySchema = new Schema<Inquiry>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    product: { type: Schema.Types.ObjectId, ref: 'Product', default: null, index: true },
    message: { type: String, trim: true, maxlength: 2_000 },
    status: {
      type: String,
      required: true,
      enum: ['new', 'contacted', 'closed'],
      default: 'new',
      index: true,
    },
    assignmentStatus: {
      type: String,
      enum: ['unassigned', 'assigned'],
      default: 'unassigned',
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'inquiries',
  },
);

inquirySchema.index({ createdAt: -1 });
inquirySchema.index({ status: 1, createdAt: -1 });

export const InquiryModel = model<Inquiry>('Inquiry', inquirySchema);
