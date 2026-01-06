"use client";

import React from "react";
import Badge from "@/components/ui/badge/Badge";

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

interface ActivityFeedProps {
  activities: ActivityItem[];
  loading?: boolean;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  loading = false,
}) => {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getActivityIcon = (type: "scan" | "batch") => {
    if (type === "scan") {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/15">
          <svg
            className="h-5 w-5"
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
        </div>
      );
    }
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success-50 text-success-600 dark:bg-success-500/15">
        <svg
          className="h-5 w-5"
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
      </div>
    );
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const statusLower = status.toLowerCase();
    let color: "success" | "warning" | "error" | "info" = "info";
    if (statusLower === "completed") color = "success";
    else if (statusLower === "in_progress" || statusLower === "processing")
      color = "warning";
    else if (statusLower === "failed") color = "error";

    return (
      <Badge size="sm" color={color}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex animate-pulse items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1">
              <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="mt-2 h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
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
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          No recent activity
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div
          key={index}
          className="flex items-start gap-4 rounded-lg p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
        >
          {getActivityIcon(activity.type)}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {activity.type === "scan" ? (
                  <>
                    QR Code Scanned
                    {activity.data.brand && activity.data.model && (
                      <span className="font-normal text-gray-500 dark:text-gray-400">
                        {" "}
                        - {activity.data.brand} {activity.data.model}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    Batch Created
                    {activity.data.batchName && (
                      <span className="font-normal text-gray-500 dark:text-gray-400">
                        {" "}
                        - {activity.data.batchName}
                      </span>
                    )}
                  </>
                )}
              </p>
              {activity.type === "batch" && getStatusBadge(activity.data.status)}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
              <span>{formatTimestamp(activity.timestamp)}</span>
              {activity.type === "scan" && activity.data.location && (
                <span className="flex items-center gap-1">
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {activity.data.location}
                </span>
              )}
              {activity.type === "batch" && activity.data.totalCodes && (
                <span>{activity.data.totalCodes} codes</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityFeed;
