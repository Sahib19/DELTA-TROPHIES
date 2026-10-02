import type { RequestHandler } from 'express';
import {
  createInquiry as createInquiryRecord,
  createLead as createLeadRecord,
  deleteInquiry as deleteInquiryRecord,
  deleteLead as deleteLeadRecord,
  listInquiries,
  listLeads,
  updateInquiryAssignment as updateInquiryAssignmentRecord,
  updateLeadAssignment as updateLeadAssignmentRecord,
} from '../services/inquiry.service.js';
import type {
  CreateInquiryRequest,
  CreateLeadRequest,
  DeleteEntryRequest,
  InquiryListRequest,
  UpdateAssignmentRequest,
} from '../validation/inquiry.schemas.js';

export const createLead: RequestHandler = async (_request, response) => {
  await createLeadRecord((response.locals.validated as CreateLeadRequest).body);
  response.status(201).json({ success: true, message: 'Lead captured' });
};

export const createInquiry: RequestHandler = async (_request, response) => {
  await createInquiryRecord((response.locals.validated as CreateInquiryRequest).body);
  response.status(201).json({ success: true, message: 'Inquiry submitted' });
};

export const getLeads: RequestHandler = async (_request, response) => {
  const { query } = response.locals.validated as InquiryListRequest;
  const result = await listLeads(query);
  response.status(200).json({ success: true, leads: result.items, pagination: result.pagination });
};

export const getInquiries: RequestHandler = async (_request, response) => {
  const { query } = response.locals.validated as InquiryListRequest;
  const result = await listInquiries(query);
  response.status(200).json({
    success: true,
    inquiries: result.items,
    pagination: result.pagination,
  });
};

export const updateLeadAssignment: RequestHandler = async (_request, response) => {
  const { params, body } = response.locals.validated as UpdateAssignmentRequest;
  await updateLeadAssignmentRecord(params.id, body.assignment_status);
  response.status(200).json({ success: true, assignment_status: body.assignment_status });
};

export const updateInquiryAssignment: RequestHandler = async (_request, response) => {
  const { params, body } = response.locals.validated as UpdateAssignmentRequest;
  await updateInquiryAssignmentRecord(params.id, body.assignment_status);
  response.status(200).json({ success: true, assignment_status: body.assignment_status });
};

export const deleteLead: RequestHandler = async (_request, response) => {
  const { params } = response.locals.validated as DeleteEntryRequest;
  await deleteLeadRecord(params.id);
  response.status(204).send();
};

export const deleteInquiry: RequestHandler = async (_request, response) => {
  const { params } = response.locals.validated as DeleteEntryRequest;
  await deleteInquiryRecord(params.id);
  response.status(204).send();
};
