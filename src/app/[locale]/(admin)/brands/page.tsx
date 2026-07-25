"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import SearchableSelect from "@/components/form/SearchableSelect";
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
  Search
} from "@/icons";
import Label from "@/components/form/Label";

interface BrandAttributeType {
  id: number;
  key: string;
  label: string;
  data_type: string;
}

interface UserOption {
  id: number;
  username: string;
}

interface AttributeSelection {
  id: number;
  required: boolean;
}

interface Brand {
  id: number;
  name: string;
  generator_type?: string;
  manager?: { id: number; username: string };
  attributes?: { id: number; key: string; label: string; data_type: string; required: boolean }[];
  createdAt?: string;
  updatedAt?: string;
}

const GENERATOR_TYPES = [
  { value: "tokyoejuice", label: "Tokyo E-Juice" },
  { value: "vgod", label: "VGOD" },
];

export default function BrandsPage() {
  const t = useTranslations("Brands");
  const { token } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Supporting data
  const [availableUsers, setAvailableUsers] = useState<UserOption[]>([]);
  const [availableAttrTypes, setAvailableAttrTypes] = useState<BrandAttributeType[]>([]);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Selected Brand for Edit/Delete
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

  // Form State
  const [brandName, setBrandName] = useState("");
  const [brandManagerId, setBrandManagerId] = useState("");
  const [generatorType, setGeneratorType] = useState("");
  const [selectedAttributes, setSelectedAttributes] = useState<AttributeSelection[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (token) {
      fetchBrands();
      fetchUsers();
      fetchAttributeTypes();
    }
  }, [token]);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const fetchBrands = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/brands", {
        headers: { Authorization: `Bearer ${token}` },
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
      setBrands(data);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching brands");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableUsers(Array.isArray(data) ? data : (data.users ?? []));
      }
    } catch {
      // users list is optional — silently ignore failures
    }
  };

  const fetchAttributeTypes = async () => {
    try {
      const response = await fetch("/api/brand-attribute-types", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableAttrTypes(Array.isArray(data) ? data : (data.attributeTypes ?? []));
      }
    } catch {
      // attribute types list is optional — silently ignore failures
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Attribute selection helpers
  const toggleAttribute = (id: number) => {
    setSelectedAttributes((prev) => {
      const exists = prev.find((a) => a.id === id);
      if (exists) return prev.filter((a) => a.id !== id);
      return [...prev, { id, required: false }];
    });
  };

  const toggleRequired = (id: number) => {
    setSelectedAttributes((prev) =>
      prev.map((a) => (a.id === id ? { ...a, required: !a.required } : a))
    );
  };

  const isAttrSelected = (id: number) => selectedAttributes.some((a) => a.id === id);
  const isAttrRequired = (id: number) => selectedAttributes.find((a) => a.id === id)?.required ?? false;

  const resetForm = () => {
    setBrandName("");
    setBrandManagerId("");
    setGeneratorType("");
    setSelectedAttributes([]);
    setFormError(null);
  };

  // Add Brand Handlers
  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const buildPayload = () => ({
    name: brandName,
    ...(brandManagerId ? { brand_manager_id: Number(brandManagerId) } : {}),
    ...(generatorType ? { generator_type: generatorType } : {}),
    attributes: selectedAttributes,
  });

  const handleAddBrand = async () => {
    if (!brandName.trim()) {
      setFormError(t("brandNameRequired"));
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    try {
      const response = await fetch("/api/brands", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(buildPayload()),
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
        } else if (response.status >= 500) {
          errorMessage = t("serverError", { action: "creating" });
        } else if (response.status >= 400) {
          errorMessage = t("requestError", { action: "creating" });
        }
        throw new Error(errorMessage);
      }
      await fetchBrands();
      setIsAddModalOpen(false);
      showSuccess(t("brandCreatedSuccess"));
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Brand Handlers
  const openEditModal = (brand: Brand) => {
    setSelectedBrand(brand);
    setBrandName(brand.name);
    setBrandManagerId(brand.manager?.id?.toString() ?? "");
    setGeneratorType(brand.generator_type ?? "");
    setSelectedAttributes(
      (brand.attributes ?? []).map((a) => ({ id: a.id, required: a.required }))
    );
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleEditBrand = async () => {
    if (!selectedBrand) return;
    if (!brandName.trim()) {
      setFormError(t("brandNameRequired"));
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    try {
      const response = await fetch(`/api/brands/${selectedBrand.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(buildPayload()),
      });
      if (!response.ok) {
        let errorMessage = t("updateError");
        if (response.status === 401 || response.status === 403) {
          errorMessage = t("unauthorizedError", { action: "update" });
        } else if (response.status === 404) {
          errorMessage = t("notFoundError");
        } else if (response.status >= 500) {
          errorMessage = t("serverError", { action: "updating" });
        } else if (response.status >= 400) {
          errorMessage = t("requestError", { action: "updating" });
        }
        throw new Error(errorMessage);
      }
      await fetchBrands();
      setIsEditModalOpen(false);
      showSuccess(t("brandUpdatedSuccess"));
      setSelectedBrand(null);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Brand Handlers
  const openDeleteModal = (brand: Brand) => {
    setSelectedBrand(brand);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteBrand = async () => {
    if (!selectedBrand) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/brands/${selectedBrand.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
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
      await fetchBrands();
      setIsDeleteModalOpen(false);
      showSuccess(t("brandDeletedSuccess"));
      setSelectedBrand(null);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const userSelectOptions = availableUsers.map((u) => ({
    value: u.id.toString(),
    label: u.username,
  }));

  // Shared form field JSX — called as a function, not a component, to avoid re-mount on re-render
  const renderBrandFormFields = () => (
    <div className="space-y-4">
      {/* Brand Name */}
      <div>
        <Label htmlFor="brandName">{t("brandName")} *</Label>
        <Input
          id="brandName"
          type="text"
          placeholder={t("enterBrandName")}
          value={brandName}
          onChange={(e) => setBrandName(e.target.value)}
          error={!!formError && !brandName.trim()}
          hint={(!brandName.trim() && formError) ? formError : ""}
        />
      </div>

      {/* Brand Manager */}
      <div>
        <Label>{t("brandManager")}</Label>
        <SearchableSelect
          options={userSelectOptions}
          onChange={setBrandManagerId}
          defaultValue={brandManagerId}
          placeholder={t("selectBrandManager")}
        />
      </div>

      {/* Generator Type */}
      <div>
        <Label>{t("generatorType")}</Label>
        <Select
          options={GENERATOR_TYPES}
          onChange={setGeneratorType}
          defaultValue={generatorType}
          placeholder={t("selectGeneratorType")}
        />
      </div>

      {/* Authentication Attributes */}
      {availableAttrTypes.length > 0 && (
        <div>
          <Label>{t("authAttributes")}</Label>
          <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
            {availableAttrTypes.map((attr) => {
              const selected = isAttrSelected(attr.id);
              return (
                <div
                  key={attr.id}
                  className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleAttribute(attr.id)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {attr.label}
                      <span className="ml-1 text-xs text-gray-400">({attr.data_type})</span>
                    </span>
                  </label>
                  {selected && (
                    <label className="flex items-center gap-1.5 cursor-pointer ml-4 shrink-0">
                      <input
                        type="checkbox"
                        checked={isAttrRequired(attr.id)}
                        onChange={() => toggleRequired(attr.id)}
                        className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400">{t("required")}</span>
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {formError && <div className="text-sm text-error-500">{formError}</div>}
    </div>
  );

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
        <Button aria-label={t("addBrand")} onClick={openAddModal} startIcon={<PlusIcon />}>
          {t("addBrand")}
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
                {t("name")}
              </TableCell>
              <TableCell isHeader className="px-6 py-3 text-left rtl:text-right font-medium text-gray-500 dark:text-gray-400">
                {t("brandManager")}
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
            ) : filteredBrands.length === 0 ? (
              <TableRow>
                <TableCell className="px-6 py-4 text-center text-gray-500">
                  {t("noBrandsFound")}
                </TableCell>
              </TableRow>
            ) : (
              filteredBrands.map((brand) => (
                <TableRow
                  key={brand.id}
                  className="border-b border-gray-100 last:border-none hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                >
                  <TableCell className="px-6 py-4 text-gray-800 dark:text-white/90">
                    {brand.name}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-400">
                    {brand.manager?.username ?? "—"}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right rtl:text-left">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        title={t("editBrand")}
                        aria-label={t("editBrand")}
                        onClick={() => openEditModal(brand)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        title={t("deleteBrand")}
                        aria-label={t("deleteBrand")}
                        onClick={() => openDeleteModal(brand)}
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

      {/* Add Brand Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        className="max-w-[640px] p-6"
      >
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          {t("addNewBrand")}
        </h3>
        {renderBrandFormFields()}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>
            {t("cancel")}
          </Button>
          <Button onClick={handleAddBrand} disabled={isSubmitting}>
            {isSubmitting ? t("adding") : t("addBrand")}
          </Button>
        </div>
      </Modal>

      {/* Edit Brand Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        className="max-w-[640px] p-6"
      >
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          {t("editBrandTitle")}
        </h3>
        {renderBrandFormFields()}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting}>
            {t("cancel")}
          </Button>
          <Button onClick={handleEditBrand} disabled={isSubmitting}>
            {isSubmitting ? t("saving") : t("save")}
          </Button>
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
            {t("deleteBrandTitle")}
          </h3>
        </div>
        <p className="mb-6 text-gray-500 dark:text-gray-400">
          {t("deleteConfirmation")} <strong>{selectedBrand?.name}</strong>?{" "}
          {t("deleteWarning")}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isSubmitting}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleDeleteBrand}
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
