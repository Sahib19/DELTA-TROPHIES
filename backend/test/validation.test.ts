import { describe, expect, it } from 'vitest';
import {
  createInquiryRequestSchema,
  deleteEntryRequestSchema,
  updateAssignmentRequestSchema,
} from '../src/validation/inquiry.schemas.js';
import { productListRequestSchema } from '../src/validation/product.schemas.js';

describe('request schemas', () => {
  it('normalizes catalogue pagination and booleans', () => {
    const result = productListRequestSchema.parse({
      body: {},
      params: {},
      query: { page: '2', limit: '25', in_stock: 'false' },
    });

    expect(result.query).toEqual({ page: 2, limit: 25, in_stock: false });
  });

  it('normalizes inquiry contact data', () => {
    const result = createInquiryRequestSchema.parse({
      body: {
        name: '  Test User ',
        email: ' TEST@EXAMPLE.COM ',
        phone: '+91 99999 99999',
        message: ' Need a trophy ',
      },
      params: {},
      query: {},
    });

    expect(result.body.email).toBe('test@example.com');
    expect(result.body.name).toBe('Test User');
  });

  it('accepts assignment changes and rejects invalid statuses or IDs', () => {
    const request = {
      body: { assignment_status: 'assigned' },
      params: { id: '507f1f77bcf86cd799439011' },
      query: {},
    };
    expect(updateAssignmentRequestSchema.parse(request).body.assignment_status).toBe('assigned');
    expect(
      updateAssignmentRequestSchema.safeParse({
        ...request,
        body: { assignment_status: 'closed' },
      }).success,
    ).toBe(false);
    expect(
      deleteEntryRequestSchema.safeParse({
        ...request,
        body: {},
        params: { id: 'invalid' },
      }).success,
    ).toBe(false);
  });
});
