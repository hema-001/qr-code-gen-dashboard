"use client";

import React from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface QRCodeDistributionProps {
  data: {
    active: number;
    used: number;
    inactive?: number;
  };
  loading?: boolean;
}

const QRCodeDistribution: React.FC<QRCodeDistributionProps> = ({
  data,
  loading = false,
}) => {
  const t = useTranslations("Dashboard");
  const labels: string[] = [];
  const seriesData: number[] = [];
  const colors: string[] = [];

  if (data.active > 0) {
    labels.push(t("active"));
    seriesData.push(data.active);
    colors.push("#10B981");
  }
  if (data.used > 0) {
    labels.push(t("used"));
    seriesData.push(data.used);
    colors.push("#465fff");
  }
  if (data.inactive && data.inactive > 0) {
    labels.push(t("inactive"));
    seriesData.push(data.inactive);
    colors.push("#6B7280");
  }

  const options: ApexOptions = {
    chart: {
      type: "pie",
      fontFamily: "Outfit, sans-serif",
    },
    colors,
    labels,
    legend: {
      position: "bottom",
      fontFamily: "Outfit, sans-serif",
      labels: {
        colors: "#6B7280",
      },
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        return val.toFixed(1) + "%";
      },
    },
    tooltip: {
      theme: "dark",
      y: {
        formatter: (value: number) => `${value.toLocaleString()} ${t("codes")}`,
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 280,
          },
          legend: {
            position: "bottom",
          },
        },
      },
    ],
  };

  if (loading) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (seriesData.length === 0 || seriesData.every((v) => v === 0)) {
    return (
      <div className="flex h-[200px] flex-col items-center justify-center text-center">
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
            d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {t("noDataAvailable")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full items-center justify-center">
      <ReactApexChart
        options={options}
        series={seriesData}
        type="pie"
        height={200}
      />
    </div>
  );
};

export default QRCodeDistribution;
