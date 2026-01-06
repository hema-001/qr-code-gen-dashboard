"use client";

import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "primary" | "success" | "warning" | "error" | "info";
}

const colorClasses = {
  primary: "bg-brand-50 text-brand-500 dark:bg-brand-500/15",
  success: "bg-success-50 text-success-600 dark:bg-success-500/15",
  warning: "bg-warning-50 text-warning-600 dark:bg-warning-500/15",
  error: "bg-error-50 text-error-600 dark:bg-error-500/15",
  info: "bg-blue-light-50 text-blue-light-500 dark:bg-blue-light-500/15",
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = "primary",
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorClasses[color]}`}
        >
          {icon}
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              trend.isPositive ? "text-success-600" : "text-error-600"
            }`}
          >
            <svg
              className={`h-4 w-4 ${!trend.isPositive && "rotate-180"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 15l7-7 7 7"
              />
            </svg>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        <h4 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          {typeof value === "number" ? value.toLocaleString() : value}
        </h4>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{title}</p>
        {subtitle && (
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
