import { z } from 'zod';
import {
  emailSchema,
  emptyObjectSchema,
  objectIdSchema,
  optionalText,
  phoneSchema,
} from './shared.schemas.js';

const contactFields = {
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  phone: phoneSchema,
};

export const createLeadRequestSchema = z.object({
  body: z.object(contactFields).strict(),
  query: emptyObjectSchema,
  params: emptyObjectSchema,
});

export const createInquiryRequestSchema = z.object({
  body: z
    .object({
      ...contactFields,
      product_id: z.preprocess(
        (value) => (value === '' || value === null ? undefined : value),
        objectIdSchema.optional(),
      ),
      message: optionalText(2_000),
    })
    .strict(),
  query: emptyObjectSchema,
  params: emptyObjectSchema,
});

export const inquiryListRequestSchema = z.object({
  body: emptyObjectSchema,
  params: emptyObjectSchema,
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    status: z.enum(['new', 'contacted', 'closed']).optional(),
  }),
});

const entryParams = z.object({ id: objectIdSchema });

export const updateAssignmentRequestSchema = z.object({
  body: z.object({ assignment_status: z.enum(['unassigned', 'assigned']) }).strict(),
  query: emptyObjectSchema,
  params: entryParams,
});

export const deleteEntryRequestSchema = z.object({
  body: emptyObjectSchema,
  query: emptyObjectSchema,
  params: entryParams,
});

export type CreateLeadRequest = z.infer<typeof createLeadRequestSchema>;
export type CreateInquiryRequest = z.infer<typeof createInquiryRequestSchema>;
export type InquiryListRequest = z.infer<typeof inquiryListRequestSchema>;
export type UpdateAssignmentRequest = z.infer<typeof updateAssignmentRequestSchema>;
export type DeleteEntryRequest = z.infer<typeof deleteEntryRequestSchema>;
