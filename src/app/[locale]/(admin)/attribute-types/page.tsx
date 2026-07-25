"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import { Modal } from "@/components/ui/modal";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { PlusIcon, PencilIcon, TrashBinIcon, Search } from "@/icons";
import Label from "@/components/form/Label";

interface AttributeType {
  id: number;
  key: string;
  label: string;
  data_type: string;
  description?: string;
}

const DATA_TYPE_OPTIONS = [
  { value: "string", label: "String" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "select", label: "Select" },
];

export default function AttributeTypesPage() {
  const t = useTranslations("AttributeTypes");
  const { token, user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const [attributeTypes, setAttributeTypes] = useState<AttributeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedType, setSelectedType] = useState<AttributeType | null>(null);

  // Form State
  const [attrKey, setAttrKey] = useState("");
  const [attrLabel, setAttrLabel] = useState("");
  const [attrDataType, setAttrDataType] = useState("string");
  const [attrDescription, setAttrDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (token) fetchAttributeTypes();
  }, [token]);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const fetchAttributeTypes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/brand-attribute-types", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(t("fetchError"));
      const data = await response.json();
      setAttributeTypes(Array.isArray(data) ? data : (data.attributeTypes ?? []));
    } catch (err: any) {
      setError(err.message || t("fetchError"));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAttrKey("");
    setAttrLabel("");
    setAttrDataType("string");
    setAttrDescription("");
    setFormError(null);
  };

  const validateForm = (): boolean => {
    if (!attrKey.trim() || !attrLabel.trim()) {
      setFormError(t("requiredFields"));
      return false;
    }
    return true;
  };

  // Add Handlers
  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleAdd = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      const response = await fetch("/api/brand-attribute-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          key: attrKey.trim(),
          label: attrLabel.trim(),
          data_type: attrDataType,
          description: attrDescription.trim() || undefined,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t("createError"));
      }
      await fetchAttributeTypes();
      setIsAddModalOpen(false);
      showSuccess(t("createSuccess"));
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Handlers
  const openEditModal = (type: AttributeType) => {
    setSelectedType(type);
    setAttrKey(type.key);
    setAttrLabel(type.label);
    setAttrDataType(type.data_type);
    setAttrDescription(type.description ?? "");
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleEdit = async () => {
    if (!selectedType) return;
    if (!validateForm()) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      const response = await fetch(`/api/brand-attribute-types/${selectedType.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          key: attrKey.trim(),
          label: attrLabel.trim(),
          data_type: attrDataType,
          description: attrDescription.trim() || undefined,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t("updateError"));
      }
      await fetchAttributeTypes();
      setIsEditModalOpen(false);
      showSuccess(t("updateSuccess"));
      setSelectedType(null);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Handlers
  const openDeleteModal = (type: AttributeType) => {
    setSelectedType(type);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedType) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/brand-attribute-types/${selectedType.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t("deleteError"));
      }
      await fetchAttributeTypes();
      setIsDeleteModalOpen(false);
      showSuccess(t("deleteSuccess"));
      setSelectedType(null);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTypes = attributeTypes.filter(
    (type) =>
      type.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      type.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      type.data_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (type.description ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderAttributeTypeForm = () => (
    <div className="space-y-4">
      <div>
        <Label>{t("key")} *</Label>
        <Input
          type="text"
          placeholder={t("keyPlaceholder")}
          value={attrKey}
          onChange={(e) => setAttrKey(e.target.value)}
          error={!!formError && !attrKey.trim()}
        />
      </div>
      <div>
        <Label>{t("label")} *</Label>
        <Input
          type="text"
          placeholder={t("labelPlaceholder")}
          value={attrLabel}
          onChange={(e) => setAttrLabel(e.target.value)}
          error={!!formError && !attrLabel.trim()}
        />
      </div>
      <div>
        <Label>{t("dataType")}</Label>
        <Select
          options={DATA_TYPE_OPTIONS}
          onChange={setAttrDataType}
          defaultValue={attrDataType}
        />
      </div>
      <div>
        <Label>{t("description")}</Label>
        <Input
          type="text"
          placeholder={t("descriptionPlaceholder")}
          value={attrDescription}
          onChange={(e) => setAttrDescription(e.target.value)}
        />
      </div>
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
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 rtl:pl-4 rtl:pr-11"
          />
        </div>
        {isSuperAdmin && (
          <Button onClick={openAddModal} startIcon={<PlusIcon />}>
            {t("addType")}
          </Button>
        )}
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
              <TableCell isHeader className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                {t("key")}
              </TableCell>
              <TableCell isHeader className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                {t("label")}
              </TableCell>
              <TableCell isHeader className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                {t("dataType")}
              </TableCell>
              <TableCell isHeader className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                {t("description")}
              </TableCell>
              {isSuperAdmin && (
                <TableCell isHeader className="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                  {t("actions")}
                </TableCell>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell className="px-6 py-4 text-center text-gray-500">
                  {t("loading")}
                </TableCell>
              </TableRow>
            ) : filteredTypes.length === 0 ? (
              <TableRow>
                <TableCell className="px-6 py-4 text-center text-gray-500">
                  {t("noTypesFound")}
                </TableCell>
              </TableRow>
            ) : (
              filteredTypes.map((type) => (
                <TableRow
                  key={type.id}
                  className="border-b border-gray-100 last:border-none hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                >
                  <TableCell className="px-6 py-4 font-mono text-sm text-gray-800 dark:text-white/90">
                    {type.key}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-800 dark:text-white/90">
                    {type.label}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-400">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {type.data_type}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm">
                    {type.description ?? "—"}
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          title={t("editType")}
                          aria-label={t("editType")}
                          onClick={() => openEditModal(type)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          title={t("deleteType")}
                          aria-label={t("deleteType")}
                          onClick={() => openDeleteModal(type)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-error-500 hover:bg-error-50 hover:text-error-600 dark:text-error-400 dark:hover:bg-error-900/30 dark:hover:text-error-300"
                        >
                          <TrashBinIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} className="max-w-[500px] p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">{t("addNewType")}</h3>
        {renderAttributeTypeForm()}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>
            {t("cancel")}
          </Button>
          <Button onClick={handleAdd} disabled={isSubmitting}>
            {isSubmitting ? t("adding") : t("addType")}
          </Button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} className="max-w-[500px] p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">{t("editTypeTitle")}</h3>
        {renderAttributeTypeForm()}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting}>
            {t("cancel")}
          </Button>
          <Button onClick={handleEdit} disabled={isSubmitting}>
            {isSubmitting ? t("saving") : t("save")}
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} className="max-w-[500px] p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error-50 text-error-500 dark:bg-error-900/30 dark:text-error-400">
            <TrashBinIcon className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{t("deleteTypeTitle")}</h3>
        </div>
        <p className="mb-6 text-gray-500 dark:text-gray-400">
          {t("deleteConfirmation")} <strong>{selectedType?.label}</strong> ({selectedType?.key})?{" "}
          {t("deleteWarning")}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isSubmitting}>
            {t("cancel")}
          </Button>
          <Button onClick={handleDelete} disabled={isSubmitting} className="bg-error-600 hover:bg-error-700 text-white">
            {isSubmitting ? t("deleting") : t("delete")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
