"use client";

import React from "react";
import { useTranslations } from "next-intl";
import Badge from "@/components/ui/badge/Badge";

interface SystemHealthProps {
  data: {
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
  } | null;
  loading?: boolean;
}

const SystemHealth: React.FC<SystemHealthProps> = ({
  data,
  loading = false,
}) => {
  const t = useTranslations("Dashboard");
  const getStatusColor = (
    status: "healthy" | "degraded" | "error"
  ): "success" | "warning" | "error" => {
    switch (status) {
      case "healthy":
        return "success";
      case "degraded":
        return "warning";
      case "error":
        return "error";
    }
  };

  const getConnectionBadge = (status: "connected" | "disconnected") => {
    return (
      <Badge
        size="sm"
        color={status === "connected" ? "success" : "error"}
      >
        {status === "connected" ? t("connected") : t("disconnected")}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex animate-pulse items-center justify-between">
            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-6 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <svg
          className="h-12 w-12 text-gray-300 dark:text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Unable to fetch system health
        </p>
      </div>
    );
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-4">
      {/* Overall Status */}
      <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
        <div className="flex items-center gap-3">
          <div
            className={`h-3 w-3 rounded-full ${
              data.status === "healthy"
                ? "animate-pulse bg-success-500"
                : data.status === "degraded"
                ? "animate-pulse bg-warning-500"
                : "animate-pulse bg-error-500"
            }`}
          />
          <span className="text-sm font-medium text-gray-800 dark:text-white/90">
            {t("systemHealth")}
          </span>
        </div>
        <Badge size="sm" color={getStatusColor(data.status)}>
          {data.status === "healthy" ? t("healthy") : data.status === "degraded" ? t("degraded") : t("error")}
        </Badge>
      </div>

      {/* Database Connections */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("databaseConnections")}
        </h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              PostgreSQL
            </span>
            {getConnectionBadge(data.databases.postgresql)}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              MySQL
            </span>
            {getConnectionBadge(data.databases.mysql)}
          </div>
        </div>
      </div>

      {/* Issues */}
      {data.issues.hasIssues && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("activeIssues")}
          </h4>
          <div className="space-y-2">
            {data.issues.failedBatches > 0 && (
              <div className="flex items-center justify-between rounded-lg border border-error-200 bg-error-50 p-3 dark:border-error-500/30 dark:bg-error-500/10">
                <span className="text-sm text-error-700 dark:text-error-400">
                  {t("failedBatches")}
                </span>
                <span className="text-sm font-medium text-error-700 dark:text-error-400">
                  {data.issues.failedBatches}
                </span>
              </div>
            )}
            {data.issues.stuckBatches > 0 && (
              <div className="flex items-center justify-between rounded-lg border border-warning-200 bg-warning-50 p-3 dark:border-warning-500/30 dark:bg-warning-500/10">
                <span className="text-sm text-warning-700 dark:text-warning-400">
                  {t("stuckBatches")}
                </span>
                <span className="text-sm font-medium text-warning-700 dark:text-warning-400">
                  {data.issues.stuckBatches}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="pt-2 text-xs text-gray-500 dark:text-gray-400">
        {t("lastUpdated")}: {formatTimestamp(data.timestamp)}
      </div>
    </div>
  );
};

export default SystemHealth;
