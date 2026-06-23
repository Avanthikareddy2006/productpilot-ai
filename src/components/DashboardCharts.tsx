import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { AnalyticsData } from "../types";

interface ChartsProps {
  analytics: AnalyticsData;
  isDark: boolean;
}

export const DashboardCharts: React.FC<ChartsProps> = ({ analytics, isDark }) => {
  const textColor = isDark ? "#94a3b8" : "#475569";
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";

  const COLORS = ["#10b981", "#3b82f6", "#ef4444"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-6">
      {/* Chart 1: Sales / Market Trends */}
      <div className={`p-5 border-t-4 border-t-emerald-500 border transition-all ${
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-205 shadow-xs"
      }`}>
        <h4 className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-1">
          Sales & Competitor Trend
        </h4>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 h-8 font-medium">
          Historical volumes vs. prime competitors over successive periods.
        </p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics.trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="period" stroke={textColor} fontSize={10} tickLine={false} />
              <YAxis stroke={textColor} fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#0f172a" : "#ffffff",
                  borderColor: isDark ? "#1e293b" : "#cbd5e1",
                  color: isDark ? "#f8fafc" : "#0f172a",
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Line
                name="Our Sales / Projected"
                type="monotone"
                dataKey="sales"
                stroke="#10b981"
                strokeWidth={3}
                activeDot={{ r: 8 }}
              />
              <Line
                name="Top Competitor"
                type="monotone"
                dataKey="competitor"
                stroke="#6366f1"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Customer Sentiment Breakdown */}
      <div className={`p-5 border-t-4 border-t-indigo-500 border transition-all ${
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-205 shadow-xs"
      }`}>
        <h4 className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-1">
          Customer Sentiment Index
        </h4>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 h-8 font-medium">
          Visualizing positive, neutral, and critical feedback proportions.
        </p>
        <div className="h-64 flex flex-col justify-between">
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analytics.sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#0f172a" : "#ffffff",
                    borderColor: isDark ? "#1e293b" : "#cbd5e1",
                    color: isDark ? "#f8fafc" : "#0f172a",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-around text-[10px] mt-2 font-bold uppercase tracking-wider">
            {analytics.sentimentData.map((d, index) => (
              <div key={d.rating} className="flex items-center space-x-1.5">
                <span
                  className="w-2.5 h-2.5"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-slate-500">{d.rating}:</span>
                <span className="opacity-80 font-mono">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart 3: Projections & Campaign Growth */}
      <div className={`p-5 border-t-4 border-t-blue-500 border transition-all ${
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-205 shadow-xs"
      }`}>
        <h4 className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-1">
          Revitalization Growth Outcomes
        </h4>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 h-8 font-medium">
          Comparing campaign-leveraged scenarios against flat baseline projections.
        </p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.growthPredictions}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="period" stroke={textColor} fontSize={10} tickLine={false} />
              <YAxis stroke={textColor} fontSize={10} tickLine={false} />
              <Tooltip
                formatter={(v) => [`$${Number(v).toLocaleString()}`, "Expected Revenue"]}
                contentStyle={{
                  backgroundColor: isDark ? "#0f172a" : "#ffffff",
                  borderColor: isDark ? "#1e293b" : "#cbd5e1",
                  color: isDark ? "#f8fafc" : "#0f172a",
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="rect" />
              <Bar name="With Pilot Campaigns" dataKey="withMarketing" fill="#3b82f6" />
              <Bar name="Baseline Status" dataKey="baseline" fill="#9ca3af" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
