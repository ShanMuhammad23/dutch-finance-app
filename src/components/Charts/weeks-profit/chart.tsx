"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

type PropsType = {
  data: {
    profit: { x: string; y: number }[];
  };
};

const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export function WeeksProfitChart({ data }: PropsType) {
  const options: ApexOptions = {
    colors: ["#219653", "#D34053"], // Green for positive, Red for negative
    chart: {
      type: "bar",
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
    },

    responsive: [
      {
        breakpoint: 1536,
        options: {
          plotOptions: {
            bar: {
              borderRadius: 3,
              columnWidth: "25%",
            },
          },
        },
      },
    ],
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 3,
        columnWidth: "40%",
        borderRadiusApplication: "end",
        colors: {
          ranges: [
            {
              from: -Infinity,
              to: 0,
              color: "#D34053", // Red for negative profit
            },
            {
              from: 0,
              to: Infinity,
              color: "#219653", // Green for positive profit
            },
          ],
        },
      },
    },
    dataLabels: {
      enabled: false,
    },

    grid: {
      strokeDashArray: 5,
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },

    xaxis: {
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    legend: {
      show: false,
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: (value: number) => {
          return new Intl.NumberFormat('da-DK', {
            style: 'currency',
            currency: 'DKK',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(value)
        },
      },
    },
    yaxis: {
      labels: {
        formatter: (value: number) => {
          return new Intl.NumberFormat('da-DK', {
            notation: 'compact',
            maximumFractionDigits: 1,
          }).format(value)
        },
      },
    },
  };
  return (
    <div className="-ml-3.5 mt-3">
      <Chart
        options={options}
        series={[
          {
            name: "Profit",
            data: data.profit,
          },
        ]}
        type="bar"
        height={370}
      />
    </div>
  );
}
