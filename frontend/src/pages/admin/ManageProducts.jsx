import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../api/axios";
import FilterSidebar from "../../components/FilterSidebar";
import getImageUrl, { getOptimizedImageUrl } from "../../utils/getImageUrl";
import { isQuickEditEnabled } from "../../utils/adminQuickEdit";

const PAGE_SIZE = 24;
const SPECIAL_CATEGORY_SLUG = "la-aca-ra-f-models";
const SPECIAL_MODEL_GROUPS = [
  { code: "LA", name: "Wooden & Acrylic Awards" },
  { code: "F", name: "Frames" },
  { code: "RA", name: "Resin Awards" },
  { code: "ACA", name: "Acrylic & Resin Awards" },
];
const emptyForm = {
  name: "",
  sku: "",
  description: "",
  category_id: "",
  model_group: "",
  material: "",
  in_stock: true,
};

function errorMessage(error, fallback) {
  return error.response?.data?.error || fallback;
}

function saveNotice(response, successMessage) {
  return response.data.catalogue?.published === false
    ? `${successMessage} Public catalogue refresh failed; use Publish Catalogue on the Dashboard to retry.`
    : `${successMessage} Public catalogue refreshed.`;
}

function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 0, total: 0 });
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const previewUrls = useRef([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deletingId, setDeletingId] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [catalogVersion, setCatalogVersion] = useState(0);
  const [quickEdit] = useState(isQuickEditEnabled);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(
    () => () =>
      previewUrls.current.forEach((preview) => URL.revokeObjectURL(preview)),
    [],
  );

  useEffect(() => {
    if (!editingProduct) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleEscape = (event) => {
      if (event.key === "Escape" && !updating) setEditingProduct(null);
    };
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [editingProduct, updating]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchCategories = async () => {
      try {
        const response = await API.get("/categories", {
          signal: controller.signal,
        });
        setCategories(response.data.categories);
      } catch (requestError) {
        if (requestError.code !== "ERR_CANCELED") {
          setError("Unable to load categories. Please try again.");
        }
      }
    };
    void fetchCategories();
    return () => controller.abort();
  }, [catalogVersion]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchProducts = async () => {
      setProductsLoading(true);
      setError("");
      try {
        const params = { page, limit: PAGE_SIZE };
        if (selectedCategory !== "all") params.category = selectedCategory;
        if (debouncedSearch) params.search = debouncedSearch;
        const response = await API.get("/products", {
          params,
          signal: controller.signal,
        });
        setProducts(response.data.products);
        setPagination(response.data.pagination);
      } catch (requestError) {
        if (requestError.code !== "ERR_CANCELED") {
          setProducts([]);
          setError("Unable to load products. Please try again.");
        }
      } finally {
        if (!controller.signal.aborted) setProductsLoading(false);
      }
    };
    void fetchProducts();
    return () => controller.abort();
  }, [selectedCategory, debouncedSearch, page, catalogVersion]);

  const refreshCatalog = () => setCatalogVersion((version) => version + 1);
  const handleCategoryChange = (slug) => {
    setSelectedCategory(slug);
    setPage(1);
  };
  const resetForm = () => {
    previewUrls.current.forEach((preview) => URL.revokeObjectURL(preview));
    previewUrls.current = [];
    setFormData(emptyForm);
    setImages([]);
    setImagePreviews([]);
    setUploadProgress(0);
  };
  const handleImageSelection = (event) => {
    previewUrls.current.forEach((preview) => URL.revokeObjectURL(preview));
    const selectedImages = Array.from(event.target.files ?? []);
    const previews = selectedImages.map((image) => URL.createObjectURL(image));
    previewUrls.current = previews;
    setImages(selectedImages);
    setImagePreviews(previews);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (images.length === 0) {
      setError("Please select at least one product image.");
      return;
    }
    setSaving(true);
    setUploadProgress(0);
    setError("");
    setNotice("");
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "model_group" && !value) return;
        data.append(key, String(value));
      });
      images.forEach((image) => data.append("images", image));
      const response = await API.post("/products", data, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total)
            setUploadProgress(
              Math.round((progressEvent.loaded / progressEvent.total) * 100),
            );
        },
      });
      const selected = categories.find(
        (category) => category.id === formData.category_id,
      );
      resetForm();
      setShowForm(false);
      setNotice(
        saveNotice(
          response,
          "Product and original image saved successfully in Cloudinary.",
        ),
      );
      if (selected) setSelectedCategory(selected.slug);
      setPage(1);
      refreshCatalog();
    } catch (requestError) {
      setError(
        errorMessage(requestError, "Unable to save product. Please try again."),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (
      !window.confirm(`Delete ${product.name} from the website and Cloudinary?`)
    )
      return;
    setDeletingId(product.id);
    setError("");
    setNotice("");
    try {
      const response = await API.delete(`/products/${product.id}`);
      setNotice(
        saveNotice(
          response,
          "Product and its Cloudinary image were deleted successfully.",
        ),
      );
      if (products.length === 1 && page > 1) setPage((current) => current - 1);
      refreshCatalog();
    } catch (requestError) {
      setError(
        errorMessage(
          requestError,
          "Unable to delete product. Please try again.",
        ),
      );
    } finally {
      setDeletingId(null);
    }
  };

  const openEditModal = (product, { clearName = false } = {}) => {
    const skuModelGroup = product.sku?.split("-")[0]?.toUpperCase();
    const inferredModelGroup = SPECIAL_MODEL_GROUPS.some(
      (group) => group.code === skuModelGroup,
    )
      ? skuModelGroup
      : "";
    setEditForm({
      name: clearName ? "" : (product.name ?? ""),
      sku: product.sku ?? "",
      description: product.description ?? "",
      category_id: product.category_id ?? "",
      model_group: product.model_group ?? inferredModelGroup,
      material: product.material ?? "",
      in_stock: product.in_stock,
    });
    setEditError("");
    setEditingProduct(product);
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!editingProduct || updating) return;
    const targetCategory = categories.find(
      (category) => category.id === editForm.category_id,
    );
    if (
      targetCategory?.slug === SPECIAL_CATEGORY_SLUG &&
      !editForm.model_group
    ) {
      setEditError("Please select an award type.");
      return;
    }

    setUpdating(true);
    setEditError("");
    try {
      let nextProduct = null;
      let nextPage = page;
      let nextLookupFailed = false;
      if (quickEdit) {
        const currentIndex = products.findIndex(
          (product) => product.id === editingProduct.id,
        );
        if (currentIndex >= 0 && currentIndex < products.length - 1) {
          nextProduct = products[currentIndex + 1];
        } else if (
          currentIndex === products.length - 1 &&
          page < pagination.pages
        ) {
          try {
            const params = { page: page + 1, limit: PAGE_SIZE };
            if (selectedCategory !== "all") params.category = selectedCategory;
            if (debouncedSearch) params.search = debouncedSearch;
            const response = await API.get("/products", { params });
            nextProduct = response.data.products[0] ?? null;
            if (nextProduct) nextPage = page + 1;
          } catch {
            nextLookupFailed = true;
          }
        }
      }

      const payload = { ...editForm };
      if (editForm.description === (editingProduct.description ?? "")) {
        delete payload.description;
      }
      if (targetCategory?.slug !== SPECIAL_CATEGORY_SLUG) {
        delete payload.model_group;
      }
      const response = await API.patch(`/products/${editingProduct.id}`, payload);
      if (quickEdit && nextProduct) {
        if (nextPage !== page) setPage(nextPage);
        openEditModal(nextProduct, { clearName: true });
        setNotice(
          saveNotice(response, "Product saved. Next product is ready to edit."),
        );
      } else {
        setEditingProduct(null);
        setNotice(
          saveNotice(
            response,
            nextLookupFailed
            ? "Product saved, but the next product could not be loaded. Please select it manually."
            : quickEdit
              ? "Product saved. No next product in this list."
              : "Product details updated successfully.",
          ),
        );
      }
      setError("");
      refreshCatalog();
    } catch (requestError) {
      setEditError(
        errorMessage(
          requestError,
          "Unable to update product. Please try again.",
        ),
      );
    } finally {
      setUpdating(false);
    }
  };

  const allProductCount = categories.reduce(
    (total, category) => total + (category.product_count ?? 0),
    0,
  );
  const rangeStart =
    pagination.total === 0 ? 0 : (pagination.page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(pagination.page * PAGE_SIZE, pagination.total);
  const selectedFormCategory = categories.find(
    (category) => category.id === formData.category_id,
  );
  const requiresModelGroup =
    selectedFormCategory?.slug === SPECIAL_CATEGORY_SLUG;
  const selectedEditCategory = categories.find(
    (category) => category.id === editForm.category_id,
  );
  const editRequiresModelGroup =
    selectedEditCategory?.slug === SPECIAL_CATEGORY_SLUG;

  return (
    <div className="bg-darkbg min-h-screen pt-24">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-12">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <Link
              to="/admin/dashboard"
              className="text-gold/60 hover:text-gold text-xs tracking-widest uppercase"
            >
              ← Dashboard
            </Link>
            <h1 className="text-white text-3xl font-bold mt-2">
              Manage Products
            </h1>
            <p className="text-white/35 text-sm mt-1">
              {allProductCount} products in catalogue
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowForm((current) => !current);
              setError("");
              setNotice("");
              if (showForm) resetForm();
            }}
            className="bg-gold text-darkbg font-bold px-5 md:px-6 py-3 text-xs md:text-sm tracking-widest uppercase hover:bg-gold/90 transition-colors"
          >
            {showForm ? "Cancel" : "+ Add Product"}
          </button>
        </div>

        {error && (
          <p
            className="text-red-300 text-sm mb-5 border border-red-400/20 bg-red-400/10 px-4 py-3"
            role="alert"
          >
            {error}
          </p>
        )}
        {notice && (
          <p
            className="text-emerald-300 text-sm mb-5 border border-emerald-400/20 bg-emerald-400/10 px-4 py-3"
            role="status"
          >
            {notice}
          </p>
        )}
        {quickEdit && (
          <p
            className="mb-5 border border-gold/25 bg-gold/[0.06] px-4 py-3 text-sm text-gold"
            role="status"
          >
            Save &amp; Next is on. Press Enter while editing to save and open
            the next product with a blank name field.{" "}
            <Link
              to="/admin/dashboard"
              className="ml-2 underline hover:text-white"
            >
              Turn off on Dashboard
            </Link>
          </p>
        )}

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-10 overflow-hidden border border-gold/20 bg-white/[0.025] shadow-2xl shadow-black/20"
          >
            <div className="border-b border-gold/15 px-5 py-4 md:px-7">
              <h2 className="text-base font-semibold text-white">
                Add a new product
              </h2>
              <p className="mt-1 text-xs text-white/35">
                Product images are stored in the selected category's Cloudinary
                folder.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-5 p-5 md:grid-cols-2 md:p-7">
              <label className="block text-xs font-medium text-white/55">
                Product name <span className="text-gold">*</span>
                <input
                  value={formData.name}
                  onChange={(event) =>
                    setFormData({ ...formData, name: event.target.value })
                  }
                  required
                  placeholder="Enter product name"
                  className="mt-2 block h-12 w-full border border-white/10 bg-black/25 px-4 text-sm text-white placeholder-white/20 transition-colors focus:border-gold/70 focus:outline-none"
                />
              </label>
              <label className="block text-xs font-medium text-white/55">
                SKU
                <input
                  placeholder="e.g. PF-167"
                  value={formData.sku}
                  onChange={(event) =>
                    setFormData({ ...formData, sku: event.target.value })
                  }
                  className="mt-2 block h-12 w-full border border-white/10 bg-black/25 px-4 text-sm text-white placeholder-white/20 transition-colors focus:border-gold/70 focus:outline-none"
                />
              </label>
              <label className="block text-xs font-medium text-white/55">
                Category <span className="text-gold">*</span>
                <select
                  value={formData.category_id}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      category_id: event.target.value,
                      model_group: "",
                    })
                  }
                  required
                  className="mt-2 block h-12 w-full border border-white/10 bg-[#0b0b0b] px-4 text-sm text-white transition-colors focus:border-gold/70 focus:outline-none"
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              {requiresModelGroup && (
                <label className="block text-xs font-medium text-white/55">
                  Award type <span className="text-gold">*</span>
                  <select
                    value={formData.model_group}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        model_group: event.target.value,
                      })
                    }
                    required
                    className="mt-2 block h-12 w-full border border-gold/40 bg-[#0b0b0b] px-4 text-sm text-white transition-colors focus:border-gold focus:outline-none"
                  >
                    <option value="">Select award type</option>
                    {SPECIAL_MODEL_GROUPS.map((group) => (
                      <option key={group.code} value={group.code}>
                        {group.code} — {group.name}
                      </option>
                    ))}
                  </select>
                  <span className="mt-1.5 block text-[11px] text-white/30">
                    This decides where the product appears inside Special Awards
                    &amp; Frames.
                  </span>
                </label>
              )}
              <label className="block text-xs font-medium text-white/55">
                Material
                <input
                  placeholder="e.g. Crystal, Metal"
                  value={formData.material}
                  onChange={(event) =>
                    setFormData({ ...formData, material: event.target.value })
                  }
                  className="mt-2 block h-12 w-full border border-white/10 bg-black/25 px-4 text-sm text-white placeholder-white/20 transition-colors focus:border-gold/70 focus:outline-none"
                />
              </label>
              <label className="block text-xs font-medium text-white/55 md:col-span-2">
                Description
                <textarea
                  value={formData.description}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      description: event.target.value,
                    })
                  }
                  rows={4}
                  placeholder="Add useful product details..."
                  className="mt-2 block w-full resize-none border border-white/10 bg-black/25 px-4 py-3 text-sm text-white placeholder-white/20 transition-colors focus:border-gold/70 focus:outline-none"
                />
              </label>

              <div className="md:col-span-2">
                <p className="mb-2 text-xs font-medium text-white/55">
                  Product images <span className="text-gold">*</span>
                </p>
                <input
                  id="product-images"
                  type="file"
                  multiple
                  required
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageSelection}
                  className="sr-only"
                />
                <label
                  htmlFor="product-images"
                  className="flex min-h-28 cursor-pointer flex-col items-center justify-center border border-dashed border-gold/30 bg-gold/[0.035] px-5 py-5 text-center transition-colors hover:border-gold/60 hover:bg-gold/[0.06]"
                >
                  <span className="text-sm font-semibold text-gold">
                    {images.length > 0
                      ? `${images.length} image${images.length === 1 ? "" : "s"} selected`
                      : "Choose product images"}
                  </span>
                  <span className="mt-1.5 text-xs text-white/35">
                    JPEG, PNG, WebP or GIF · maximum 10 images · 5 MB each
                  </span>
                </label>
                {imagePreviews.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {imagePreviews.map((preview, index) => (
                      <div key={preview} className="w-24">
                        <div className="h-24 w-24 border border-gold/20 bg-white p-1">
                          <img
                            src={preview}
                            alt={`Selected upload ${index + 1}`}
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <p
                          className="mt-1 truncate text-[10px] text-white/35"
                          title={images[index]?.name}
                        >
                          {images[index]?.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between md:col-span-2">
                <label className="flex cursor-pointer items-center gap-3 text-sm text-white/60">
                  <input
                    type="checkbox"
                    checked={formData.in_stock}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        in_stock: event.target.checked,
                      })
                    }
                    className="h-4 w-4 accent-[#d4af37]"
                  />
                  Product is in stock
                </label>
                <div className="flex flex-wrap items-center gap-4">
                  {saving && (
                    <div className="h-1.5 w-40 overflow-hidden bg-white/10">
                      <div
                        className="h-full bg-gold transition-[width]"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={saving}
                    className="min-w-44 bg-gold px-8 py-3.5 text-sm font-bold uppercase tracking-widest text-darkbg transition-colors hover:bg-gold/90 disabled:opacity-50"
                  >
                    {saving ? `Uploading ${uploadProgress}%` : "Save Product"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          <FilterSidebar
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            useButtons
          />
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by product name or SKU..."
                className="flex-1 bg-white/5 border border-gold/20 px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold text-sm"
              />
              <select
                value={selectedCategory}
                onChange={(event) => handleCategoryChange(event.target.value)}
                aria-label="Filter by category"
                className="md:hidden bg-darkbg border border-gold/20 px-4 py-3 text-white text-sm"
              >
                <option value="all">All Products ({allProductCount})</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name} ({category.product_count})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between gap-4 mb-3">
              <p className="text-white/35 text-xs">
                {productsLoading
                  ? "Loading products..."
                  : `${rangeStart}–${rangeEnd} of ${pagination.total}`}
              </p>
              {selectedCategory !== "all" && (
                <button
                  type="button"
                  onClick={() => handleCategoryChange("all")}
                  className="text-gold text-xs underline"
                >
                  Clear category
                </button>
              )}
            </div>

            <div className="border border-gold/20 overflow-x-auto">
              <table className="w-full min-w-[680px]">
                <thead>
                  <tr className="border-b border-gold/20">
                    {["Product", "SKU", "Category", "Status", "Action"].map(
                      (heading, index) => (
                        <th
                          key={heading}
                          className={`text-gold text-xs tracking-widest uppercase px-4 py-3 ${index === 4 ? "text-right" : "text-left"}`}
                        >
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {productsLoading ? (
                    Array.from({ length: 6 }, (_, index) => (
                      <tr
                        key={index}
                        className="border-b border-gold/10 animate-pulse"
                      >
                        <td colSpan={5} className="px-4 py-3">
                          <div className="h-14 bg-white/5" />
                        </td>
                      </tr>
                    ))
                  ) : products.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center text-white/30 py-14 text-sm"
                      >
                        No matching products found.
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => {
                      const originalImage = getImageUrl(product.images?.[0]);
                      return (
                        <tr
                          key={product.id}
                          className="border-b border-gold/10 hover:bg-white/[0.03]"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3 min-w-48">
                              <div className="w-14 h-14 shrink-0 bg-white p-1">
                                {originalImage ? (
                                  <img
                                    src={getOptimizedImageUrl(
                                      product.images[0],
                                      { width: 160, height: 160 },
                                    )}
                                    alt=""
                                    loading="lazy"
                                    decoding="async"
                                    onError={(event) => {
                                      if (
                                        event.currentTarget.src !==
                                        originalImage
                                      )
                                        event.currentTarget.src = originalImage;
                                    }}
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <span className="w-full h-full flex items-center justify-center text-darkbg/30 text-[9px]">
                                    No image
                                  </span>
                                )}
                              </div>
                              <span className="text-white text-sm">
                                {product.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-white/50 text-sm whitespace-nowrap">
                            {product.sku || "—"}
                          </td>
                          <td className="px-4 py-3 text-white/50 text-sm">
                            {product.category_name}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-[10px] uppercase tracking-wider ${product.in_stock ? "text-emerald-300" : "text-amber-300"}`}
                            >
                              {product.in_stock ? "In stock" : "Out of stock"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-4">
                              <button
                                type="button"
                                onClick={() => openEditModal(product)}
                                className="text-gold hover:text-gold/75 text-xs tracking-wider uppercase"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(product)}
                                disabled={deletingId === product.id}
                                className="text-red-400 hover:text-red-300 text-xs tracking-wider uppercase disabled:opacity-40"
                              >
                                {deletingId === product.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div className="pt-6">
                <div className="flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                    disabled={productsLoading || pagination.page <= 1}
                    className="border border-gold/30 px-4 py-2 text-xs uppercase tracking-wider text-gold transition-colors hover:bg-gold/10 disabled:opacity-30"
                  >
                    ← Previous
                  </button>
                  <span className="text-xs text-white/40">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) =>
                        Math.min(pagination.pages, current + 1),
                      )
                    }
                    disabled={
                      productsLoading || pagination.page >= pagination.pages
                    }
                    className="border border-gold/30 px-4 py-2 text-xs uppercase tracking-wider text-gold transition-colors hover:bg-gold/10 disabled:opacity-30"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {editingProduct && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-md"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !updating) {
              setEditingProduct(null);
            }
          }}
        >
          <div
            key={editingProduct.id}
            className="w-full max-w-2xl overflow-hidden border border-gold/30 bg-[#0b0b0b] shadow-2xl shadow-black"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-product-title"
          >
            <div className="flex items-start justify-between gap-5 border-b border-gold/15 px-5 py-4 md:px-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-gold/60">
                  Edit product
                </p>
                <h2
                  id="edit-product-title"
                  className="mt-1 text-xl font-semibold text-white"
                >
                  {editingProduct.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                disabled={updating}
                aria-label="Close edit product"
                className="p-1 text-2xl leading-none text-white/45 transition-colors hover:text-white disabled:opacity-40"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleUpdate}
              className="max-h-[75vh] overflow-y-auto p-5 md:p-6"
            >
              {editError && (
                <p
                  className="mb-5 border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300"
                  role="alert"
                >
                  {editError}
                </p>
              )}

              <div className="mb-5 flex items-center gap-4 border-b border-white/10 pb-5">
                <div className="h-20 w-20 shrink-0 bg-white p-1">
                  <img
                    src={getOptimizedImageUrl(editingProduct.images?.[0], {
                      width: 200,
                      height: 200,
                    })}
                    alt=""
                    className="h-full w-full object-contain"
                  />
                </div>
                <p className="text-xs leading-relaxed text-white/35">
                  Product image will remain unchanged. Update the catalogue
                  details below.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2">
                <label className="block text-xs font-medium text-white/55">
                  Product name <span className="text-gold">*</span>
                  <input
                    autoFocus
                    required
                    placeholder="Enter product name"
                    value={editForm.name}
                    onChange={(event) =>
                      setEditForm({ ...editForm, name: event.target.value })
                    }
                    className="mt-2 block h-12 w-full border border-white/10 bg-white/[0.035] px-4 text-sm text-white transition-colors focus:border-gold/70 focus:outline-none"
                  />
                  <span className="mt-2 block text-[11px] font-normal leading-relaxed text-white/30">
                    This name also updates the storefront heading, image text,
                    search title and product structured data.
                  </span>
                </label>
                <label className="block text-xs font-medium text-white/55">
                  SKU
                  <input
                    value={editForm.sku}
                    onChange={(event) =>
                      setEditForm({ ...editForm, sku: event.target.value })
                    }
                    className="mt-2 block h-12 w-full border border-white/10 bg-white/[0.035] px-4 text-sm text-white transition-colors focus:border-gold/70 focus:outline-none"
                  />
                </label>
                <label className="block text-xs font-medium text-white/55">
                  Category <span className="text-gold">*</span>
                  <select
                    required
                    value={editForm.category_id}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        category_id: event.target.value,
                        model_group: "",
                      })
                    }
                    className="mt-2 block h-12 w-full border border-white/10 bg-[#0b0b0b] px-4 text-sm text-white transition-colors focus:border-gold/70 focus:outline-none"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                {editRequiresModelGroup && (
                  <label className="block text-xs font-medium text-white/55">
                    Award type <span className="text-gold">*</span>
                    <select
                      required
                      value={editForm.model_group}
                      onChange={(event) =>
                        setEditForm({
                          ...editForm,
                          model_group: event.target.value,
                        })
                      }
                      className="mt-2 block h-12 w-full border border-gold/40 bg-[#0b0b0b] px-4 text-sm text-white transition-colors focus:border-gold focus:outline-none"
                    >
                      <option value="">Select award type</option>
                      {SPECIAL_MODEL_GROUPS.map((group) => (
                        <option key={group.code} value={group.code}>
                          {group.code} — {group.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="block text-xs font-medium text-white/55">
                  Material
                  <input
                    value={editForm.material}
                    onChange={(event) =>
                      setEditForm({ ...editForm, material: event.target.value })
                    }
                    className="mt-2 block h-12 w-full border border-white/10 bg-white/[0.035] px-4 text-sm text-white transition-colors focus:border-gold/70 focus:outline-none"
                  />
                </label>
                <label className="block text-xs font-medium text-white/55 md:col-span-2">
                  Description
                  <textarea
                    rows={4}
                    value={editForm.description}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        description: event.target.value,
                      })
                    }
                    className="mt-2 block w-full resize-none border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-white transition-colors focus:border-gold/70 focus:outline-none"
                  />
                </label>
              </div>

              <div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex cursor-pointer items-center gap-3 text-sm text-white/60">
                  <input
                    type="checkbox"
                    checked={editForm.in_stock}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        in_stock: event.target.checked,
                      })
                    }
                    className="h-4 w-4 accent-[#d4af37]"
                  />
                  Product is in stock
                </label>
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    disabled={updating}
                    className="border border-white/15 px-5 py-3 text-xs uppercase tracking-wider text-white/55 transition-colors hover:border-white/35 hover:text-white disabled:opacity-40"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="min-w-40 bg-gold px-5 py-3 text-xs font-bold uppercase tracking-wider text-darkbg transition-colors hover:bg-gold/90 disabled:opacity-50"
                  >
                    {updating
                      ? "Updating..."
                      : quickEdit
                        ? "Save & Next"
                        : "Update Product"}
                  </button>
                </div>
              </div>
              <p className="mt-3 text-right text-[10px] text-white/25">
                {quickEdit
                  ? "Press Enter to save & open next · Esc to close"
                  : "Press Enter to save · Esc to close"}
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageProducts;
