"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import {
  PlusIcon,
  PencilIcon,
  TrashBinIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckLineIcon,
  DownloadIcon,
  EyeIcon,
} from "@/icons";

// Types
interface Product {
  id: number;
  brand_id: number;
  model_name: string;
  category: string;
  image_url: string;
  attributes: {
    flavor?: string;
    mg?: string;
    code_type?: string;
  };
  Brand?: {
    id: number;
    name: string;
  };
}

interface Brand {
  id: number;
  name: string;
}

interface BatchItem {
  id: string;
  product_id: number;
  product?: Product;
  quantity: number;
}

interface BatchJob {
  id: string;
  jobId: string;
  batchName: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  totalCodes: number;
  processedCodes: number;
  createdAt: Date;
  downloadUrl?: string;
  error?: string;
}

// API Batch type from GET /api/v1/admin/batches
interface ApiBatch {
  id: number;
  batch_name: string;
  description: string;
  job_id: string;
  total_codes: string;
  created_at: string;
  status: string;
  download_url?: string;
  progress: {
    percent: number;
    status: string;
  };
}

// Map API state to our status
const mapJobState = (state: string): BatchJob["status"] => {
  switch (state) {
    case "completed":
      return "completed";
    case "failed":
      return "failed";
    case "active":
      return "processing";
    case "waiting":
    case "delayed":
    default:
      return "pending";
  }
};

// Step indicator component
const StepIndicator: React.FC<{
  currentStep: number;
  steps: { number: number; title: string }[];
}> = ({ currentStep, steps }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold transition-all ${
                  currentStep === step.number
                    ? "border-brand-500 bg-brand-500 text-white"
                    : currentStep > step.number
                    ? "border-success-500 bg-success-500 text-white"
                    : "border-gray-300 bg-white text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                {currentStep > step.number ? (
                  <CheckLineIcon className="h-5 w-5" />
                ) : (
                  step.number
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium ${
                  currentStep >= step.number
                    ? "text-brand-500 dark:text-brand-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`mx-4 h-0.5 w-16 sm:w-24 ${
                  currentStep > step.number
                    ? "bg-success-500"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default function CodeGeneratorPage() {
  const t = useTranslations("CodeGenerator");
  const { token } = useAuth();
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const steps = [
    { number: 1, title: t("stepBatchInfo") },
    { number: 2, title: t("stepBatchDetails") },
    { number: 3, title: t("stepReviewGenerate") },
  ];

  // Step 1: Batch Info
  const [batchName, setBatchName] = useState("");
  const [description, setDescription] = useState("");

  // Step 2: Batch Details
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Step 3 & Submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Active Batch Job (real-time progress for current generation)
  const [activeBatchJob, setActiveBatchJob] = useState<BatchJob | null>(null);

  // Persisted Batches from API
  const [batches, setBatches] = useState<ApiBatch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [batchesPage, setBatchesPage] = useState(1);
  const [batchesTotalPages, setBatchesTotalPages] = useState(1);
  const [batchesTotalItems, setBatchesTotalItems] = useState(0);

  // Delete/Retry states
  const [deletingBatchId, setDeletingBatchId] = useState<number | null>(null);
  const [retryingBatchId, setRetryingBatchId] = useState<number | null>(null);

  // Batch Details Modal
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedBatchDetails, setSelectedBatchDetails] = useState<ApiBatch | null>(null);
  const [loadingBatchDetails, setLoadingBatchDetails] = useState(false);

  // Download state
  const [downloadingBatchId, setDownloadingBatchId] = useState<number | null>(null);

  // Delete Confirmation Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<ApiBatch | null>(null);

  // Fetch products and brands on mount
  useEffect(() => {
    if (token) {
      fetchProducts();
      fetchBrands();
      fetchBatches();
    }
  }, [token]);

  // Fetch batches when page changes
  useEffect(() => {
    if (token) {
      fetchBatches();
    }
  }, [batchesPage]);

  // Poll for active batch job status updates
  useEffect(() => {
    if (!token || !activeBatchJob) return;

    if (activeBatchJob.status === "completed" || activeBatchJob.status === "failed") {
      // Refresh batches list when job completes
      fetchBatches();
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/batch-generate/jobs/${activeBatchJob.jobId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const newStatus = mapJobState(data.state);
          
          setActiveBatchJob({
            ...activeBatchJob,
            status: newStatus,
            progress: data.progress?.percent || 0,
            processedCodes: data.progress?.processed || 0,
            totalCodes: data.progress?.total || activeBatchJob.totalCodes,
            error: data.failedReason || undefined,
          });

          // Refresh batches when job completes or fails
          if (newStatus === "completed" || newStatus === "failed") {
            fetchBatches();
          }
        }
      } catch (err) {
        console.error(`Failed to poll job ${activeBatchJob.jobId}`, err);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [token, activeBatchJob]);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      // Fetch all products (no pagination for dropdown)
      const response = await fetch("/api/v1/admin/products?limit=1000", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
      setLoadingProducts(false);
    }
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
        setBrands(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch brands", err);
    }
  };

  const fetchBatches = async () => {
    setLoadingBatches(true);
    try {
      const response = await fetch(`/api/v1/admin/batches?page=${batchesPage}&limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBatches(data.batches || []);
        setBatchesTotalPages(data.totalPages || 1);
        setBatchesTotalItems(data.totalItems || 0);
      }
    } catch (err) {
      console.error("Failed to fetch batches", err);
    } finally {
      setLoadingBatches(false);
    }
  };

  const openDeleteModal = (batch: ApiBatch) => {
    setBatchToDelete(batch);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setBatchToDelete(null);
  };

  const handleDeleteBatch = async () => {
    if (!batchToDelete) return;
    
    setDeletingBatchId(batchToDelete.id);
    try {
      const response = await fetch(`/api/v1/admin/batches/${batchToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete batch");
      }

      closeDeleteModal();
      setSuccessMessage(t("batchDeletedSuccess"));
      setTimeout(() => setSuccessMessage(null), 3000);
      fetchBatches();
    } catch (err: any) {
      setError(err.message || t("failedToDeleteBatch"));
    } finally {
      setDeletingBatchId(null);
    }
  };

  const handleRetryBatch = async (batch: ApiBatch) => {
    setRetryingBatchId(batch.id);
    try {
      const response = await fetch(`/api/v1/admin/batches/${batch.id}/retry`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(t("failedToRetryBatch"));
      }

      const data = await response.json();

      // Set as active job to track progress
      const newJob: BatchJob = {
        id: generateId(),
        jobId: data.jobId || batch.job_id,
        batchName: batch.batch_name,
        status: "pending",
        progress: 0,
        totalCodes: parseInt(batch.total_codes) || 0,
        processedCodes: 0,
        createdAt: new Date(),
      };
      setActiveBatchJob(newJob);

      setSuccessMessage(t("batchRetrySuccess"));
      setTimeout(() => setSuccessMessage(null), 3000);
      fetchBatches();
    } catch (err: any) {
      setError(err.message || t("failedToRetryBatch"));
    } finally {
      setRetryingBatchId(null);
    }
  };

  const handleDownload = async (batch: ApiBatch) => {
    if (!batch.download_url) {
      setError(t("downloadUrlNotAvailable"));
      return;
    }

    setDownloadingBatchId(batch.id);
    try {
      const response = await fetch(batch.download_url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(t("failedToDownload"));
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `${batch.batch_name}.zip`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=(['"]?)([^'"\n]*?)\1(;|$)/i);
        if (filenameMatch && filenameMatch[2]) {
          filename = filenameMatch[2];
        }
      }

      // Create blob and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccessMessage(t("downloadStarted", { batchName: batch.batch_name }));
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || t("failedToDownload"));
    } finally {
      setDownloadingBatchId(null);
    }
  };

  const fetchBatchDetails = async (batchId: number) => {
    setLoadingBatchDetails(true);
    setIsDetailsModalOpen(true);
    try {
      const response = await fetch(`/api/v1/admin/batches/${batchId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedBatchDetails(data);
      } else {
        throw new Error(t("failedToFetchBatchDetails"));
      }
    } catch (err: any) {
      setError(err.message || t("failedToFetchBatchDetails"));
      setIsDetailsModalOpen(false);
    } finally {
      setLoadingBatchDetails(false);
    }
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedBatchDetails(null);
  };

  // Generate unique ID for batch items
  const generateId = () => {
    return `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Add new batch item
  const addBatchItem = () => {
    const newItem: BatchItem = {
      id: generateId(),
      product_id: 0,
      quantity: 1,
    };
    setBatchItems([...batchItems, newItem]);
  };

  // Update batch item
  const updateBatchItem = (id: string, field: keyof BatchItem, value: any) => {
    setBatchItems(
      batchItems.map((item) => {
        if (item.id === id) {
          if (field === "product_id") {
            const product = products.find((p) => p.id === Number(value));
            return { ...item, product_id: Number(value), product };
          }
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // Remove batch item
  const removeBatchItem = (id: string) => {
    setBatchItems(batchItems.filter((item) => item.id !== id));
  };

  // Validation
  const isStep1Valid = batchName.trim().length > 0;
  const isStep2Valid = batchItems.length > 0 && batchItems.every(
    (item) => item.product_id > 0 && item.quantity > 0
  );

  // Navigation
  const goToNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Calculate total codes
  const getTotalCodes = () => {
    return batchItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  // Submit batch generation
  const handleGenerateBatch = async () => {
    if (!isStep1Valid || !isStep2Valid) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        batch_name: batchName,
        description: description,
        details: batchItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      };

      const response = await fetch("/api/batch-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t("failedToGenerateBatch"));
      }

      const data = await response.json();

      // Set as active job to track progress
      const newJob: BatchJob = {
        id: generateId(),
        jobId: data.jobId,
        batchName: batchName,
        status: "pending",
        progress: 0,
        totalCodes: data.totalCodes,
        processedCodes: 0,
        createdAt: new Date(),
      };
      setActiveBatchJob(newJob);

      // Reset form
      setBatchName("");
      setDescription("");
      setBatchItems([]);
      setCurrentStep(1);
      setSuccessMessage(t("batchQueuedSuccess", { jobId: data.jobId }));
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setError(err.message || t("failedToGenerateBatch"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create a brands map for quick lookup
  const brandsMap = brands.reduce((acc, brand) => {
    acc[brand.id] = brand.name;
    return acc;
  }, {} as Record<number, string>);

  // Helper function to get brand name
  const getBrandName = (product: Product) => {
    return product.Brand?.name || brandsMap[product.brand_id] || t("unknownBrand");
  };

  // Product options for dropdown
  const productOptions = products.map((p) => ({
    value: p.id.toString(),
    label: `${getBrandName(p)} - (${p.attributes?.flavor || "N/A"} - ${p.attributes?.mg || "N/A"}MG - ${p.attributes?.code_type || "N/A"})`,
  }));

  // Get status badge color
  const getStatusColor = (status: BatchJob["status"]) => {
    switch (status) {
      case "pending":
        return "warning";
      case "processing":
        return "info";
      case "completed":
        return "success";
      case "failed":
        return "error";
      default:
        return "light";
    }
  };

  // Format date/time to China Standard Time (UTC+8)
  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    if (isNaN(date.getTime())) {
      return dateTimeStr;
    }
    return date.toLocaleString("zh-CN", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  return (
    <div className="container mx-auto py-8">
      <PageBreadcrumb pageTitle={t("title")} />

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 rounded-lg bg-success-50 p-4 text-sm text-success-800 dark:bg-success-900/30 dark:text-success-400">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 rounded-lg bg-error-50 p-4 text-sm text-error-800 dark:bg-error-900/30 dark:text-error-400">
          {error}
        </div>
      )}

      {/* Batch Generation Form Card */}
      <div className="mb-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {t("generateQRCodeBatch")}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("createBatchDescription")}
          </p>
        </div>

        <div className="p-6">
          {/* Step Indicator */}
          <StepIndicator currentStep={currentStep} steps={steps} />

          {/* Step 1: Batch Info */}
          {currentStep === 1 && (
            <div className="mx-auto max-w-xl space-y-6">
              <div>
                <Label htmlFor="batchName">
                  {t("batchName")} <span className="text-error-500">*</span>
                </Label>
                <Input
                  id="batchName"
                  type="text"
                  placeholder={t("enterBatchName")}
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="description">{t("descriptionOptional")}</Label>
                <TextArea
                  placeholder={t("enterBatchDescription")}
                  rows={4}
                  value={description}
                  onChange={(value) => setDescription(value)}
                />
              </div>
            </div>
          )}

          {/* Step 2: Batch Details */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("addProductsDescription")}
                </p>
                <Button
                  onClick={addBatchItem}
                  startIcon={<PlusIcon />}
                  size="sm"
                >
                  {t("addItem")}
                </Button>
              </div>

              {batchItems.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center dark:border-gray-600">
                  <p className="text-gray-500 dark:text-gray-400">
                    {t("noItemsAdded")}
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                  <Table>
                    <TableHeader className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800">
                      <TableRow>
                        <TableCell
                          isHeader
                          className="px-4 py-3 text-left rtl:text-right text-sm font-medium text-gray-500 dark:text-gray-400"
                        >
                          {t("product")}
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-4 py-3 text-left rtl:text-right text-sm font-medium text-gray-500 dark:text-gray-400"
                        >
                          {t("flavor")}
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-4 py-3 text-left rtl:text-right text-sm font-medium text-gray-500 dark:text-gray-400"
                        >
                          {t("mg")}
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-4 py-3 text-left rtl:text-right text-sm font-medium text-gray-500 dark:text-gray-400"
                        >
                          {t("codeType")}
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-4 py-3 text-left rtl:text-right text-sm font-medium text-gray-500 dark:text-gray-400"
                        >
                          {t("quantity")}
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-4 py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
                        >
                          {t("actions")}
                        </TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batchItems.map((item) => (
                        <TableRow
                          key={item.id}
                          className="border-b border-gray-100 dark:border-gray-800"
                        >
                          <TableCell className="px-4 py-3">
                            <Select
                              options={productOptions}
                              placeholder={t("selectProduct")}
                              onChange={(value) =>
                                updateBatchItem(item.id, "product_id", value)
                              }
                              defaultValue={
                                item.product_id > 0
                                  ? item.product_id.toString()
                                  : ""
                              }
                              className="min-w-[200px]"
                            />
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {item.product?.attributes?.flavor || "-"}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {item.product?.attributes?.mg || "-"}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {item.product?.attributes?.code_type || "-"}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateBatchItem(
                                  item.id,
                                  "quantity",
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell className="px-4 py-3 text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeBatchItem(item.id)}
                              className="text-error-500 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-900/20"
                            >
                              <TrashBinIcon className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {batchItems.length > 0 && (
                <div className="flex justify-end rtl:justify-start">
                  <div className="rounded-lg bg-gray-100 px-4 py-2 dark:bg-gray-800">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {t("totalQRCodes")}:{" "}
                    </span>
                    <span className="font-semibold text-gray-800 dark:text-white">
                      {getTotalCodes().toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && (
            <div className="mx-auto max-w-2xl space-y-6">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800">
                <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
                  {t("batchSummary")}
                </h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between border-b border-gray-200 pb-2 dark:border-gray-600">
                    <span className="text-gray-600 dark:text-gray-400">{t("batchName")}:</span>
                    <span className="font-medium text-gray-800 dark:text-white">{batchName}</span>
                  </div>
                  {description && (
                    <div className="flex justify-between border-b border-gray-200 pb-2 dark:border-gray-600">
                      <span className="text-gray-600 dark:text-gray-400">{t("description")}:</span>
                      <span className="font-medium text-gray-800 dark:text-white">{description}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-b border-gray-200 pb-2 dark:border-gray-600">
                    <span className="text-gray-600 dark:text-gray-400">{t("totalProducts")}:</span>
                    <span className="font-medium text-gray-800 dark:text-white">{batchItems.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t("totalQRCodes")}:</span>
                    <span className="font-semibold text-brand-500">{getTotalCodes().toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
                  <h5 className="font-medium text-gray-800 dark:text-white">{t("productsInBatch")}</h5>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {batchItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white">
                            {item.product ? getBrandName(item.product) : t("unknownBrand")} - {item.product?.model_name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t("flavor")}: {item.product?.attributes?.flavor || "N/A"} | {t("mg")}: {item.product?.attributes?.mg || "N/A"}
                          </p>
                        </div>
                      </div>
                      <Badge color="primary" variant="light">
                        {item.quantity.toLocaleString()} {t("codes")}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-warning-200 bg-warning-50 p-4 dark:border-warning-800 dark:bg-warning-900/20">
                <p className="text-sm text-warning-800 dark:text-warning-400">
                  <strong>{t("note")}:</strong> {t("generateNote")}
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6 dark:border-gray-700">
            <div>
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={goToPreviousStep}
                  startIcon={<ChevronLeftIcon className="h-4 w-4 rtl:rotate-180" />}
                >
                  {t("previous")}
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              {currentStep < 3 && (
                <Button
                  onClick={goToNextStep}
                  disabled={
                    (currentStep === 1 && !isStep1Valid) ||
                    (currentStep === 2 && !isStep2Valid)
                  }
                  endIcon={<ChevronRightIcon className="h-4 w-4 rtl:rotate-180" />}
                >
                  {t("next")}
                </Button>
              )}
              {currentStep === 3 && (
                <Button
                  onClick={handleGenerateBatch}
                  disabled={isSubmitting || !isStep1Valid || !isStep2Valid}
                >
                  {isSubmitting ? t("generating") : t("generateBatch")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active Batch Progress Section - Only visible when there's an active job */}
      {activeBatchJob && (activeBatchJob.status === "pending" || activeBatchJob.status === "processing") && (
        <div className="mb-8 overflow-hidden rounded-xl border border-brand-200 bg-white shadow-sm dark:border-brand-800 dark:bg-gray-900">
          <div className="border-b border-brand-200 bg-brand-50 px-6 py-4 dark:border-brand-700 dark:bg-brand-900/20">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500">
                <svg className="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {t("batchGenerationInProgress")}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {activeBatchJob.batchName} - {t("jobId")}: {activeBatchJob.jobId}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {activeBatchJob.status === "pending" ? t("queuedForProcessing") : t("generatingQRCodes")}
                </span>
                <Badge color={getStatusColor(activeBatchJob.status)} variant="light">
                  {activeBatchJob.status.charAt(0).toUpperCase() + activeBatchJob.status.slice(1)}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full bg-brand-500 transition-all duration-500"
                    style={{ width: `${activeBatchJob.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    {activeBatchJob.processedCodes.toLocaleString()} / {activeBatchJob.totalCodes.toLocaleString()} {t("codesProcessed")}
                  </span>
                  <span className="font-semibold text-brand-500">
                    {activeBatchJob.progress}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Completed/Failed Active Job Notification */}
      {activeBatchJob && (activeBatchJob.status === "completed" || activeBatchJob.status === "failed") && (
        <div className={`mb-8 overflow-hidden rounded-xl border shadow-sm ${
          activeBatchJob.status === "completed" 
            ? "border-success-200 bg-success-50 dark:border-success-800 dark:bg-success-900/20" 
            : "border-error-200 bg-error-50 dark:border-error-800 dark:bg-error-900/20"
        }`}>
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              {activeBatchJob.status === "completed" ? (
                <CheckLineIcon className="h-6 w-6 text-success-500" />
              ) : (
                <svg className="h-6 w-6 text-error-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <div>
                <p className={`font-medium ${
                  activeBatchJob.status === "completed" ? "text-success-800 dark:text-success-400" : "text-error-800 dark:text-error-400"
                }`}>
                  {activeBatchJob.status === "completed" 
                    ? t("batchCompletedSuccess", { batchName: activeBatchJob.batchName })
                    : t("batchFailed", { batchName: activeBatchJob.batchName, error: activeBatchJob.error || t("unknownError") })}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {activeBatchJob.totalCodes.toLocaleString()} {t("codesProcessed")}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveBatchJob(null)}
            >
              {t("dismiss")}
            </Button>
          </div>
        </div>
      )}

      {/* Batch History Section */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                {t("batchHistory")}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t("batchHistoryDescription")}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchBatches()}
              disabled={loadingBatches}
            >
              {loadingBatches ? t("refreshing") : t("refresh")}
            </Button>
          </div>
        </div>

        <div className="p-6">
          {loadingBatches && batches.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <svg className="h-8 w-8 animate-spin text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : batches.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center dark:border-gray-600">
              <p className="text-gray-500 dark:text-gray-400">
                {t("noBatchesFound")}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                <Table>
                  <TableHeader className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800">
                    <TableRow>
                      <TableCell
                        isHeader
                        className="px-4 py-3 text-left rtl:text-right text-sm font-medium text-gray-500 dark:text-gray-400"
                      >
                        {t("batchName")}
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-4 py-3 text-left rtl:text-right text-sm font-medium text-gray-500 dark:text-gray-400"
                      >
                        {t("jobId")}
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-4 py-3 text-left rtl:text-right text-sm font-medium text-gray-500 dark:text-gray-400"
                      >
                        {t("totalCodes")}
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-4 py-3 text-left rtl:text-right text-sm font-medium text-gray-500 dark:text-gray-400"
                      >
                        {t("status")}
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-4 py-3 text-left rtl:text-right text-sm font-medium text-gray-500 dark:text-gray-400"
                      >
                        {t("progress")}
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-4 py-3 text-left rtl:text-right text-sm font-medium text-gray-500 dark:text-gray-400"
                      >
                        {t("createdAt")}
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-4 py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
                      >
                        {t("actions")}
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.map((batch) => (
                      <TableRow
                        key={batch.id}
                        className="border-b border-gray-100 dark:border-gray-800"
                      >
                        <TableCell className="px-4 py-3">
                          <div>
                            <span className="font-medium text-gray-800 dark:text-white">
                              {batch.batch_name}
                            </span>
                            {batch.description && (
                              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                                {batch.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <code className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                            {batch.job_id}
                          </code>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {parseInt(batch.total_codes).toLocaleString()}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge color={getStatusColor(batch.status as BatchJob["status"])} variant="light">
                            {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  batch.status === "completed"
                                    ? "bg-success-500"
                                    : batch.status === "failed"
                                    ? "bg-error-500"
                                    : "bg-brand-500"
                                }`}
                                style={{ width: `${batch.progress?.percent || 0}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {batch.progress?.percent || 0}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {formatDateTime(batch.created_at)}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fetchBatchDetails(batch.id)}
                              className="text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                            {batch.status === "completed" && batch.download_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownload(batch)}
                                disabled={downloadingBatchId === batch.id}
                                startIcon={
                                  downloadingBatchId === batch.id ? (
                                    <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  ) : (
                                    <DownloadIcon className="h-4 w-4" />
                                  )
                                }
                              >
                                {downloadingBatchId === batch.id ? t("downloading") : t("download")}
                              </Button>
                            )}
                            {batch.status === "failed" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRetryBatch(batch)}
                                disabled={retryingBatchId === batch.id}
                                className="text-warning-600 hover:bg-warning-50 dark:hover:bg-warning-900/20"
                              >
                                {retryingBatchId === batch.id ? t("retrying") : t("retry")}
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDeleteModal(batch)}
                              disabled={deletingBatchId === batch.id}
                              className="text-error-500 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-900/20"
                            >
                              {deletingBatchId === batch.id ? (
                                <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <TrashBinIcon className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {batchesTotalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("showingPage", { page: batchesPage, totalPages: batchesTotalPages, totalItems: batchesTotalItems })}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBatchesPage(Math.max(1, batchesPage - 1))}
                      disabled={batchesPage <= 1}
                      startIcon={<ChevronLeftIcon className="h-4 w-4 rtl:rotate-180" />}
                    >
                      {t("previous")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBatchesPage(Math.min(batchesTotalPages, batchesPage + 1))}
                      disabled={batchesPage >= batchesTotalPages}
                      endIcon={<ChevronRightIcon className="h-4 w-4 rtl:rotate-180" />}
                    >
                      {t("next")}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Batch Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={closeDetailsModal}
        className="max-w-lg p-6 sm:p-8"
      >
        {loadingBatchDetails ? (
          <div className="flex flex-col items-center justify-center py-12">
            <svg className="h-10 w-10 animate-spin text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-gray-500 dark:text-gray-400">{t("loadingBatchDetails")}</p>
          </div>
        ) : selectedBatchDetails ? (
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                {t("batchDetails")}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t("viewBatchDetails")}
              </p>
            </div>

            <div className="space-y-4">
              {/* Batch Name */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                <label className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  {t("batchName")}
                </label>
                <p className="mt-1 text-lg font-semibold text-gray-800 dark:text-white">
                  {selectedBatchDetails.batch_name}
                </p>
              </div>

              {/* Description */}
              {selectedBatchDetails.description && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                  <label className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    {t("description")}
                  </label>
                  <p className="mt-1 text-gray-700 dark:text-gray-300">
                    {selectedBatchDetails.description}
                  </p>
                </div>
              )}

              {/* Job ID */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                <label className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  {t("jobId")}
                </label>
                <code className="mt-1 block rounded bg-gray-200 px-2 py-1 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                  {selectedBatchDetails.job_id}
                </code>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                  <label className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    {t("totalCodes")}
                  </label>
                  <p className="mt-1 text-2xl font-bold text-brand-500">
                    {parseInt(selectedBatchDetails.total_codes).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                  <label className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    {t("status")}
                  </label>
                  <div className="mt-2">
                    <Badge color={getStatusColor(selectedBatchDetails.status as BatchJob["status"])} variant="light">
                      {selectedBatchDetails.status.charAt(0).toUpperCase() + selectedBatchDetails.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                <label className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  {t("progress")}
                </label>
                <div className="mt-2 space-y-2">
                  <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className={`h-full rounded-full transition-all ${
                        selectedBatchDetails.status === "completed"
                          ? "bg-success-500"
                          : selectedBatchDetails.status === "failed"
                          ? "bg-error-500"
                          : "bg-brand-500"
                      }`}
                      style={{ width: `${selectedBatchDetails.progress?.percent || 0}%` }}
                    />
                  </div>
                  <p className="text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                    {selectedBatchDetails.progress?.percent || 0}%
                  </p>
                </div>
              </div>

              {/* Created At */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                <label className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  {t("createdAtCST")}
                </label>
                <p className="mt-1 text-gray-700 dark:text-gray-300">
                  {formatDateTime(selectedBatchDetails.created_at)}
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex justify-end gap-3">
              {selectedBatchDetails.status === "completed" && selectedBatchDetails.download_url && (
                <Button
                  variant="primary"
                  onClick={() => {
                    handleDownload(selectedBatchDetails);
                    closeDetailsModal();
                  }}
                  startIcon={<DownloadIcon className="h-4 w-4" />}
                >
                  {t("download")}
                </Button>
              )}
              <Button variant="outline" onClick={closeDetailsModal}>
                {t("close")}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        className="max-w-md p-6 sm:p-8"
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error-50 text-error-500 dark:bg-error-900/30 dark:text-error-400">
            <TrashBinIcon className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {t("deleteBatch")}
          </h3>
        </div>
        
        <p className="mb-6 text-gray-500 dark:text-gray-400">
          {t("deleteConfirmation", { batchName: batchToDelete?.batch_name || "" })}
        </p>
        <p className="mb-6 text-sm text-error-600 dark:text-error-400">
          {t("deleteWarning")}
        </p>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={closeDeleteModal}
            disabled={deletingBatchId !== null}
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleDeleteBatch}
            disabled={deletingBatchId !== null}
            className="bg-error-600 hover:bg-error-700 text-white"
          >
            {deletingBatchId !== null ? t("deleting") : t("delete")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}