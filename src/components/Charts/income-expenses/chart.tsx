"use client"

import dynamic from "next/dynamic"
import { useIsMobile } from "@/hooks/use-mobile"
import type { ApexOptions } from "apexcharts"

const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
})

type PropsType = {
  data: {
    income: { x: string; y: number }[]
    expenses: { x: string; y: number }[]
  }
}

export function IncomeExpensesChart({ data }: PropsType) {
  const isMobile = useIsMobile()

  const options: ApexOptions = {
    legend: {
      show: false,
    },
    colors: ["#219653", "#D34053"], // Green for income, Red for expenses
    chart: {
      height: 310,
      type: "area",
      toolbar: {
        show: false,
      },
      fontFamily: "inherit",
    },
    fill: {
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    responsive: [
      {
        breakpoint: 1024,
        options: {
          chart: {
            height: 300,
          },
        },
      },
      {
        breakpoint: 1366,
        options: {
          chart: {
            height: 320,
          },
        },
      },
    ],
    stroke: {
      curve: "smooth",
      width: isMobile ? 2 : 3,
    },
    grid: {
      strokeDashArray: 5,
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      marker: {
        show: true,
      },
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
    xaxis: {
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
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
  }

  return (
    <div className="-ml-4 -mr-5 h-[310px]">
      <Chart
        options={options}
        series={[
          {
            name: "Income",
            data: data.income,
          },
          {
            name: "Expenses",
            data: data.expenses,
          },
        ]}
        type="area"
        height={310}
      />
    </div>
  )
}

