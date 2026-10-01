import type { RequestHandler } from 'express';
import {
  createProduct as createProductRecord,
  deleteProduct as deleteProductRecord,
  getProductUploadFolder,
  getProductDetails,
  listProducts,
  updateProduct as updateProductRecord,
} from '../services/product.service.js';
import { uploadProductImages } from '../services/image.service.js';
import { publishCatalogueSafely } from '../services/catalogue-publication.service.js';
import { ApiError } from '../utils/api-error.js';
import type {
  CreateProductRequest,
  ProductIdRequest,
  ProductListRequest,
  UpdateProductRequest,
} from '../validation/product.schemas.js';

export const getProducts: RequestHandler = async (request, response) => {
  const { query } = response.locals.validated as ProductListRequest;
  const result = await listProducts(query);
  response.setHeader(
    'Cache-Control',
    request.headers.authorization
      ? 'no-store'
      : 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600',
  );
  response.status(200).json({ success: true, ...result });
};

export const getProductById: RequestHandler = async (request, response) => {
  const { id } = (response.locals.validated as ProductIdRequest).params;
  response.setHeader(
    'Cache-Control',
    request.headers.authorization
      ? 'no-store'
      : 'public, max-age=300, s-maxage=1800, stale-while-revalidate=86400',
  );
  response.status(200).json({ success: true, ...(await getProductDetails(id)) });
};

export const createProduct: RequestHandler = async (request, response) => {
  const { body } = response.locals.validated as CreateProductRequest;
  const files = Array.isArray(request.files) ? request.files : [];
  if (files.length === 0) {
    throw new ApiError(422, 'PRODUCT_IMAGE_REQUIRED', 'At least one product image is required');
  }
  const categoryFolder = await getProductUploadFolder(body.category_id);
  const images = await uploadProductImages(files, categoryFolder);
  const product = await createProductRecord(body, images);
  response.status(201).json({
    success: true,
    product,
    catalogue: await publishCatalogueSafely(),
  });
};

export const updateProduct: RequestHandler = async (_request, response) => {
  const validated = response.locals.validated as UpdateProductRequest;
  const product = await updateProductRecord(validated.params.id, validated.body);
  response.status(200).json({
    success: true,
    product,
    catalogue: await publishCatalogueSafely(),
  });
};

export const deleteProduct: RequestHandler = async (_request, response) => {
  const { id } = (response.locals.validated as ProductIdRequest).params;
  await deleteProductRecord(id);
  response.status(200).json({
    success: true,
    message: 'Product deleted',
    catalogue: await publishCatalogueSafely(),
  });
};
