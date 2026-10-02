import type { Types } from 'mongoose';
import { InquiryModel, type Inquiry } from '../models/inquiry.model.js';
import { LeadModel } from '../models/lead.model.js';
import { ProductModel } from '../models/product.model.js';
import { ApiError } from '../utils/api-error.js';
import { toObjectId } from '../utils/object-id.js';
import type {
  CreateInquiryRequest,
  CreateLeadRequest,
  InquiryListRequest,
  UpdateAssignmentRequest,
} from '../validation/inquiry.schemas.js';

export interface PageResult<T> {
  items: T[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface LeadDto {
  id: string;
  name: string;
  email: string;
  phone: string;
  assignment_status: 'unassigned' | 'assigned';
  created_at: Date;
}

export interface InquiryDto extends LeadDto {
  product_id: string | null;
  product_name: string | null;
  message: string | null;
  status: string;
}

interface PopulatedProduct {
  _id: Types.ObjectId;
  name: string;
}

interface InquiryLean extends Omit<Inquiry, 'product'> {
  product: PopulatedProduct | null;
}

function pagination(page: number, limit: number, total: number): PageResult<never>['pagination'] {
  return { page, limit, total, pages: total === 0 ? 0 : Math.ceil(total / limit) };
}

export async function createLead(input: CreateLeadRequest['body']): Promise<void> {
  await LeadModel.create({ ...input, source: 'popup' });
}

export async function createInquiry(input: CreateInquiryRequest['body']): Promise<void> {
  if (input.product_id) {
    const exists = await ProductModel.exists({ _id: toObjectId(input.product_id), isActive: true });
    if (!exists) throw new ApiError(422, 'INVALID_PRODUCT', 'Selected product does not exist');
  }

  const inquiry = new InquiryModel({
    name: input.name,
    email: input.email,
    phone: input.phone,
    product: input.product_id ? toObjectId(input.product_id) : null,
    ...(input.message ? { message: input.message } : {}),
  });
  await inquiry.save();
}

export async function listLeads(query: InquiryListRequest['query']): Promise<PageResult<LeadDto>> {
  const skip = (query.page - 1) * query.limit;
  const [documents, total] = await Promise.all([
    LeadModel.find().sort({ createdAt: -1 }).skip(skip).limit(query.limit).lean().exec(),
    LeadModel.countDocuments().exec(),
  ]);

  return {
    items: documents.map((lead) => ({
      id: lead._id.toString(),
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      assignment_status: lead.assignmentStatus ?? 'unassigned',
      created_at: lead.createdAt,
    })),
    pagination: pagination(query.page, query.limit, total),
  };
}

export async function listInquiries(
  query: InquiryListRequest['query'],
): Promise<PageResult<InquiryDto>> {
  const filter: { status?: Inquiry['status'] } = {};
  if (query.status) filter.status = query.status;
  const skip = (query.page - 1) * query.limit;
  const [documents, total] = await Promise.all([
    InquiryModel.find(filter)
      .populate('product', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit)
      .lean()
      .exec(),
    InquiryModel.countDocuments(filter).exec(),
  ]);

  return {
    items: (documents as unknown as InquiryLean[]).map((inquiry) => ({
      id: inquiry._id.toString(),
      name: inquiry.name,
      email: inquiry.email,
      phone: inquiry.phone,
      assignment_status: inquiry.assignmentStatus ?? 'unassigned',
      product_id: inquiry.product?._id.toString() ?? null,
      product_name: inquiry.product?.name ?? null,
      message: inquiry.message ?? null,
      status: inquiry.status,
      created_at: inquiry.createdAt,
    })),
    pagination: pagination(query.page, query.limit, total),
  };
}

export async function updateLeadAssignment(
  id: string,
  assignmentStatus: UpdateAssignmentRequest['body']['assignment_status'],
): Promise<void> {
  const updated = await LeadModel.findByIdAndUpdate(
    toObjectId(id),
    { $set: { assignmentStatus } },
    { runValidators: true },
  ).exec();
  if (!updated) throw new ApiError(404, 'LEAD_NOT_FOUND', 'Lead not found');
}

export async function updateInquiryAssignment(
  id: string,
  assignmentStatus: UpdateAssignmentRequest['body']['assignment_status'],
): Promise<void> {
  const updated = await InquiryModel.findByIdAndUpdate(
    toObjectId(id),
    { $set: { assignmentStatus } },
    { runValidators: true },
  ).exec();
  if (!updated) throw new ApiError(404, 'INQUIRY_NOT_FOUND', 'Inquiry not found');
}

export async function deleteLead(id: string): Promise<void> {
  const deleted = await LeadModel.findByIdAndDelete(toObjectId(id)).exec();
  if (!deleted) throw new ApiError(404, 'LEAD_NOT_FOUND', 'Lead not found');
}

export async function deleteInquiry(id: string): Promise<void> {
  const deleted = await InquiryModel.findByIdAndDelete(toObjectId(id)).exec();
  if (!deleted) throw new ApiError(404, 'INQUIRY_NOT_FOUND', 'Inquiry not found');
}
