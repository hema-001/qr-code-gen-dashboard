"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
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
  ChevronsRightIcon,
} from "@/icons";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import { useRouter } from "next/navigation";

interface Brand {
  id: number;
  name: string;
}

interface Url {
  id: number;
  url: string;
  name: string;
  description: string | null;
  is_active: boolean;
  brand_id: number | null;
  brand?: Brand | null;
  created_at?: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function UrlsPage() {
  const t = useTranslations("Urls");
  const { token, user } = useAuth();
  const router = useRouter();
  const [urls, setUrls] = useState<Url[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Pagination State
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Selected URL for Edit/Delete
  const [selectedUrl, setSelectedUrl] = useState<Url | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    url: "",
    name: "",
    description: "",
    is_active: true,
    brand_id: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user is super_admin
  useEffect(() => {
    if (user && user.role !== "super_admin") {
      router.push("/");
    }
  }, [user, router]);

  useEffect(() => {
    if (token && user?.role === "super_admin") {
      fetchUrls(pagination.page);
      fetchBrands();
    }
  }, [token, user]);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const fetchUrls = async (page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/urls?page=${page}&limit=${pagination.limit}`, {
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
        } else if (response.status >= 400) {
          errorMessage = t("requestError", { action: "fetching" });
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      // Handle paginated response { urls: [...], pagination: {...} }
      const urlsArray = Array.isArray(data) ? data : (data.urls || []);
      setUrls(urlsArray);
      
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching URLs");
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await fetch("/api/brands", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBrands(data);
      }
    } catch (err) {
      console.error("Failed to fetch brands:", err);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredUrls = urls.filter(
    (url) =>
      url.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      url.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (url.description && url.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const resetForm = () => {
    setFormData({
      url: "",
      name: "",
      description: "",
      is_active: true,
      brand_id: "",
    });
    setFormError(null);
  };

  // Add URL Handlers
  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleAddUrl = async () => {
    if (!formData.name.trim()) {
      setFormError(t("nameRequired"));
      return;
    }
    if (!formData.url.trim()) {
      setFormError(t("urlRequired"));
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const body: any = {
        name: formData.name,
        url: formData.url,
        description: formData.description || null,
        is_active: formData.is_active,
      };
      if (formData.brand_id) {
        body.brand_id = parseInt(formData.brand_id);
      }

      const response = await fetch("/api/urls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let errorMessage = t("createError");
        if (response.status === 400) {
          const errorData = await response.json();
          errorMessage = errorData.errors?.[0]?.msg || t("invalidDataError");
        } else if (response.status === 401 || response.status === 403) {
          errorMessage = t("unauthorizedError", { action: "create" });
        } else if (response.status === 404) {
          errorMessage = t("notFoundError");
        } else if (response.status === 409) {
          errorMessage = t("urlExistsError");
        } else if (response.status >= 500) {
          errorMessage = t("serverError", { action: "creating" });
        } else if (response.status >= 400) {
          errorMessage = t("requestError", { action: "creating" });
        }
        throw new Error(errorMessage);
      }

      await fetchUrls(1);
      setIsAddModalOpen(false);
      showSuccess(t("urlCreatedSuccess"));
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit URL Handlers
  const openEditModal = (url: Url) => {
    setSelectedUrl(url);
    setFormData({
      url: url.url,
      name: url.name,
      description: url.description || "",
      is_active: url.is_active,
      brand_id: url.brand_id?.toString() || "",
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleEditUrl = async () => {
    if (!selectedUrl) return;
    if (!formData.name.trim()) {
      setFormError(t("nameRequired"));
      return;
    }
    if (!formData.url.trim()) {
      setFormError(t("urlRequired"));
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const body: any = {
        name: formData.name,
        url: formData.url,
        description: formData.description || null,
        is_active: formData.is_active,
      };
      if (formData.brand_id) {
        body.brand_id = parseInt(formData.brand_id);
      } else {
        body.brand_id = null;
      }

      const response = await fetch(`/api/urls/${selectedUrl.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let errorMessage = t("updateError");
        if (response.status === 401 || response.status === 403) {
          errorMessage = t("unauthorizedError", { action: "update" });
        } else if (response.status === 404) {
          errorMessage = t("notFoundError");
        } else if (response.status >= 500) {
          errorMessage = t("serverError", { action: "updating" });
        } else if (response.status === 409) {
          errorMessage = t("urlExistsError");
        } else if (response.status >= 400) {
          errorMessage = t("requestError", { action: "updating" });
        }
        throw new Error(errorMessage);
      }

      await fetchUrls(pagination.page);
      setIsEditModalOpen(false);
      showSuccess(t("urlUpdatedSuccess"));
      setSelectedUrl(null);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete URL Handlers
  const openDeleteModal = (url: Url) => {
    setSelectedUrl(url);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteUrl = async () => {
    if (!selectedUrl) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/urls/${selectedUrl.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let errorMessage = t("deleteError");
        if (response.status === 401 || response.status === 403) {
          errorMessage = t("unauthorizedError", { action: "delete" });
        } else if (response.status === 404) {
          errorMessage = t("notFoundError");
        } else if (response.status >= 500) {
          errorMessage = t("serverError", { action: "deleting" });
        } else if (response.status >= 400) {
          errorMessage = t("requestError", { action: "deleting" });
        }
        throw new Error(errorMessage);
      }

      await fetchUrls(pagination.page);
      setIsDeleteModalOpen(false);
      showSuccess(t("urlDeletedSuccess"));
      setSelectedUrl(null);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBrandName = (url: Url) => {
    // Use embedded brand object from API response
    if (url.brand?.name) {
      return url.brand.name;
    }
    // Fallback to looking up from brands list
    if (!url.brand_id) return "-";
    const brand = brands.find((b) => b.id === url.brand_id);
    return brand?.name || "-";
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchUrls(newPage);
    }
  };

  // Redirect if not super_admin
  if (user && user.role !== "super_admin") {
    return null;
  }

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
        <Button aria-label={t("addUrl")} onClick={openAddModal} startIcon={<PlusIcon />}>
          {t("addUrl")}
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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="px-6 py-3 text-left rtl:text-right font-medium text-gray-500 dark:text-gray-400">
                  {t("name")}
                </TableCell>
                <TableCell isHeader className="px-6 py-3 text-left rtl:text-right font-medium text-gray-500 dark:text-gray-400">
                  {t("url")}
                </TableCell>
                <TableCell isHeader className="px-6 py-3 text-left rtl:text-right font-medium text-gray-500 dark:text-gray-400">
                  {t("brand")}
                </TableCell>
                <TableCell isHeader className="px-6 py-3 text-left rtl:text-right font-medium text-gray-500 dark:text-gray-400">
                  {t("status")}
                </TableCell>
                <TableCell isHeader className="px-6 py-3 text-right rtl:text-left font-medium text-gray-500 dark:text-gray-400">
                  {t("actions")}
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell className="px-6 py-4 text-center text-gray-500">
                    {t("loading")}
                  </TableCell>
                </TableRow>
              ) : filteredUrls.length === 0 ? (
                <TableRow>
                  <TableCell className="px-6 py-4 text-center text-gray-500">
                    {t("noUrlsFound")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUrls.map((url) => (
                  <TableRow
                    key={url.id}
                    className="border-b border-gray-100 last:border-none hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                  >
                    <TableCell className="px-6 py-4 text-gray-800 dark:text-white/90">
                      <div>
                        <div className="font-medium">{url.name}</div>
                        {url.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {url.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-gray-800 dark:text-white/90">
                      <div className="truncate max-w-xs" title={url.url}>
                        {url.url}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-gray-800 dark:text-white/90">
                      {getBrandName(url)}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          url.is_active
                            ? "bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {url.is_active ? t("active") : t("inactive")}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right rtl:text-left">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          title={t("editUrl")}
                          aria-label={t("editUrl")}
                          onClick={() => openEditModal(url)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          title={t("deleteUrl")}
                          aria-label={t("deleteUrl")}
                          onClick={() => openDeleteModal(url)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-error-500 hover:bg-error-50 hover:text-error-600 dark:text-error-400 dark:hover:bg-error-900/30 dark:hover:text-error-300"
                        >
                          <TrashBinIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("showing")} {((pagination.page - 1) * pagination.limit) + 1} {t("to")}{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} {t("of")}{" "}
            {pagination.total} {t("entries")}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(1)}
              disabled={pagination.page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              title={t("firstPage")}
            >
              <ChevronsLeftIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              title={t("previousPage")}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <span className="px-3 text-sm text-gray-700 dark:text-gray-300">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              title={t("nextPage")}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => handlePageChange(pagination.totalPages)}
              disabled={pagination.page === pagination.totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              title={t("lastPage")}
            >
              <ChevronsRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add URL Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        className="max-w-[600px] p-6"
      >
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          {t("addNewUrl")}
        </h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="urlName">{t("name")} *</Label>
            <Input
              id="urlName"
              type="text"
              placeholder={t("enterName")}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="urlValue">{t("url")} *</Label>
            <Input
              id="urlValue"
              type="text"
              placeholder={t("enterUrl")}
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="urlDescription">{t("description")}</Label>
            <Input
              id="urlDescription"
              type="text"
              placeholder={t("enterDescription")}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="urlBrand">{t("brand")}</Label>
            <Select
              defaultValue={formData.brand_id}
              onChange={(value) => setFormData({ ...formData, brand_id: value })}
              placeholder={t("selectBrand")}
              options={brands.map((brand) => ({
                value: brand.id.toString(),
                label: brand.name,
              }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="urlIsActive"
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            <Label htmlFor="urlIsActive" className="mb-0">{t("isActive")}</Label>
          </div>
          {formError && (
            <div className="rounded-lg bg-error-50 p-3 text-sm text-error-800 dark:bg-error-900/30 dark:text-error-400">
              {formError}
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
            >
              {t("cancel")}
            </Button>
            <Button onClick={handleAddUrl} disabled={isSubmitting}>
              {isSubmitting ? t("adding") : t("addUrl")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit URL Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        className="max-w-[600px] p-6"
      >
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          {t("editUrlTitle")}
        </h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="editUrlName">{t("name")} *</Label>
            <Input
              id="editUrlName"
              type="text"
              placeholder={t("enterName")}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="editUrlValue">{t("url")} *</Label>
            <Input
              id="editUrlValue"
              type="text"
              placeholder={t("enterUrl")}
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="editUrlDescription">{t("description")}</Label>
            <Input
              id="editUrlDescription"
              type="text"
              placeholder={t("enterDescription")}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="editUrlBrand">{t("brand")}</Label>
            <Select
              defaultValue={formData.brand_id}
              onChange={(value) => setFormData({ ...formData, brand_id: value })}
              placeholder={t("selectBrand")}
              options={brands.map((brand) => ({
                value: brand.id.toString(),
                label: brand.name,
              }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="editUrlIsActive"
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            <Label htmlFor="editUrlIsActive" className="mb-0">{t("isActive")}</Label>
          </div>
          {formError && (
            <div className="rounded-lg bg-error-50 p-3 text-sm text-error-800 dark:bg-error-900/30 dark:text-error-400">
              {formError}
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSubmitting}
            >
              {t("cancel")}
            </Button>
            <Button onClick={handleEditUrl} disabled={isSubmitting}>
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
            {t("deleteUrlTitle")}
          </h3>
        </div>

        <p className="mb-6 text-gray-500 dark:text-gray-400">
          {t("deleteConfirmation")} <strong>{selectedUrl?.name}</strong>?{" "}
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
            onClick={handleDeleteUrl}
            disabled={isSubmitting}
            className="bg-error-500 hover:bg-error-600 text-white"
          >
            {isSubmitting ? t("deleting") : t("delete")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
