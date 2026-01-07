"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import StatCard from "@/components/dashboard/StatCard";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import ScanChart from "@/components/dashboard/ScanChart";
import LocationChart from "@/components/dashboard/LocationChart";
import BatchChart from "@/components/dashboard/BatchChart";
import SystemHealth from "@/components/dashboard/SystemHealth";
import QRCodeDistribution from "@/components/dashboard/QRCodeDistribution";

// Types
interface OverviewData {
  qrCodes: {
    total: number;
    active: number;
    used: number;
    usagePercentage: number;
    statusDistribution: {
      active: number;
      used: number;
      inactive?: number;
    };
  };
  scans: {
    total: number;
    last24Hours: number;
  };
  batches: {
    total: number;
    completed: number;
    inProgress: number;
    failed: number;
  };
  catalog: {
    brands: number;
    products: number;
  };
}

interface ActivityItem {
  type: "scan" | "batch";
  timestamp: string;
  data: {
    qrCodeId?: number;
    uid?: string;
    brand?: string;
    model?: string;
    location?: string;
    ipAddress?: string;
    batchId?: number;
    batchName?: string;
    status?: string;
    totalCodes?: number;
  };
}

interface ScanStats {
  period: string;
  scansByDate: Array<{ date: string; count: string }>;
  scansByLocation: Array<{ geo_location: string; count: string }>;
}

interface BatchStats {
  period: string;
  batchesOverTime: Array<{ date: string; status: string; count: string }>;
  codesGenerated: Array<{ date: string; total: string }>;
  averageBatchSize: number;
}

interface HealthData {
  status: "healthy" | "degraded" | "error";
  timestamp: string;
  databases: {
    postgresql: "connected" | "disconnected";
    mysql: "connected" | "disconnected";
  };
  issues: {
    hasIssues: boolean;
    failedBatches: number;
    stuckBatches: number;
  };
}

type PeriodType = "7d" | "30d" | "90d";

export default function DashboardPage() {
  const { token } = useAuth();
  const t = useTranslations("Dashboard");

  // Data states
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [scanStats, setScanStats] = useState<ScanStats | null>(null);
  const [batchStats, setBatchStats] = useState<BatchStats | null>(null);
  const [healthData, setHealthData] = useState<HealthData | null>(null);

  // Loading states
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [loadingScans, setLoadingScans] = useState(true);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [loadingHealth, setLoadingHealth] = useState(true);

  // Period selectors
  const [scanPeriod, setScanPeriod] = useState<PeriodType>("7d");
  const [batchPeriod, setBatchPeriod] = useState<PeriodType>("30d");

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Fetch Overview
  const fetchOverview = useCallback(async () => {
    if (!token) return;
    setLoadingOverview(true);
    try {
      const response = await fetch("/api/v1/admin/dashboard/overview", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch overview");
      const result = await response.json();
      if (result.success) {
        setOverview(result.data);
      }
    } catch (err) {
      console.error("Error fetching overview:", err);
      setError("Failed to load dashboard overview");
    } finally {
      setLoadingOverview(false);
    }
  }, [token]);

  // Fetch Activity
  const fetchActivity = useCallback(async () => {
    if (!token) return;
    setLoadingActivities(true);
    try {
      const response = await fetch("/api/v1/admin/dashboard/activity?limit=10", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch activity");
      const result = await response.json();
      if (result.success) {
        setActivities(result.data);
      }
    } catch (err) {
      console.error("Error fetching activity:", err);
    } finally {
      setLoadingActivities(false);
    }
  }, [token]);

  // Fetch Scan Stats
  const fetchScanStats = useCallback(async (period: PeriodType) => {
    if (!token) return;
    setLoadingScans(true);
    try {
      const response = await fetch(
        `/api/v1/admin/dashboard/scans/stats?period=${period}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error("Failed to fetch scan stats");
      const result = await response.json();
      if (result.success) {
        setScanStats(result.data);
      }
    } catch (err) {
      console.error("Error fetching scan stats:", err);
    } finally {
      setLoadingScans(false);
    }
  }, [token]);

  // Fetch Batch Stats
  const fetchBatchStats = useCallback(async (period: PeriodType) => {
    if (!token) return;
    setLoadingBatches(true);
    try {
      const response = await fetch(
        `/api/v1/admin/dashboard/batches/stats?period=${period}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error("Failed to fetch batch stats");
      const result = await response.json();
      if (result.success) {
        setBatchStats(result.data);
      }
    } catch (err) {
      console.error("Error fetching batch stats:", err);
    } finally {
      setLoadingBatches(false);
    }
  }, [token]);

  // Fetch Health
  const fetchHealth = useCallback(async () => {
    if (!token) return;
    setLoadingHealth(true);
    try {
      const response = await fetch("/api/v1/admin/dashboard/health", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch health");
      const result = await response.json();
      if (result.success) {
        setHealthData(result.data);
      }
    } catch (err) {
      console.error("Error fetching health:", err);
    } finally {
      setLoadingHealth(false);
    }
  }, [token]);

  // Initial fetch
  useEffect(() => {
    if (token) {
      fetchOverview();
      fetchActivity();
      fetchScanStats(scanPeriod);
      fetchBatchStats(batchPeriod);
      fetchHealth();
    }
  }, [token, fetchOverview, fetchActivity, fetchHealth]);

  // Refetch on period change
  useEffect(() => {
    if (token) {
      fetchScanStats(scanPeriod);
    }
  }, [scanPeriod, token, fetchScanStats]);

  useEffect(() => {
    if (token) {
      fetchBatchStats(batchPeriod);
    }
  }, [batchPeriod, token, fetchBatchStats]);

  const PeriodSelector = ({
    value,
    onChange,
  }: {
    value: PeriodType;
    onChange: (val: PeriodType) => void;
  }) => (
    <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
      {(["7d", "30d", "90d"] as PeriodType[]).map((period) => (
        <button
          key={period}
          onClick={() => onChange(period)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            value === period
              ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          {period === "7d" ? t("days7") : period === "30d" ? t("days30") : t("days90")}
        </button>
      ))}
    </div>
  );

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6">
      <PageBreadcrumb pageTitle={t("title")} />

      {error && (
        <div className="mb-6 rounded-lg border border-error-200 bg-error-50 p-4 text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("totalQRCodes")}
          value={loadingOverview ? "..." : overview?.qrCodes.total || 0}
          subtitle={
            overview
              ? `${overview.qrCodes.usagePercentage.toFixed(1)}% ${t("used")}`
              : undefined
          }
          color="primary"
          icon={
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
              />
            </svg>
          }
        />
        <StatCard
          title={t("totalScans")}
          value={loadingOverview ? "..." : overview?.scans.total || 0}
          subtitle={
            overview ? `${overview.scans.last24Hours} ${t("last24Hours")}` : undefined
          }
          color="success"
          icon={
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          }
        />
        <StatCard
          title={t("totalBatches")}
          value={loadingOverview ? "..." : overview?.batches.total || 0}
          subtitle={
            overview
              ? `${overview.batches.completed} ${t("completed")}, ${overview.batches.inProgress} ${t("inProgress")}`
              : undefined
          }
          color="warning"
          icon={
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          }
        />
        <StatCard
          title={t("catalogItems")}
          value={
            loadingOverview
              ? "..."
              : (overview?.catalog.brands || 0) +
                (overview?.catalog.products || 0)
          }
          subtitle={
            overview
              ? `${overview.catalog.brands} ${t("brands")}, ${overview.catalog.products} ${t("products")}`
              : undefined
          }
          color="info"
          icon={
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
          }
        />
      </div>

      {/* Charts Row */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Scan Trends Chart */}
        <div className="col-span-1 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
                {t("scanTrends")}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("codeGenerationOverTime")}
              </p>
            </div>
            <PeriodSelector value={scanPeriod} onChange={setScanPeriod} />
          </div>
          <ScanChart
            data={scanStats?.scansByDate || []}
            period={scanPeriod}
            loading={loadingScans}
          />
        </div>

        {/* Location Distribution */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-4">
            <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
              {t("scansByLocation")}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("geographicDistribution")}
            </p>
          </div>
          <LocationChart
            data={scanStats?.scansByLocation || []}
            loading={loadingScans}
          />
        </div>
      </div>

      {/* Second Charts Row */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Batch Statistics */}
        <div className="col-span-1 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
                {t("batchStatistics")}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("codeGenerationOverTime")}
              </p>
            </div>
            <PeriodSelector value={batchPeriod} onChange={setBatchPeriod} />
          </div>
          <BatchChart
            batchesOverTime={batchStats?.batchesOverTime || []}
            codesGenerated={batchStats?.codesGenerated || []}
            averageBatchSize={batchStats?.averageBatchSize || 0}
            loading={loadingBatches}
          />
        </div>

        {/* QR Code Distribution */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-4">
            <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
              {t("qrCodeStatus")}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("active")} vs {t("used")} distribution
            </p>
          </div>
          <QRCodeDistribution
            data={
              overview?.qrCodes.statusDistribution || {
                active: 0,
                used: 0,
              }
            }
            loading={loadingOverview}
          />
        </div>
      </div>

      {/* Activity and Health Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="col-span-1 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
                {t("recentActivity")}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("qrCodeScanned")} & {t("batchCreated")}
              </p>
            </div>
            <button
              onClick={() => fetchActivity()}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              title={t("refresh")}
            >
              <svg
                className={`h-5 w-5 ${loadingActivities ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            <ActivityFeed activities={activities} loading={loadingActivities} />
          </div>
        </div>

        {/* System Health */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
                {t("systemHealth")}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("databaseConnections")}
              </p>
            </div>
            <button
              onClick={() => fetchHealth()}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              title={t("refresh")}
            >
              <svg
                className={`h-5 w-5 ${loadingHealth ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
          <SystemHealth data={healthData} loading={loadingHealth} />
        </div>
      </div>
    </div>
  );
}
