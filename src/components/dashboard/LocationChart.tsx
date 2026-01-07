"use client";

import React from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface LocationChartProps {
  data: Array<{
    geo_location: string;
    count: string | number;
  }>;
  loading?: boolean;
}

const LocationChart: React.FC<LocationChartProps> = ({
  data,
  loading = false,
}) => {
  const t = useTranslations("Dashboard");
  const topLocations = data.slice(0, 6);
  const labels = topLocations.map(
    (item) => item.geo_location || "Unknown"
  );
  const seriesData = topLocations.map((item) => Number(item.count));

  const options: ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "Outfit, sans-serif",
    },
    colors: [
      "#465fff",
      "#10B981",
      "#F59E0B",
      "#EF4444",
      "#8B5CF6",
      "#EC4899",
    ],
    labels,
    legend: {
      position: "bottom",
      fontFamily: "Outfit, sans-serif",
      labels: {
        colors: "#6B7280",
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          labels: {
            show: true,
            total: {
              show: true,
              label: t("totalScans"),
              fontSize: "14px",
              fontWeight: 500,
              color: "#6B7280",
              formatter: function (w: { globals: { seriesTotals: number[] } }) {
                return w.globals.seriesTotals
                  .reduce((a: number, b: number) => a + b, 0)
                  .toLocaleString();
              },
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      theme: "dark",
      y: {
        formatter: (value: number) => `${value.toLocaleString()} ${t("scans")}`,
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
      <div className="flex h-[300px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] flex-col items-center justify-center text-center">
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
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
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
        type="donut"
        height={300}
      />
    </div>
  );
};

export default LocationChart;
