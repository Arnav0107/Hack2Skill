"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

interface TrendChartProps {
  scores: number[];
  labels: string[];
  height?: number;
}

export default function TrendChart({ scores, labels, height = 120 }: TrendChartProps) {
  const data = {
    labels,
    datasets: [
      {
        data: scores,
        borderColor: "#1B3A2F",
        backgroundColor: "rgba(27, 58, 47, 0.06)",
        borderWidth: 1.75,
        pointBackgroundColor: "#1B3A2F",
        pointBorderColor: "#F7F4ED",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 5,
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 900,
      easing: "easeOutCubic" as const,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#FAF8F3",
        borderColor: "rgba(201, 166, 107, 0.4)",
        borderWidth: 1,
        titleColor: "#3A342C",
        bodyColor: "#6B6259",
        titleFont: { family: "Inter", size: 11, weight: "bold" as const },
        bodyFont: { family: "Inter", size: 11 },
        padding: 10,
        callbacks: {
          title: (items: any) => items[0]?.label ?? "",
          label: (item: any) => `Score: ${item.parsed.y}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          font: { family: "Inter", size: 10 },
          color: "#9B9188",
        },
      },
      y: {
        min: 0,
        max: 100,
        grid: {
          color: "rgba(201, 166, 107, 0.12)",
        },
        border: { display: false, dash: [3, 3] },
        ticks: {
          font: { family: "Inter", size: 10 },
          color: "#9B9188",
          stepSize: 25,
        },
      },
    },
  };

  return (
    <div style={{ height }}>
      <Line data={data} options={options} />
    </div>
  );
}
