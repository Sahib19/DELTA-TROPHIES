import type { Types } from 'mongoose';
import { CategoryModel } from '../models/category.model.js';
import { ProductModel, type Product, type ProductImage } from '../models/product.model.js';
import { ApiError } from '../utils/api-error.js';
import { escapeRegularExpression } from '../utils/regex.js';
import { createSlug, updateSlug } from '../utils/slug.js';
import { buildProductSeoDescription, buildProductSeoTitle } from '../utils/seo.js';
import { toObjectId } from '../utils/object-id.js';
import type {
  CreateProductRequest,
  ProductListRequest,
  UpdateProductRequest,
} from '../validation/product.schemas.js';
import { deleteProductImages } from './image.service.js';

interface PopulatedCategory {
  _id: Types.ObjectId;
  name: string;
  slug: string;
}

interface ProductLean extends Omit<Product, 'category'> {
  category: PopulatedCategory | null;
}

export interface ProductDto {
  id: string;
  name: string;
  sku: string | null;
  slug: string;
  description: string | null;
  category_id: string | null;
  category_name: string | null;
  category_slug: string | null;
  material: string | null;
  model_group: 'LA' | 'F' | 'RA' | 'ACA' | null;
  search_terms: string[];
  in_stock: boolean;
  images: string[];
  seo_title: string;
  seo_description: string;
  image_alt: string;
  created_at: Date;
  updated_at: Date;
}

export interface ProductListResult {
  products: ProductDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ProductNavigationItem {
  id: string;
  name: string;
  slug: string;
}

export interface ProductDetailsResult {
  product: ProductDto;
  navigation: {
    previous: ProductNavigationItem | null;
    next: ProductNavigationItem | null;
  };
}

function toProductDto(product: ProductLean): ProductDto {
  const categoryName = product.category?.name ?? 'award';
  return {
    id: product._id.toString(),
    name: product.name,
    sku: product.sku ?? null,
    slug: product.slug,
    description: product.description ?? null,
    category_id: product.category?._id.toString() ?? null,
    category_name: product.category?.name ?? null,
    category_slug: product.category?.slug ?? null,
    material: product.material ?? null,
    model_group: product.modelGroup ?? null,
    search_terms: product.searchTerms ?? [],
    in_stock: product.inStock,
    images: product.images.map((image) => image.url),
    seo_title: buildProductSeoTitle(product.name, product.sku),
    seo_description: buildProductSeoDescription(product.name, product.sku),
    image_alt: `${product.name} - ${categoryName}`,
    created_at: product.createdAt,
    updated_at: product.updatedAt,
  };
}

function toProductNavigationItem(
  product: Pick<Product, '_id' | 'name' | 'slug'> | null,
): ProductNavigationItem | null {
  if (!product) return null;
  return {
    id: product._id.toString(),
    name: product.name,
    slug: product.slug,
  };
}

async function findActiveProduct(id: string): Promise<ProductLean> {
  const document = await ProductModel.findOne({ _id: toObjectId(id), isActive: true })
    .populate('category', 'name slug')
    .lean()
    .exec();
  if (!document) throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
  return document as unknown as ProductLean;
}

interface ActiveCategory {
  slug: string;
  name: string;
  description?: string;
}

function managedProductDescription(name: string, categoryName: string): string {
  return `${name} is a customizable product from our ${categoryName.toLowerCase()} collection. Contact Delta Industries, Jalandhar for branding options, quantities and a bulk-order quotation.`;
}

async function findActiveCategoryById(categoryId: string): Promise<ActiveCategory> {
  const category = await CategoryModel.findOne({
    _id: toObjectId(categoryId),
    isActive: true,
  })
    .select('slug name description')
    .lean()
    .exec();
  if (!category) throw new ApiError(422, 'INVALID_CATEGORY', 'Selected category does not exist');
  return category;
}

export async function getProductUploadFolder(categoryId: string): Promise<string> {
  const category = await CategoryModel.findOne({
    _id: toObjectId(categoryId),
    isActive: true,
  })
    .select('slug cloudinaryFolder')
    .lean()
    .exec();
  if (!category) {
    throw new ApiError(422, 'INVALID_CATEGORY', 'Selected category does not exist');
  }
  return category.cloudinaryFolder ?? category.slug;
}

export async function listProducts(query: ProductListRequest['query']): Promise<ProductListResult> {
  const filter: {
    isActive: boolean;
    category?: Types.ObjectId;
    inStock?: boolean;
    $or?: {
      name?: RegExp;
      sku?: RegExp;
      description?: RegExp;
      material?: RegExp;
      searchTerms?: RegExp;
    }[];
  } = { isActive: true };

  if (query.category) {
    const category = await CategoryModel.findOne({ slug: query.category, isActive: true })
      .select('_id')
      .lean()
      .exec();
    if (!category) {
      return {
        products: [],
        pagination: { page: query.page, limit: query.limit, total: 0, pages: 0 },
      };
    }
    filter.category = category._id;
  }

  if (query.search) {
    const searchExpression = new RegExp(escapeRegularExpression(query.search), 'i');
    filter.$or = [
      { name: searchExpression },
      { sku: searchExpression },
      { description: searchExpression },
      { material: searchExpression },
      { searchTerms: searchExpression },
    ];
  }
  if (query.in_stock !== undefined) filter.inStock = query.in_stock;

  const skip = (query.page - 1) * query.limit;
  const [documents, total] = await Promise.all([
    ProductModel.find(filter)
      .populate('category', 'name slug')
      .sort({ displayOrder: 1, _id: 1 })
      .skip(skip)
      .limit(query.limit)
      .lean()
      .exec(),
    ProductModel.countDocuments(filter).exec(),
  ]);

  return {
    products: (documents as unknown as ProductLean[]).map(toProductDto),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      pages: total === 0 ? 0 : Math.ceil(total / query.limit),
    },
  };
}

export async function listAllActiveProducts(): Promise<ProductDto[]> {
  const documents = await ProductModel.find({ isActive: true })
    .populate('category', 'name slug')
    .sort({ displayOrder: 1, _id: 1 })
    .lean()
    .exec();

  return (documents as unknown as ProductLean[]).map(toProductDto);
}

export async function getProduct(id: string): Promise<ProductDto> {
  return toProductDto(await findActiveProduct(id));
}

export async function getProductDetails(id: string): Promise<ProductDetailsResult> {
  const product = await findActiveProduct(id);
  if (!product.category) {
    return {
      product: toProductDto(product),
      navigation: { previous: null, next: null },
    };
  }
  const sharedFilter = {
    category: product.category._id,
    isActive: true,
  };

  const [previous, next] = await Promise.all([
    ProductModel.findOne({
      ...sharedFilter,
      $or: [
        { displayOrder: { $lt: product.displayOrder } },
        { displayOrder: product.displayOrder, _id: { $lt: product._id } },
      ],
    })
      .sort({ displayOrder: -1, _id: -1 })
      .select('_id name slug')
      .lean()
      .exec(),
    ProductModel.findOne({
      ...sharedFilter,
      $or: [
        { displayOrder: { $gt: product.displayOrder } },
        { displayOrder: product.displayOrder, _id: { $gt: product._id } },
      ],
    })
      .sort({ displayOrder: 1, _id: 1 })
      .select('_id name slug')
      .lean()
      .exec(),
  ]);

  return {
    product: toProductDto(product),
    navigation: {
      previous: toProductNavigationItem(previous),
      next: toProductNavigationItem(next),
    },
  };
}

export async function createProduct(
  input: CreateProductRequest['body'],
  images: ProductImage[],
): Promise<ProductDto> {
  try {
    const category = await findActiveCategoryById(input.category_id);
    if (category.slug === 'la-aca-ra-f-models' && !input.model_group) {
      throw new ApiError(
        422,
        'MODEL_GROUP_REQUIRED',
        'Select an award type for Special Awards & Frames',
      );
    }

    const description = input.description ?? managedProductDescription(input.name, category.name);
    const lastProduct = await ProductModel.findOne()
      .sort({ displayOrder: -1 })
      .select('displayOrder')
      .lean()
      .exec();
    const document = new ProductModel({
      name: input.name,
      slug: createSlug(input.name, input.sku),
      category: toObjectId(input.category_id),
      displayOrder: (lastProduct?.displayOrder ?? -1) + 1,
      inStock: input.in_stock,
      images,
      ...(input.sku ? { sku: input.sku } : {}),
      description,
      searchTerms: Array.from(
        new Set([
          input.name.toLowerCase(),
          category.name.toLowerCase(),
          ...(input.sku ? [input.sku.toLowerCase()] : []),
        ]),
      ),
      seoManaged: !input.description,
      ...(input.material ? { material: input.material } : {}),
      ...(category.slug === 'la-aca-ra-f-models' && input.model_group
        ? { modelGroup: input.model_group }
        : {}),
    });
    await document.save();
    return getProduct(document._id.toString());
  } catch (error) {
    await deleteProductImages(images);
    throw error;
  }
}

export async function updateProduct(
  id: string,
  input: UpdateProductRequest['body'],
): Promise<ProductDto> {
  const productId = toObjectId(id);
  const current = await ProductModel.findById(productId)
    .select('name sku category modelGroup description searchTerms seoManaged slug')
    .lean()
    .exec();
  if (!current) throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found');

  const targetCategory = input.category_id
    ? await findActiveCategoryById(input.category_id)
    : await CategoryModel.findById(current.category).select('slug name description').lean().exec();
  if (!targetCategory) {
    throw new ApiError(422, 'INVALID_CATEGORY', 'Selected category does not exist');
  }

  const skuModelGroup = current.sku?.split('-')[0]?.toUpperCase();
  const existingModelGroup = ['LA', 'F', 'RA', 'ACA'].includes(skuModelGroup ?? '')
    ? (skuModelGroup as 'LA' | 'F' | 'RA' | 'ACA')
    : undefined;
  const targetModelGroup = input.model_group ?? current.modelGroup ?? existingModelGroup;
  if (targetCategory.slug === 'la-aca-ra-f-models' && !targetModelGroup) {
    throw new ApiError(
      422,
      'MODEL_GROUP_REQUIRED',
      'Select an award type for Special Awards & Frames',
    );
  }

  const update: Record<string, unknown> = {};
  const nextName = input.name ?? current.name;
  if (input.name !== undefined) update.name = input.name;
  if (input.sku !== undefined) update.sku = input.sku;
  if (input.description !== undefined) {
    update.description = input.description;
    update.seoManaged = false;
  } else if (current.seoManaged && (input.name !== undefined || input.category_id !== undefined)) {
    update.description = managedProductDescription(nextName, targetCategory.name);
  } else if (input.name !== undefined && current.description) {
    update.description = current.description.replaceAll(current.name, input.name);
  }
  if (input.name !== undefined || input.sku !== undefined) {
    const staleTerms = new Set(
      [current.name, current.sku].filter(Boolean).map((term) => term!.toLowerCase()),
    );
    update.searchTerms = Array.from(
      new Set([
        ...(current.searchTerms ?? []).filter((term) => !staleTerms.has(term.toLowerCase())),
        nextName.toLowerCase(),
        ...((input.sku ?? current.sku) ? [(input.sku ?? current.sku)!.toLowerCase()] : []),
      ]),
    );
  }
  if (input.category_id !== undefined) update.category = toObjectId(input.category_id);
  if (input.material !== undefined) update.material = input.material;
  if (targetCategory.slug === 'la-aca-ra-f-models') update.modelGroup = targetModelGroup;
  if (input.in_stock !== undefined) update.inStock = input.in_stock;
  if (input.is_active !== undefined) update.isActive = input.is_active;
  if (input.name !== undefined || input.sku !== undefined) {
    update.slug = updateSlug(current.slug, input.name ?? current.name, input.sku ?? current.sku);
  }

  const updateOperation: Record<string, unknown> = { $set: update };
  if (targetCategory.slug !== 'la-aca-ra-f-models') {
    updateOperation.$unset = { modelGroup: 1 };
  }

  const document = await ProductModel.findByIdAndUpdate(productId, updateOperation, {
    new: true,
    runValidators: true,
  })
    .populate('category', 'name slug')
    .lean()
    .exec();
  if (!document) throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
  return toProductDto(document as unknown as ProductLean);
}

export async function deleteProduct(id: string): Promise<void> {
  const productId = toObjectId(id);
  const document = await ProductModel.findOne({ _id: productId, isActive: true }).lean().exec();
  if (!document) throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found');

  const hidden = await ProductModel.updateOne(
    { _id: productId, isActive: true },
    { $set: { isActive: false } },
  ).exec();
  if (hidden.modifiedCount !== 1) {
    throw new ApiError(409, 'PRODUCT_DELETE_CONFLICT', 'Product is already being deleted');
  }

  try {
    await deleteProductImages(document.images, { strict: true });
  } catch {
    await ProductModel.updateOne({ _id: productId }, { $set: { isActive: true } }).exec();
    throw new ApiError(
      502,
      'MEDIA_DELETE_FAILED',
      'Cloudinary image deletion failed. The product was not deleted; please retry.',
    );
  }

  const deleted = await ProductModel.deleteOne({ _id: productId, isActive: false }).exec();
  if (deleted.deletedCount !== 1) {
    throw new ApiError(500, 'PRODUCT_DELETE_FAILED', 'Product cleanup could not be completed');
  }
}
