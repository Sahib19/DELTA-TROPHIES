import type { RequestHandler } from 'express';
import {
  createCategory as createCategoryRecord,
  listCategories,
  updateCategory as updateCategoryRecord,
} from '../services/category.service.js';
import type {
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../validation/category.schemas.js';
import { publishCatalogueSafely } from '../services/catalogue-publication.service.js';

export const getCategories: RequestHandler = async (request, response) => {
  response.setHeader(
    'Cache-Control',
    request.headers.authorization
      ? 'no-store'
      : 'public, max-age=300, s-maxage=1800, stale-while-revalidate=86400',
  );
  response.status(200).json({ success: true, categories: await listCategories() });
};

export const createCategory: RequestHandler = async (_request, response) => {
  const input = (response.locals.validated as CreateCategoryRequest).body;
  const category = await createCategoryRecord(input);
  response.status(201).json({
    success: true,
    category,
    catalogue: await publishCatalogueSafely(),
  });
};

export const updateCategory: RequestHandler = async (_request, response) => {
  const validated = response.locals.validated as UpdateCategoryRequest;
  const category = await updateCategoryRecord(validated.params.id, validated.body);
  response.status(200).json({
    success: true,
    category,
    catalogue: await publishCatalogueSafely(),
  });
};
