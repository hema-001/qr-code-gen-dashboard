"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import FileInput from "@/components/form/input/FileInput";
import TextArea from "@/components/form/input/TextArea";
import { Modal } from "@/components/ui/modal";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  PlusIcon,
  PencilIcon,
  TrashBinIcon,
  Search,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon
} from "@/icons";
import Label from "@/components/form/Label";
import Image from "next/image";

interface Product {
  id: number;
  brand_id: number;
  model_name: string;
  category: string;
  image_url: string;
  attributes: any;
  createdAt?: string;
  updatedAt?: string;
  Brand?: {
    id: number;
    name: string;
  };
}

interface Brand {
  id: number;
  name: string;
}

export default function ProductsPage() {
  const t = useTranslations("Products");
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Selected Product for Edit/Delete
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form State
  const [brandId, setBrandId] = useState("");
  const [modelName, setModelName] = useState("");
  const [category, setCategory] = useState("");
  const [flavor, setFlavor] = useState("");
  const [mg, setMg] = useState("");
  const [codeType, setCodeType] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageError(null);
    
    if (file) {
      if (file.size > MAX_IMAGE_SIZE) {
        setImageError(t("imageSizeError"));
        setImageFile(null);
        e.target.value = ""; // Reset the input
        return;
      }
      
      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(file.type)) {
        setImageError(t("imageTypeError"));
        setImageFile(null);
        e.target.value = "";
        return;
      }
    }
    
    setImageFile(file);
  };

  useEffect(() => {
    if (token) {
      fetchProducts(currentPage);
      fetchBrands();
    }
  }, [token, currentPage]);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const fetchBrands = async () => {
    try {
      const response = await fetch("/api/v1/admin/brands", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setBrands(data);
      }
    } catch (err) {
      console.error("Failed to fetch brands", err);
    }
  };

  const fetchProducts = async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/admin/products?page=${page}&limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let errorMessage = t("fetchError");
        if (response.status === 401 || response.status === 403) {
          errorMessage = t("unauthorizedError", { action: "view" });
        } else if (response.status === 404) {
          errorMessage = t("notFoundError");
        } else if (response.status >= 500) {
          errorMessage = t("serverError", { action: "fetching" });
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setProducts(data.products);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      setCurrentPage(data.currentPage);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching products");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredProducts = products.filter((product) =>
    product.model_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.Brand?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.attributes && JSON.stringify(product.attributes).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setBrandId("");
    setModelName("");
    setCategory("");
    setFlavor("");
    setMg("");
    setCodeType("");
    setImageFile(null);
    setImageError(null);
    setFormError(null);
  };

  // Add Product Handlers
  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleAddProduct = async () => {
    if (!brandId || !modelName.trim() || !category.trim() || !flavor.trim() || !mg.trim() || !codeType || !imageFile) {
      setFormError(t("requiredFields"));
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const formData = new FormData();
      formData.append("brand_id", brandId);
      formData.append("model_name", modelName);
      formData.append("category", category);
      formData.append("attributes", JSON.stringify({
        flavor: flavor,
        mg: mg,
        code_type: codeType,
      }));

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const response = await fetch("/api/v1/admin/products", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t("createError"));
      }

      await fetchProducts(currentPage);
      setIsAddModalOpen(false);
      showSuccess(t("productCreatedSuccess"));
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Product Handlers
  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setBrandId(product.brand_id.toString());
    setModelName(product.model_name);
    setCategory(product.category);
    setFlavor(product.attributes?.flavor || "");
    setMg(product.attributes?.mg || "");
    setCodeType(product.attributes?.code_type || "");
    setImageFile(null);
    setImageError(null);
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleEditProduct = async () => {
    if (!selectedProduct) return;
    if (!brandId || !modelName.trim() || !category.trim() || !flavor.trim() || !mg.trim() || !codeType) {
      setFormError(t("requiredFields"));
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const formData = new FormData();
      formData.append("brand_id", brandId);
      formData.append("model_name", modelName);
      formData.append("category", category);
      formData.append("attributes", JSON.stringify({
        flavor: flavor,
        mg: mg,
        code_type: codeType,
      }));

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const response = await fetch(`/api/v1/admin/products/${selectedProduct.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t("updateError"));
      }

      await fetchProducts(currentPage);
      setIsEditModalOpen(false);
      showSuccess(t("productUpdatedSuccess"));
      setSelectedProduct(null);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Product Handlers
  const openDeleteModal = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/v1/admin/products/${selectedProduct.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t("deleteError"));
      }

      await fetchProducts(currentPage);
      setIsDeleteModalOpen(false);
      showSuccess(t("productDeletedSuccess"));
      setSelectedProduct(null);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const brandOptions = brands.map(b => ({ value: b.id.toString(), label: b.name }));

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button
          key={i}
          variant={currentPage === i ? "primary" : "outline"}
          size="sm"
          onClick={() => setCurrentPage(i)}
          className={`w-8 h-8 p-0 ${currentPage === i ? "" : "text-gray-600 dark:text-gray-400"}`}
        >
          {i}
        </Button>
      );
    }
    return buttons;
  };

  return (
    <div className="container mx-auto py-8">
      <PageBreadcrumb pageTitle={t("title")} />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:w-72 relative">
            <div className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Search className="h-5 w-5" />
            </div>
          <Input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={handleSearch}
            className="w-full pl-11 rtl:pl-4 rtl:pr-11"
          />
        </div>
        <Button aria-label={t("addProduct")} onClick={openAddModal} startIcon={<PlusIcon />}>
          {t("addProduct")}
        </Button>
      </div>

      {successMessage && (
        <div className="mb-4 rounded-lg bg-success-50 p-4 text-sm text-success-800 dark:bg-success-900/30 dark:text-success-400">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-error-50 p-4 text-sm text-error-800 dark:bg-error-900/30 dark:text-error-400">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-gray-800">
            <TableRow>
              <TableCell isHeader className="px-6 py-3 text-left rtl:text-right font-medium text-gray-500 dark:text-gray-400">
                {t("image")}
              </TableCell>
              <TableCell isHeader className="px-6 py-3 text-left rtl:text-right font-medium text-gray-500 dark:text-gray-400">
                {t("modelName")}
              </TableCell>
              <TableCell isHeader className="px-6 py-3 text-left rtl:text-right font-medium text-gray-500 dark:text-gray-400">
                {t("brand")}
              </TableCell>
              <TableCell isHeader className="px-6 py-3 text-left rtl:text-right font-medium text-gray-500 dark:text-gray-400">
                {t("category")}
              </TableCell>
              <TableCell isHeader className="px-6 py-3 text-left rtl:text-right font-medium text-gray-500 dark:text-gray-400">
                {t("flavor")}
              </TableCell>
              <TableCell isHeader className="px-6 py-3 text-left rtl:text-right font-medium text-gray-500 dark:text-gray-400">
                {t("mg")}
                </TableCell>
                <TableCell isHeader className="px-6 py-3 text-left rtl:text-right font-medium text-gray-500 dark:text-gray-400">
                {t("codeType")}
                </TableCell>
              <TableCell isHeader className="px-6 py-3 text-right rtl:text-left font-medium text-gray-500 dark:text-gray-400">
                {t("actions")}
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell className="px-6 py-4 text-center text-gray-500 col-span-7">
                  {t("loading")}
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell className="px-6 py-4 text-center text-gray-500 col-span-7">
                  {t("noProductsFound")}
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow
                  key={product.id}
                  className="border-b border-gray-100 last:border-none hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                >
                  <TableCell className="px-6 py-4">
                    {product.image_url ? (
                        <div className="h-12 w-12 relative rounded-lg overflow-hidden">
                            <Image 
                                src={product.image_url} 
                                alt={product.model_name} 
                                fill
                                className="object-cover"
                            />
                        </div>
                    ) : (
                        <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                            {t("noImage")}
                        </div>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-800 dark:text-white/90">
                    {product.model_name}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-800 dark:text-white/90">
                    {brands.find(b => b.id === product.brand_id)?.name || product.brand_id}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-800 dark:text-white/90">
                    {product.category}
                  </TableCell>
                    <TableCell className="px-6 py-4 text-gray-800 dark:text-white/90">
                    {product.attributes?.flavor || "-"}
                  </TableCell>
                    <TableCell className="px-6 py-4 text-gray-800 dark:text-white/90">
                    {product.attributes?.mg || "-"}
                  </TableCell>
                    <TableCell className="px-6 py-4 text-gray-800 dark:text-white/90">
                    {product.attributes?.code_type || "-"}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right rtl:text-left">
                    <div className="flex items-center justify-end rtl:justify-start gap-2">
                      <button
                        title={t("editProduct")}
                        aria-label={t("editProduct")}
                        onClick={() => openEditModal(product)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        title={t("deleteProduct")}
                        aria-label={t("deleteProduct")}
                        onClick={() => openDeleteModal(product)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-error-500 hover:bg-error-50 hover:text-error-600 dark:text-error-400 dark:hover:bg-error-900/30 dark:hover:text-error-300"
                      >
                        <TrashBinIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination Controls */}
      <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-sm text-gray-500">
            {t("showing")} {(currentPage - 1) * limit + 1} {t("to")} {Math.min(currentPage * limit, totalItems)} {t("of")} {totalItems} {t("entries")}
        </div>
        <div className="flex items-center gap-2">
            <Button 
                variant="outline" 
                size="sm"
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(1)}
                aria-label={t("firstPage")}
                className="w-8 h-8 pl-0 pr-0 pb-0 pt-0"
            >
                <ChevronsLeftIcon className="w-5 h-5 rtl:rotate-180" />
            </Button>
            <Button 
                variant="outline" 
                size="sm"
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                aria-label={t("previousPage")}
                className="w-8 h-8 pl-0 pr-0 pb-0 pt-0"
            >
                <ChevronLeftIcon className="w-5 h-5 rtl:rotate-180" />
            </Button>
            
            <div className="flex gap-1">
              {renderPaginationButtons()}
            </div>

            <Button 
                variant="outline" 
                size="sm"
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                aria-label={t("nextPage")}
                className="w-8 h-8 pl-0 pr-0 pb-0 pt-0"
            >
                <ChevronRightIcon className="w-5 h-5 rtl:rotate-180" />
            </Button>
            <Button 
                variant="outline" 
                size="sm"
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(totalPages)}
                aria-label={t("lastPage")}
                className="w-8 h-8 pl-0 pr-0 pb-0 pt-0"
            >
                <ChevronsRightIcon className="w-5 h-5 rtl:rotate-180" />
            </Button>
        </div>
      </div>

      {/* Add Product Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        className="max-w-[600px] p-6"
      >
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          {t("addNewProduct")}
        </h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="brandId">{t("brand")} <span className="text-error-500">*</span></Label>
            <Select
              options={brandOptions}
              placeholder={t("selectBrand")}
              onChange={(value) => setBrandId(value)}
              defaultValue={brandId}
            />
          </div>
          <div>
            <Label htmlFor="modelName">{t("modelName")} <span className="text-error-500">*</span></Label>
            <Input
              id="modelName"
              type="text"
              placeholder={t("enterModelName")}
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="category">{t("category")} <span className="text-error-500">*</span></Label>
            <Input
              id="category"
              type="text"
              placeholder={t("enterCategory")}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="image">{t("imageLabel")} <span className="text-error-500">*</span></Label>
            <FileInput
              onChange={handleImageChange}
              accept="image/jpeg,image/png,image/gif,image/webp"
            />
            {imageError && (
              <p className="mt-1 text-sm text-error-500">{imageError}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t("imageSizeHint")}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="flavor">{t("flavor")} <span className="text-error-500">*</span></Label>
              <Input
                id="flavor"
                type="text"
                placeholder={t("enterFlavor")}
                value={flavor}
                onChange={(e) => setFlavor(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="mg">{t("mg")} <span className="text-error-500">*</span></Label>
              <Input
                id="mg"
                type="number"
                placeholder={t("enterMg")}
                value={mg}
                onChange={(e) => setMg(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="codeType">{t("codeType")} <span className="text-error-500">*</span></Label>
              <Select
                options={[
                  { value: "box", label: t("codeTypeBox") },
                  { value: "sticker", label: t("codeTypeSticker") },
                  { value: "cap", label: t("codeTypeCap") },
                ]}
                placeholder={t("selectCodeType")}
                onChange={(value) => setCodeType(value)}
                defaultValue={codeType}
              />
            </div>
          </div>
          
          {formError && (
            <div className="text-sm text-error-500">{formError}</div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
            >
              {t("cancel")}
            </Button>
            <Button onClick={handleAddProduct} disabled={isSubmitting}>
              {isSubmitting ? t("adding") : t("addProduct")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        className="max-w-[600px] p-6"
      >
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          {t("editProductTitle")}
        </h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="editBrandId">{t("brand")} <span className="text-error-500">*</span></Label>
            <Select
              options={brandOptions}
              placeholder={t("selectBrand")}
              onChange={(value) => setBrandId(value)}
              defaultValue={brandId}
            />
          </div>
          <div>
            <Label htmlFor="editModelName">{t("modelName")} <span className="text-error-500">*</span></Label>
            <Input
              id="editModelName"
              type="text"
              placeholder={t("enterModelName")}
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="editCategory">{t("category")} <span className="text-error-500">*</span></Label>
            <Input
              id="editCategory"
              type="text"
              placeholder={t("enterCategory")}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="editImage">{t("imageKeepCurrent")}</Label>
            <FileInput
              onChange={handleImageChange}
              accept="image/jpeg,image/png,image/gif,image/webp"
            />
            {imageError && (
              <p className="mt-1 text-sm text-error-500">{imageError}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t("imageSizeHint")}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="editFlavor">{t("flavor")} <span className="text-error-500">*</span></Label>
              <Input
                id="editFlavor"
                type="text"
                placeholder={t("enterFlavor")}
                value={flavor}
                onChange={(e) => setFlavor(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="editMg">{t("mg")} <span className="text-error-500">*</span></Label>
              <Input
                id="editMg"
                type="number"
                placeholder={t("enterMg")}
                value={mg}
                onChange={(e) => setMg(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="editCodeType">{t("codeType")} <span className="text-error-500">*</span></Label>
              <Select
                options={[
                  { value: "box", label: t("codeTypeBox") },
                  { value: "sticker", label: t("codeTypeSticker") },
                  { value: "cap", label: t("codeTypeCap") },
                ]}
                placeholder={t("selectCodeType")}
                onChange={(value) => setCodeType(value)}
                defaultValue={codeType}
              />
            </div>
          </div>

          {formError && (
            <div className="text-sm text-error-500">{formError}</div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSubmitting}
            >
              {t("cancel")}
            </Button>
            <Button onClick={handleEditProduct} disabled={isSubmitting}>
              {isSubmitting ? t("saving") : t("save")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        className="max-w-[500px] p-6"
      >
        <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error-50 text-error-500 dark:bg-error-900/30 dark:text-error-400">
                <TrashBinIcon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                {t("deleteProductTitle")}
            </h3>
        </div>
        
        <p className="mb-6 text-gray-500 dark:text-gray-400">
          {t("deleteConfirmation")} <strong>{selectedProduct?.attributes.flavor} - {selectedProduct?.attributes.mg}MG - {selectedProduct?.attributes.code_type}</strong>? <br />
          {t("deleteWarning")}
        </p>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setIsDeleteModalOpen(false)}
            disabled={isSubmitting}
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleDeleteProduct}
            disabled={isSubmitting}
            className="bg-error-600 hover:bg-error-700 text-white"
          >
            {isSubmitting ? t("deleting") : t("delete")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}