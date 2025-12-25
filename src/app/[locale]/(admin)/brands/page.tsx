"use client";

import React, { useState, useEffect } from "react";
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
  Search
} from "@/icons";
import Label from "@/components/form/Label";

interface Brand {
  id: number;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function BrandsPage() {
  const { token } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Selected Brand for Edit/Delete
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

  // Form State
  const [brandName, setBrandName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (token) {
      fetchBrands();
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
      const response = await fetch("/api/v1/admin/brands", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let errorMessage = "Failed to fetch brands.";
        if (response.status === 401 || response.status === 403) {
          errorMessage = "You are not authorized to view brands. Please sign in again.";
        } else if (response.status === 404) {
          errorMessage = "The brands resource could not be found.";
        } else if (response.status >= 500) {
          errorMessage = "A server error occurred while fetching brands. Please try again later.";
        } else if (response.status >= 400) {
          errorMessage = "A request error occurred while fetching brands. Please check your input and try again.";
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

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add Brand Handlers
  const openAddModal = () => {
    setBrandName("");
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleAddBrand = async () => {
    if (!brandName.trim()) {
      setFormError("Brand name is required");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const response = await fetch("/api/v1/admin/brands", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: brandName }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to create brand.";
        if (response.status === 400) {
          const errorData = await response.json();
          errorMessage = errorData.errors[0].msg || "Invalid brand data provided.";
        }else if (response.status === 401 || response.status === 403) {
          errorMessage = "You are not authorized to create brands. Please sign in again.";
        } else if (response.status === 404) {
          errorMessage = "The brands resource could not be found.";
        } else if (response.status >= 500) {
          errorMessage = "A server error occurred while creating the brand. Please try again later.";
        } else if (response.status >= 400) {
          errorMessage = "A request error occurred while creating the brand. Please check your input and try again.";
        }
        throw new Error(errorMessage);
      }

      await fetchBrands();
      setIsAddModalOpen(false);
      showSuccess("Brand created successfully");
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
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleEditBrand = async () => {
    if (!selectedBrand) return;
    if (!brandName.trim()) {
      setFormError("Brand name is required");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const response = await fetch(`/api/v1/admin/brands/${selectedBrand.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: brandName }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to update brand.";
        if (response.status === 401 || response.status === 403) {
          errorMessage = "You are not authorized to update brands. Please sign in again.";
        } else if (response.status === 404) {
          errorMessage = "The brand resource could not be found.";
        } else if (response.status >= 500) {
          errorMessage = "A server error occurred while updating the brand. Please try again later.";
        } else if (response.status >= 400) {
          errorMessage = "A request error occurred while updating the brand. Please check your input and try again.";
        }
        throw new Error(errorMessage);
      }

      await fetchBrands();
      setIsEditModalOpen(false);
      showSuccess("Brand updated successfully");
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
      const response = await fetch(`/api/v1/admin/brands/${selectedBrand.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let errorMessage = "Failed to delete brand.";
        if (response.status === 401 || response.status === 403) {
          errorMessage = "You are not authorized to delete brands. Please sign in again.";
        } else if (response.status === 404) {
          errorMessage = "The brand resource could not be found.";
        } else if (response.status >= 500) {
          errorMessage = "A server error occurred while deleting the brand. Please try again later.";
        } else if (response.status >= 400) {
          errorMessage = "A request error occurred while deleting the brand. Please check your input and try again.";
        }
        throw new Error(errorMessage);
      }

      await fetchBrands();
      setIsDeleteModalOpen(false);
      showSuccess("Brand deleted successfully");
      setSelectedBrand(null);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <PageBreadcrumb pageTitle="Brands" />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:w-72 relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Search className="h-5 w-5" />
            </div>
          <Input
            type="text"
            placeholder="Search brands..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full pl-11"
          />
        </div>
        <Button aria-label="Add Brand" onClick={openAddModal} startIcon={<PlusIcon />}>
          Add Brand
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
              <TableCell isHeader className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                Name
              </TableCell>
              <TableCell isHeader className="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell className="px-6 py-4 text-center text-gray-500" >
                  Loading...
                </TableCell>
                <TableCell className="px-6 py-4"></TableCell>
              </TableRow>
            ) : filteredBrands.length === 0 ? (
              <TableRow>
                <TableCell className="px-6 py-4 text-center text-gray-500" >
                  No brands found
                </TableCell>
                <TableCell className="px-6 py-4"></TableCell>
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
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        title="Edit Brand"
                        aria-label="Edit Brand"
                        onClick={() => openEditModal(brand)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        title="Delete Brand"
                        aria-label="Delete Brand"
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
        className="max-w-[500px] p-6"
      >
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          Add New Brand
        </h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="brandName">Brand Name</Label>
            <Input
              id="brandName"
              type="text"
              placeholder="Enter brand name"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              error={!!formError}
              hint={formError || ""}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleAddBrand} disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Brand"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Brand Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        className="max-w-[500px] p-6"
      >
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          Edit Brand
        </h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="editBrandName">Brand Name</Label>
            <Input
              id="editBrandName"
              type="text"
              placeholder="Enter brand name"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              error={!!formError}
              hint={formError || ""}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleEditBrand} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
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
                Delete Brand
            </h3>
        </div>
        
        <p className="mb-6 text-gray-500 dark:text-gray-400">
          Are you sure you want to delete the brand <strong>{selectedBrand?.name}</strong>? 
          This action cannot be undone. All associated products and QR codes will be removed permanently.
        </p>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setIsDeleteModalOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteBrand}
            disabled={isSubmitting}
            className="bg-error-600 hover:bg-error-700 text-white"
          >
            {isSubmitting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}