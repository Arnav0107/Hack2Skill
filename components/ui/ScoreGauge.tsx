"use client";

import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
} from "chart.js";
import { getScoreBandColor, getBandFromScore, getBandLabel } from "@/lib/utils";

ChartJS.register(ArcElement, Tooltip);

interface ScoreGaugeProps {
  score: number;
  size?: number;
}

export default function ScoreGauge({ score, size = 220 }: ScoreGaugeProps) {
  const band = getBandFromScore(score);
  const color = getScoreBandColor(band);
  const label = getBandLabel(band);

  const data = {
    datasets: [
      {
        data: [score, 100 - score],
        backgroundColor: [color, "#EDE9DF"],
        borderWidth: 0,
        circumference: 270,
        rotation: 225,
      },
    ],
  };

  const options = {
    responsive: false,
    cutout: "72%",
    animation: {
      duration: 1200,
      easing: "easeOutQuart" as const,
    },
    plugins: {
      tooltip: { enabled: false },
      legend: { display: false },
    },
  };

  return (
    <div
      style={{ width: size, height: size }}
      className="relative flex items-center justify-center"
    >
      <Doughnut data={data} options={options} width={size} height={size} />
      {/* Centered label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{ paddingBottom: "18px" }}>
        <span
          className="font-serif font-semibold"
          style={{ fontSize: size * 0.22, color, lineHeight: 1 }}
        >
          {score}
        </span>
        <span
          className="eyebrow mt-1"
          style={{ fontSize: size * 0.065, color, letterSpacing: "0.1em" }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
