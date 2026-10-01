import { createHash } from 'node:crypto';
import { cloudinary } from '../config/cloudinary.js';
import { env, isCloudinaryConfigured } from '../config/env.js';
import { logger } from '../config/logger.js';
import { ApiError } from '../utils/api-error.js';
import { listCategories, type CategoryDto } from './category.service.js';
import { listAllActiveProducts, type ProductDto } from './product.service.js';

export const cataloguePublicId = 'deltatrophies/catalog/catalogue.json';

export interface CatalogueManifest {
  schema_version: 1;
  version: string;
  generated_at: string;
  categories: CategoryDto[];
  products: ProductDto[];
}

export interface CataloguePublicationResult {
  published: boolean;
  version?: string;
  generated_at?: string;
  url?: string;
  error?: string;
}

export function catalogueDeliveryUrl(): string | undefined {
  if (!env.CLOUDINARY_CLOUD_NAME) return undefined;
  return `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/raw/upload/${cataloguePublicId}`;
}

export async function buildCatalogueManifest(): Promise<CatalogueManifest> {
  const [categories, products] = await Promise.all([listCategories(), listAllActiveProducts()]);
  const contentHash = createHash('sha256')
    .update(JSON.stringify({ categories, products }))
    .digest('hex')
    .slice(0, 16);

  return {
    schema_version: 1,
    version: contentHash,
    generated_at: new Date().toISOString(),
    categories,
    products,
  };
}

export async function uploadCatalogueManifest(
  manifest: CatalogueManifest,
): Promise<CataloguePublicationResult> {
  if (!isCloudinaryConfigured) {
    throw new ApiError(
      503,
      'CATALOGUE_STORAGE_UNAVAILABLE',
      'Catalogue publishing is not configured',
    );
  }

  const encodedCatalogue = Buffer.from(JSON.stringify(manifest), 'utf8').toString('base64');
  const result = await cloudinary.uploader.upload(
    `data:application/json;base64,${encodedCatalogue}`,
    {
      resource_type: 'raw',
      public_id: cataloguePublicId,
      overwrite: true,
      invalidate: true,
      timeout: 120_000,
    },
  );

  return {
    published: true,
    version: manifest.version,
    generated_at: manifest.generated_at,
    url: catalogueDeliveryUrl() ?? result.secure_url,
  };
}

export async function publishCatalogue(): Promise<CataloguePublicationResult> {
  return uploadCatalogueManifest(await buildCatalogueManifest());
}

export async function publishCatalogueSafely(): Promise<CataloguePublicationResult> {
  try {
    return await publishCatalogue();
  } catch (error) {
    logger.error({ err: error }, 'Catalogue publication failed');
    return {
      published: false,
      error: 'Catalogue saved, but the public snapshot could not be refreshed',
    };
  }
}
