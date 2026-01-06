"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface BatchChartProps {
  batchesOverTime: Array<{
    date: string;
    status: string;
    count: string | number;
  }>;
  codesGenerated: Array<{
    date: string;
    total: string | number;
  }>;
  averageBatchSize: number;
  loading?: boolean;
}

const BatchChart: React.FC<BatchChartProps> = ({
  batchesOverTime,
  codesGenerated,
  averageBatchSize,
  loading = false,
}) => {
  // Group batches by date and sum counts
  const batchesByDate = batchesOverTime.reduce(
    (acc, item) => {
      const date = item.date;
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += Number(item.count);
      return acc;
    },
    {} as Record<string, number>
  );

  const categories = codesGenerated.map((item) => {
    const date = new Date(item.date);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });

  const codesData = codesGenerated.map((item) => Number(item.total));
  const batchesData = codesGenerated.map((item) =>
    batchesByDate[item.date] ? batchesByDate[item.date] : 0
  );

  const options: ApexOptions = {
    chart: {
      type: "bar",
      height: 300,
      fontFamily: "Outfit, sans-serif",
      toolbar: {
        show: false,
      },
      stacked: false,
    },
    colors: ["#465fff", "#10B981"],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        borderRadius: 4,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"],
    },
    xaxis: {
      categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          colors: "#6B7280",
          fontSize: "12px",
        },
      },
    },
    yaxis: [
      {
        title: {
          text: "Codes Generated",
          style: {
            color: "#465fff",
            fontSize: "12px",
          },
        },
        labels: {
          style: {
            colors: "#6B7280",
            fontSize: "12px",
          },
          formatter: (value: number) => value.toFixed(0),
        },
      },
      {
        opposite: true,
        title: {
          text: "Batches Created",
          style: {
            color: "#10B981",
            fontSize: "12px",
          },
        },
        labels: {
          style: {
            colors: "#6B7280",
            fontSize: "12px",
          },
          formatter: (value: number) => value.toFixed(0),
        },
      },
    ],
    grid: {
      borderColor: "#E5E7EB",
      strokeDashArray: 4,
    },
    tooltip: {
      theme: "dark",
      shared: true,
      intersect: false,
    },
    legend: {
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit, sans-serif",
      labels: {
        colors: "#6B7280",
      },
    },
  };

  const series = [
    {
      name: "Codes Generated",
      data: codesData,
    },
    {
      name: "Batches Created",
      data: batchesData,
    },
  ];

  if (loading) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (codesGenerated.length === 0) {
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
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          No batch data available for this period
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Average Batch Size:{" "}
          <span className="font-medium text-gray-800 dark:text-white">
            {averageBatchSize.toLocaleString()} codes
          </span>
        </div>
      </div>
      <ReactApexChart
        options={options}
        series={series}
        type="bar"
        height={300}
      />
    </div>
  );
};

export default BatchChart;
