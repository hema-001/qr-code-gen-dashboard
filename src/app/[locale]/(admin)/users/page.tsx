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
import {
  PlusIcon,
  PencilIcon,
  TrashBinIcon,
  Search
} from "@/icons";
import Label from "@/components/form/Label";

interface User {
  id: number;
  username: string;
  role: string;
  brand_id?: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function UsersPage() {
  const { token } = useAuth();
  const t = useTranslations("Users");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Selected User for Edit/Delete
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [brandId, setBrandId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [brands, setBrands] = useState<{id: number, name: string}[]>([]);

  const roleOptions = [
    { value: "super_admin", label: t("roleSuperAdmin") },
    { value: "admin", label: t("roleAdmin") },
    { value: "user", label: t("roleUser") },
  ];

  useEffect(() => {
    if (token) {
        fetchUsers();
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
        let errorMessage = t("fetchBrandsError");
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
        setBrands(data);
    } catch (err: any) {
        setError(err.message || t("fetchBrandsError"));
    } finally {
        setLoading(false);
    }
};

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/admin/users", {
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
          errorMessage = t("requestError");
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || t("fetchError"));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add User Handlers
  const openAddModal = () => {
    setUsername("");
    setPassword("");
    setRole("user");
    setBrandId("");
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleAddUser = async () => {
    if (!username.trim()) {
      setFormError(t("usernameRequired"));
      return;
    }
    if (!password.trim()) {
      setFormError(t("passwordRequired"));
      return;
    }
    if (!role) {
      setFormError(t("roleRequired"));
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const body: any = { username, password, role };
      if (brandId) body.brand_id = parseInt(brandId);

      const response = await fetch("/api/v1/admin/users", {
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
          errorMessage = errorData.errors?.[0]?.msg || errorData.message || t("invalidDataError");
        } else if (response.status === 409) {
            const errorData = await response.json();
            errorMessage = errorData.message || t("usernameExistsError");
        } else if (response.status === 401 || response.status === 403) {
          errorMessage = t("unauthorizedError", { action: "create" });
        } else if (response.status >= 500) {
          errorMessage = t("serverError", { action: "creating" });
        }
        throw new Error(errorMessage);
      }

      await fetchUsers();
      setIsAddModalOpen(false);
      showSuccess(t("userCreatedSuccess"));
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit User Handlers
  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setUsername(user.username);
    setPassword(""); // Don't show existing password
    setRole(user.role);
    setBrandId(user.brand_id ? user.brand_id.toString() : "");
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    if (!username.trim()) {
      setFormError(t("usernameRequired"));
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const body: any = { username, role };
      if (password) body.password = password;
      if (brandId) body.brand_id = parseInt(brandId);
      else body.brand_id = null;

      const response = await fetch(`/api/v1/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let errorMessage = t("updateError");
        if (response.status === 400) {
            const errorData = await response.json();
            errorMessage = errorData.errors?.[0]?.msg || errorData.message || t("invalidDataError");
        } else if (response.status === 409) {
            const errorData = await response.json();
            errorMessage = errorData.message || t("usernameExistsError");
        } else if (response.status === 401 || response.status === 403) {
          errorMessage = t("unauthorizedError", { action: "update" });
        } else if (response.status === 404) {
          errorMessage = t("notFoundError");
        } else if (response.status >= 500) {
          errorMessage = t("serverError", { action: "updating" });
        }
        throw new Error(errorMessage);
      }

      await fetchUsers();
      setIsEditModalOpen(false);
      showSuccess(t("userUpdatedSuccess"));
      setSelectedUser(null);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete User Handlers
  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/v1/admin/users/${selectedUser.id}`, {
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
        }
        throw new Error(errorMessage);
      }

      await fetchUsers();
      setIsDeleteModalOpen(false);
      showSuccess(t("userDeletedSuccess"));
      setSelectedUser(null);
    } catch (err: any) {
      setFormError(err.message);
      if (typeof window !== "undefined") {
        window.alert(err?.message || t("deleteError"));
      }
    } finally {
      setIsSubmitting(false);
    }
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
        <Button aria-label={t("addUser")} onClick={openAddModal} startIcon={<PlusIcon />}>
          {t("addUser")}
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
                {t("username")}
              </TableCell>
              <TableCell isHeader className="px-6 py-3 text-left rtl:text-right font-medium text-gray-500 dark:text-gray-400">
                {t("role")}
              </TableCell>
              <TableCell isHeader className="px-6 py-3 text-left rtl:text-right font-medium text-gray-500 dark:text-gray-400">
                {t("brand")}
              </TableCell>
              <TableCell isHeader className="px-6 py-3 text-right rtl:text-left font-medium text-gray-500 dark:text-gray-400">
                {t("actions")}
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell className="px-6 py-4 text-center text-gray-500 col-span-4">
                  {t("loading")}
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell className="px-6 py-4 text-center text-gray-500 col-span-4">
                  {t("noUsersFound")}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow
                  key={user.id}
                  className="border-b border-gray-100 last:border-none hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                >
                  <TableCell className="px-6 py-4 text-gray-800 dark:text-white/90">
                    {user.username}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-800 dark:text-white/90">
                    {user.role}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-800 dark:text-white/90">
                    {brands.find(brand => brand.id === user.brand_id)?.name || t("notAssigned")}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right rtl:text-left">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        title={t("editUser")}
                        aria-label={t("editUser")}
                        onClick={() => openEditModal(user)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        title={t("deleteUser")}
                        aria-label={t("deleteUser")}
                        onClick={() => openDeleteModal(user)}
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

      {/* Add User Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        className="max-w-[500px] p-6"
      >
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          {t("addNewUser")}
        </h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="username">{t("username")}</Label>
            <Input
              id="username"
              type="text"
              placeholder={t("enterUsername")}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={!!formError && formError.includes(t("username"))}
            />
          </div>
          <div>
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              type="password"
              placeholder={t("enterPassword")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!formError && formError.includes(t("password"))}
            />
          </div>
          <div>
            <Label htmlFor="role">{t("role")}</Label>
            <Select
                key={isAddModalOpen ? 'add-role' : 'closed'}
                options={roleOptions}
                placeholder={t("selectRole")}
                onChange={(value) => setRole(value)}
                defaultValue={role}
            />
          </div>
          <div>
            <Label htmlFor="brandId">{t("brandOptional")}</Label>
            <Select
              key={isAddModalOpen ? `add-brand-${brandId}` : 'closed'}
              options={brands.map(brand => ({ value: brand.id.toString(), label: brand.name }))}
              placeholder={t("selectBrand")}
              defaultValue={brandId}
              onChange={(value) => setBrandId(value)}
            />
          </div>
          {formError && <p className="text-sm text-error-500">{formError}</p>}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
            >
              {t("cancel")}
            </Button>
            <Button onClick={handleAddUser} disabled={isSubmitting}>
              {isSubmitting ? t("adding") : t("addUser")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        className="max-w-[500px] p-6"
      >
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          {t("editUserTitle")}
        </h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="editUsername">{t("username")}</Label>
            <Input
              id="editUsername"
              type="text"
              placeholder={t("enterUsername")}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={!!formError && formError.includes(t("username"))}
            />
          </div>
          <div>
            <Label htmlFor="editPassword">{t("passwordKeepCurrent")}</Label>
            <Input
              id="editPassword"
              type="password"
              placeholder={t("enterNewPassword")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="editRole">{t("role")}</Label>
            <Select
                key={selectedUser ? `edit-role-${selectedUser.id}` : 'closed'}
                options={roleOptions}
                placeholder={t("selectRole")}
                onChange={(value) => setRole(value)}
                defaultValue={role}
            />
          </div>
          <div>
            <Label htmlFor="editBrandId">{t("brandOptional")}</Label>
            <Select
              key={selectedUser ? `edit-brand-${selectedUser.id}-${brandId}` : 'closed'}
              options={brands.map(brand => ({ value: brand.id.toString(), label: brand.name }))}
              placeholder={t("selectBrand")}
              defaultValue={brandId}
              onChange={(value) => setBrandId(value)}
            />
          </div>
          {formError && <p className="text-sm text-error-500">{formError}</p>}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSubmitting}
            >
              {t("cancel")}
            </Button>
            <Button onClick={handleEditUser} disabled={isSubmitting}>
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
                {t("deleteUserTitle")}
            </h3>
        </div>
        
        <p className="mb-6 text-gray-500 dark:text-gray-400">
          {t("deleteConfirmation")} <strong>{selectedUser?.username}</strong>? 
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
            onClick={handleDeleteUser}
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