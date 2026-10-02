import { Router } from 'express';
import {
  createInquiry,
  createLead,
  deleteInquiry,
  deleteLead,
  getInquiries,
  getLeads,
  updateInquiryAssignment,
  updateLeadAssignment,
} from '../controllers/inquiry.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { submissionRateLimit } from '../middleware/rate-limits.js';
import { validateRequest } from '../middleware/validate-request.js';
import {
  createInquiryRequestSchema,
  createLeadRequestSchema,
  deleteEntryRequestSchema,
  inquiryListRequestSchema,
  updateAssignmentRequestSchema,
} from '../validation/inquiry.schemas.js';

export const inquiryRouter = Router();

inquiryRouter.post(
  '/lead',
  submissionRateLimit,
  validateRequest(createLeadRequestSchema),
  createLead,
);
inquiryRouter.post(
  '/',
  submissionRateLimit,
  validateRequest(createInquiryRequestSchema),
  createInquiry,
);
inquiryRouter.get('/leads', authenticate, validateRequest(inquiryListRequestSchema), getLeads);
inquiryRouter.get('/all', authenticate, validateRequest(inquiryListRequestSchema), getInquiries);
inquiryRouter.patch(
  '/leads/:id/assignment',
  authenticate,
  validateRequest(updateAssignmentRequestSchema),
  updateLeadAssignment,
);
inquiryRouter.patch(
  '/all/:id/assignment',
  authenticate,
  validateRequest(updateAssignmentRequestSchema),
  updateInquiryAssignment,
);
inquiryRouter.delete(
  '/leads/:id',
  authenticate,
  validateRequest(deleteEntryRequestSchema),
  deleteLead,
);
inquiryRouter.delete(
  '/all/:id',
  authenticate,
  validateRequest(deleteEntryRequestSchema),
  deleteInquiry,
);
