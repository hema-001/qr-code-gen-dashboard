"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { UserCircleIcon } from "@/icons";

export default function ProfilePage() {
  const t = useTranslations("Profile");
  const { user, token, login } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Account Info Form
  const [username, setUsername] = useState("");
  const [accountFormError, setAccountFormError] = useState<string | null>(null);
  const [isAccountSubmitting, setIsAccountSubmitting] = useState(false);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordFormError, setPasswordFormError] = useState<string | null>(null);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
    }
  }, [user]);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setAccountFormError(t("usernameRequired"));
      return;
    }

    setIsAccountSubmitting(true);
    setAccountFormError(null);

    try {
      const response = await fetch(`/api/v1/admin/users/${user?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          username,
          role: user?.role 
        }),
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
          errorMessage = t("unauthorizedError");
        } else if (response.status === 404) {
          errorMessage = t("notFoundError");
        } else if (response.status >= 500) {
          errorMessage = t("serverError");
        }
        throw new Error(errorMessage);
      }

      // Update local auth state with new username
      if (user && token) {
        login(token, { ...user, username });
      }
      
      showSuccess(t("accountUpdatedSuccess"));
    } catch (err: any) {
      setAccountFormError(err.message);
    } finally {
      setIsAccountSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword.trim()) {
      setPasswordFormError(t("currentPasswordRequired"));
      return;
    }

    if (!newPassword.trim()) {
      setPasswordFormError(t("newPasswordRequired"));
      return;
    }

    if (newPassword.length < 6) {
      setPasswordFormError(t("passwordMinLength"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFormError(t("passwordMismatch"));
      return;
    }

    setIsPasswordSubmitting(true);
    setPasswordFormError(null);

    try {
      const response = await fetch(`/api/v1/admin/users/${user?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          username: user?.username,
          role: user?.role,
          password: newPassword,
          currentPassword: currentPassword
        }),
      });

      if (!response.ok) {
        let errorMessage = t("passwordUpdateError");
        if (response.status === 400) {
          const errorData = await response.json();
          errorMessage = errorData.errors?.[0]?.msg || errorData.message || t("invalidDataError");
        } else if (response.status === 401 || response.status === 403) {
          const errorData = await response.json();
          errorMessage = errorData.message || t("incorrectCurrentPassword");
        } else if (response.status >= 500) {
          errorMessage = t("serverError");
        }
        throw new Error(errorMessage);
      }

      // Clear password fields on success
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      showSuccess(t("passwordUpdatedSuccess"));
    } catch (err: any) {
      setPasswordFormError(err.message);
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <PageBreadcrumb pageTitle={t("title")} />

      {successMessage && (
        <div className="mb-6 rounded-lg bg-success-50 p-4 text-sm text-success-800 dark:bg-success-900/30 dark:text-success-400">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Profile Info Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-900/30 dark:text-brand-400">
              <UserCircleIcon className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                {user?.username}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                {user?.role?.replace("_", " ")}
              </p>
            </div>
          </div>

          <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
            {t("accountInfo")}
          </h3>
          
          <form onSubmit={handleUpdateAccount} className="space-y-4">
            <div>
              <Label htmlFor="username">{t("username")} <span className="text-error-500">*</span></Label>
              <Input
                id="username"
                type="text"
                placeholder={t("enterUsername")}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="role">{t("role")}</Label>
              <Input
                id="role"
                type="text"
                value={user?.role?.replace("_", " ") || ""}
                disabled
                className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed capitalize"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {t("roleCannotChange")}
              </p>
            </div>

            {accountFormError && (
              <p className="text-sm text-error-500">{accountFormError}</p>
            )}

            <div className="flex justify-end">
              <Button disabled={isAccountSubmitting}>
                {isAccountSubmitting ? t("saving") : t("saveChanges")}
              </Button>
            </div>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
            {t("changePassword")}
          </h3>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            {t("changePasswordDescription")}
          </p>
          
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">{t("currentPassword")} <span className="text-error-500">*</span></Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder={t("enterCurrentPassword")}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="newPassword">{t("newPassword")} <span className="text-error-500">*</span></Label>
              <Input
                id="newPassword"
                type="password"
                placeholder={t("enterNewPassword")}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">{t("confirmPassword")} <span className="text-error-500">*</span></Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t("enterConfirmPassword")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {passwordFormError && (
              <p className="text-sm text-error-500">{passwordFormError}</p>
            )}

            <div className="flex justify-end">
              <Button disabled={isPasswordSubmitting}>
                {isPasswordSubmitting ? t("updating") : t("updatePassword")}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
