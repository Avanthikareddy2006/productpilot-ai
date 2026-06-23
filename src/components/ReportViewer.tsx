import React, { useState } from "react";
import {
  FileText,
  Printer,
  TrendingUp,
  Award,
  CheckCircle,
  Clock,
  Compass,
  Layers,
  Sparkles,
  Search,
  MessageSquare,
  DollarSign,
  Briefcase,
  Wrench,
  Megaphone,
  CheckSquare,
} from "lucide-react";
import { Project, AgentReport } from "../types";
import { DashboardCharts } from "./DashboardCharts";

interface ReportViewerProps {
  project: Project;
  isDark: boolean;
  currentUserRole: string;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({ project, isDark, currentUserRole }) => {
  const [activeTab, setActiveTab] = useState<"executive" | "mba" | "pm" | "marketing" | "analytics">("executive");
  const [featureVotes, setFeatureVotes] = useState<Record<string, boolean>>({});

  const report = project.report;
  if (!report) {
    return (
      <div className="p-8 text-center opacity-60">
        No generated multi-agent reports available for this drafting project.
      </div>
    );
  }

  const toggleFeatureVote = (feature: string) => {
    setFeatureVotes((prev) => ({ ...prev, [feature]: !prev[feature] }));
  };

  const handleDownloadReport = () => {
    const rawData = `=========================================
PRODUCTPILOT AI STRATEGY COMPILATION
=========================================
Project Name: ${project.name}
Category: ${project.input1?.category || project.input2?.category || "Industrial FMCG"}
Role Consulted: ${currentUserRole}
Draft Date: ${new Date(report.createdAt).toLocaleDateString()}
Status: Completed Team Verification

=========================================
1. EXECUTIVE SUMMARY
=========================================
${report.executiveSummary}

=========================================
2. MBA ANALYST STRATEGIC REPORT
=========================================
Market Sizing and Research:
${report.mbaReport.marketResearch}

Competitor Analysis:
${report.mbaReport.competitorAnalysis}

SWOT Assessment:
- Strengths: ${report.mbaReport.swotAnalysis.strengths.join(", ")}
- Weaknesses: ${report.mbaReport.swotAnalysis.weaknesses.join(", ")}
- Opportunities: ${report.mbaReport.swotAnalysis.opportunities.join(", ")}
- Threats: ${report.mbaReport.swotAnalysis.threats.join(", ")}

Demand Forecasting:
${report.mbaReport.demandForecasting}

Revenue Projection Models:
${report.mbaReport.revenueEstimation}

Assumed Business Viability Insights:
${report.mbaReport.insights}

=========================================
3. PRODUCT MANAGEMENT SPECIFICATION
=========================================
Product Requirements Document (PRD):
${report.pmReport.prd}

Core Product Features Proposed:
${report.pmReport.features.map((f) => `- [ ] ${f}`).join("\n")}

Technical Specifications:
${report.pmReport.specifications.map((s) => `- ${s}`).join("\n")}

Interactive Roadmap Chronology:
${report.pmReport.roadmap.map((r) => `- ${r}`).join("\n")}

Retail Tier Pricing Strategy:
${report.pmReport.pricingStrategy}

operational Recommendations:
${report.pmReport.recommendations}

=========================================
4. CREATIVE MARKETING STRATEGY
=========================================
Brand Name Concepts:
${report.marketingReport.brandingSuggestions.map((b) => `- ${b}`).join("\n")}

Tagline Proposals:
${report.marketingReport.taglineSuggestions.map((t) => `- ${t}`).join("\n")}

Go-To-Market Strategies:
${report.marketingReport.strategy}

Planned Campaigns:
${report.marketingReport.campaigns.map((c) => `- ${c}`).join("\n")}

Launch Blueprint Chronology:
${report.marketingReport.launchPlan}

=========================================
Report compiled automatically via ProductPilot AI Multi-Agent Boardroom Engine.
`;

    const blob = new Blob([rawData], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${project.name.replace(/\D/g, "_")}_boardroom_digest.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Upper Meta Bar */}
      <div className={`p-4 flex flex-wrap items-center justify-between gap-4 border-l-4 border-l-indigo-500 border ${
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xs"
      }`}>
        <div className="flex items-center space-x-3 text-xs">
          <Clock className="w-4 h-4 text-indigo-500" />
          <span className="uppercase text-[9px] font-bold text-slate-500 tracking-wider">Report Generated:</span>
          <span className="font-mono text-slate-700 dark:text-slate-350">{new Date(report.createdAt).toLocaleString()}</span>
          <span className="w-1 h-3 bg-slate-200 dark:bg-slate-700" />
          <span className="font-bold tracking-widest text-[9px] uppercase px-2.2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border border-indigo-205 dark:border-indigo-900">
            {project.type.replace("_", " ")}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadReport}
            className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center space-x-1.5 transition uppercase tracking-wider"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Download Strategy Digest</span>
          </button>
          <button
            onClick={handleTriggerPrint}
            className="p-2 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 bg-slate-100 text-xs border border-slate-205 dark:border-slate-700 text-slate-700 dark:text-slate-350"
            title="Print Report as PDF"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs list with razor sharp design */}
      <div className="flex space-x-1 border-b border-slate-200 dark:border-slate-800 pb-0 overflow-x-auto">
        <button
          onClick={() => setActiveTab("executive")}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-widest border-b-2 whitespace-nowrap transition ${
            activeTab === "executive"
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-450 bg-indigo-50/5 dark:bg-indigo-950/10 font-bold"
              : "border-transparent text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          }`}
        >
          Executive Brief
        </button>
        <button
          onClick={() => setActiveTab("mba")}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-widest border-b-2 whitespace-nowrap transition ${
            activeTab === "mba"
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-450 bg-indigo-50/5 dark:bg-indigo-950/10 font-bold"
              : "border-transparent text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          }`}
        >
          MBA Analyst Board
        </button>
        <button
          onClick={() => setActiveTab("pm")}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-widest border-b-2 whitespace-nowrap transition ${
            activeTab === "pm"
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-450 bg-indigo-50/5 dark:bg-indigo-950/10 font-bold"
              : "border-transparent text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          }`}
        >
          PRD Spec Board
        </button>
        <button
          onClick={() => setActiveTab("marketing")}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-widest border-b-2 whitespace-nowrap transition ${
            activeTab === "marketing"
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-450 bg-indigo-50/5 dark:bg-indigo-950/10 font-bold"
              : "border-transparent text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          }`}
        >
          Creative Marketing
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-widest border-b-2 whitespace-nowrap transition ${
            activeTab === "analytics"
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-450 bg-indigo-50/5 dark:bg-indigo-950/10 font-bold"
              : "border-transparent text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          }`}
        >
          Projections Dashboard
        </button>
      </div>

      {/* TAB CONTENT 1: EXECUTIVE BRIEF */}
      {activeTab === "executive" && (
        <div className="space-y-6">
          <div className={`p-6 border-t-4 border-t-pink-500 border transition-all ${
            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-205 shadow-xs"
          }`}>
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider border border-pink-500/20 bg-pink-100/50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-400">
                Primary Executive Brief
              </span>
              <span className="text-[10px] text-pink-600 font-bold uppercase tracking-widest">Live Synth</span>
            </div>
            
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-350 font-medium">
              {report.executiveSummary}
            </p>
          </div>

          {/* Virtual Board Card Panel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              onClick={() => setActiveTab("mba")}
              className={`p-6 border-t-4 border-t-indigo-500 border cursor-pointer hover:border-indigo-400 transition-all ${
                isDark ? "bg-slate-900/60 border-slate-800 hover:bg-slate-900" : "bg-white border-slate-205 hover:bg-slate-50"
              }`}
            >
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border border-indigo-200 bg-indigo-50 dark:bg-slate-850 text-indigo-700 dark:text-indigo-400">
                  MBA Analyst Agent
                </span>
                <span className="text-[9px] text-slate-400 font-bold uppercase">Role 1</span>
              </div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">Market Viability Core</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                Secures competitive SWOT matrices, calculates cost of goods sold, and generates feasibility scores.
              </p>
              <div className="flex items-center justify-end text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
                <span>View viability logs →</span>
              </div>
            </div>

            <div
              onClick={() => setActiveTab("pm")}
              className={`p-6 border-t-4 border-t-emerald-500 border cursor-pointer hover:border-emerald-400 transition-all ${
                isDark ? "bg-slate-900/60 border-slate-800 hover:bg-slate-900" : "bg-white border-slate-205 hover:bg-slate-50"
              }`}
            >
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border border-emerald-200 bg-emerald-50 dark:bg-slate-850 text-emerald-700 dark:text-emerald-400">
                  Product Manager
                </span>
                <span className="text-[9px] text-slate-400 font-bold uppercase">Role 2</span>
              </div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">Sprint Specifications</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                Transforms goals into high-integrity user stories, PRD documents, dynamic specifications, and checklists.
              </p>
              <div className="flex items-center justify-end text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                <span>Draft specifications →</span>
              </div>
            </div>

            <div
              onClick={() => setActiveTab("marketing")}
              className={`p-6 border-t-4 border-t-amber-500 border cursor-pointer hover:border-amber-400 transition-all ${
                isDark ? "bg-slate-900/60 border-slate-800 hover:bg-slate-900" : "bg-white border-slate-205 hover:bg-slate-50"
              }`}
            >
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border border-amber-200 bg-amber-50 dark:bg-slate-850 text-amber-700 dark:text-amber-400">
                  Marketing Director
                </span>
                <span className="text-[9px] text-slate-400 font-bold uppercase">Role 3</span>
              </div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">Campaigns & Branding</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                Establishes brand tagline concepts, templates creative campaigns, and constructs launch countdown lists.
              </p>
              <div className="flex items-center justify-end text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
                <span>Explore branding v2 →</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: MBA ANALYST */}
      {activeTab === "mba" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`col-span-1 lg:col-span-2 p-6 border-t-4 border-t-indigo-500 border ${
              isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xs"
            }`}>
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border border-teal-200 bg-teal-50 dark:bg-slate-800 text-teal-700 dark:text-teal-400">
                  Market Sizing Summary
                </span>
                <span className="text-[10px] text-teal-600 font-bold uppercase tracking-widest">Active Analysis</span>
              </div>
              <div className="space-y-5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                <div className="p-4 bg-slate-50 dark:bg-slate-850/50 border border-slate-200">
                  <h4 className="font-extrabold text-[10px] uppercase tracking-widest text-indigo-700 dark:text-indigo-400 mb-2">
                    Primary Market Research Report
                  </h4>
                  <p className="font-medium text-slate-600 dark:text-slate-350 leading-relaxed">
                    {report.mbaReport.marketResearch}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-850/50 border border-slate-200">
                  <h4 className="font-extrabold text-[10px] uppercase tracking-widest text-indigo-700 dark:text-indigo-400 mb-2">
                    Competitor Intelligence Analysis
                  </h4>
                  <p className="font-medium text-slate-600 dark:text-slate-355 leading-relaxed">
                    {report.mbaReport.competitorAnalysis}
                  </p>
                </div>
              </div>
            </div>

            {/* SWOT ANALYST MATRIX DISPLAY */}
            <div className={`p-6 border-t-4 border-t-pink-500 border flex flex-col justify-between ${
              isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xs"
            }`}>
              <div>
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border border-pink-200 bg-pink-150/10 text-pink-700 dark:text-pink-400">
                    S.W.O.T. Strategic Matrix
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 grow">
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/20">
                  <h4 className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 tracking-wider mb-2 uppercase">STRENGTHS</h4>
                  <ul className="text-[11px] space-y-1.5 list-none text-slate-650 dark:text-slate-300 font-medium">
                    {report.mbaReport.swotAnalysis.strengths.slice(0, 3).map((s, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-emerald-500 mr-1.5 font-bold">▪</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 bg-red-500/5 border border-red-500/20">
                  <h4 className="text-[10px] font-black text-red-700 dark:text-red-400 tracking-wider mb-2 uppercase">WEAKNESSES</h4>
                  <ul className="text-[11px] space-y-1.5 list-none text-slate-650 dark:text-slate-300 font-medium font-medium">
                    {report.mbaReport.swotAnalysis.weaknesses.slice(0, 3).map((w, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-red-500 mr-1.5 font-bold">▪</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 bg-indigo-500/5 border border-indigo-500/20">
                  <h4 className="text-[10px] font-black text-indigo-700 dark:text-indigo-400 tracking-wider mb-2 uppercase">OPPORTUNITIES</h4>
                  <ul className="text-[11px] space-y-1.5 list-none text-slate-650 dark:text-slate-300 font-medium font-medium">
                    {report.mbaReport.swotAnalysis.opportunities.slice(0, 3).map((o, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-indigo-500 mr-1.5 font-bold">▪</span>
                        <span>{o}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 bg-amber-500/5 border border-amber-500/20">
                  <h4 className="text-[10px] font-black text-amber-700 dark:text-amber-400 tracking-wider mb-2 uppercase">THREATS</h4>
                  <ul className="text-[11px] space-y-1.5 list-none text-slate-650 dark:text-slate-300 font-medium font-medium">
                    {report.mbaReport.swotAnalysis.threats.slice(0, 3).map((t, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-amber-500 mr-1.5 font-bold">▪</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-5 border-t-2 border-t-teal-500 border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <h4 className="text-[10px] font-extrabold uppercase text-teal-600 dark:text-teal-400 tracking-wider mb-2">Demand Projections</h4>
              <p className="text-[11px] font-medium leading-relaxed opacity-80 text-slate-600 dark:text-slate-350">{report.mbaReport.demandForecasting}</p>
            </div>
            <div className={`p-5 border-t-2 border-t-indigo-500 border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <h4 className="text-[10px] font-extrabold uppercase text-indigo-600 dark:text-indigo-400 tracking-wider mb-2">Revenue Models</h4>
              <p className="text-[11px] font-medium leading-relaxed opacity-80 text-slate-600 dark:text-slate-355">{report.mbaReport.revenueEstimation}</p>
            </div>
            <div className={`p-5 border-t-2 border-t-purple-500 border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <h4 className="text-[10px] font-extrabold uppercase text-purple-600 dark:text-purple-400 tracking-wider mb-2">Viability Summary</h4>
              <p className="text-[11px] font-medium leading-relaxed opacity-80 text-slate-600 dark:text-slate-350">{report.mbaReport.insights}</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: PRODUCT MANAGER */}
      {activeTab === "pm" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`col-span-1 lg:col-span-2 p-6 border-t-4 border-t-emerald-500 border ${
              isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-205 shadow-xs"
            }`}>
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border border-emerald-200 bg-emerald-55/10 text-emerald-700 dark:text-emerald-400">
                  Product Requirements Document (PRD)
                </span>
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Active Spec</span>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-850/50 border border-slate-200 text-xs whitespace-pre-wrap font-mono leading-relaxed text-slate-700 dark:text-slate-300">
                  {report.pmReport.prd}
                </div>
              </div>
            </div>

            {/* Interactivity checklist story features */}
            <div className={`p-6 border-t-4 border-t-indigo-505 border-t-4 border-t-indigo-500 border ${
              isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-205 shadow-xs"
            }`}>
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border border-indigo-200 bg-indigo-55/10 text-indigo-755 dark:text-indigo-400">
                  Feature Verification Spec
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 font-medium">
                Verify or checkoff key proposed specifications.
              </p>
              <div className="space-y-3">
                {report.pmReport.features.map((feature, idx) => (
                  <div
                    key={idx}
                    onClick={() => toggleFeatureVote(feature)}
                    className={`p-3 border flex items-start space-x-3 cursor-pointer transition ${
                      featureVotes[feature]
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                        : isDark ? "border-slate-800 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={!!featureVotes[feature]}
                      onChange={() => {}}
                      className="mt-0.5 border-slate-300 text-indigo-600 focus:ring-indigo-400 cursor-pointer"
                    />
                    <span className={`text-[11px] font-semibold leading-normal ${
                      featureVotes[feature] ? "line-through opacity-60" : ""
                    }`}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`p-5 border-t-2 border-t-indigo-500 border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <h4 className="text-[10px] font-extrabold uppercase text-indigo-500 mb-3 flex items-center space-x-1.5 tracking-wider">
                <Layers className="w-3.5 h-3.5" />
                <span>Product Roadmap Timeline</span>
              </h4>
              <div className="space-y-4 text-xs font-medium">
                {report.pmReport.roadmap.map((step, idx) => (
                  <div key={idx} className="flex space-x-3 items-start">
                    <span className="w-5 h-5 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 border border-indigo-200 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="opacity-80 py-0.5 text-slate-600 dark:text-slate-350">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={`p-5 border-t-2 border-t-emerald-500 border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <h4 className="text-[10px] font-extrabold uppercase text-emerald-600 mb-3 flex items-center space-x-1.5 tracking-wider">
                <DollarSign className="w-3.5 h-3.5" />
                <span>Operational & Pricing Framework</span>
              </h4>
              <p className="text-[11px] leading-relaxed opacity-80 mb-3 text-slate-600 dark:text-slate-350 font-medium">{report.pmReport.pricingStrategy}</p>
              <div className="p-3 bg-slate-50 dark:bg-slate-850/50 border border-slate-200 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                <strong className="text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider text-[9px] block mb-1">Lead Directives:</strong> {report.pmReport.recommendations}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: MARKETING BRAND CREATIVE */}
      {activeTab === "marketing" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`p-6 border-t-4 border-t-amber-500 border lg:col-span-1 ${
              isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-205 shadow-xs"
            }`}>
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border border-amber-200 bg-amber-55/10 text-amber-700 dark:text-amber-400">
                  Brand Identity Suite
                </span>
                <span className="text-[9px] text-slate-400 font-bold uppercase">MM Spec</span>
              </div>

              <div className="space-y-5">
                <div>
                  <h4 className="text-[10px] uppercase font-extrabold tracking-widest text-slate-500 mb-2">Suggested Brand Names</h4>
                  <div className="grid grid-cols-1 gap-1.5 font-medium">
                    {report.marketingReport.brandingSuggestions.map((brand, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 text-xs font-bold tracking-tight border text-indigo-650 dark:text-indigo-400 ${
                          isDark ? "bg-slate-800/40 border-slate-700" : "bg-slate-50 border-slate-100"
                        }`}
                      >
                        {brand}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] uppercase font-extrabold tracking-widest text-slate-500 mb-2">Campaign Taglines</h4>
                  <div className="grid grid-cols-1 gap-1.5">
                    {report.marketingReport.taglineSuggestions.map((tagline, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 text-xs font-semibold italic border text-slate-755 dark:text-slate-300 ${
                          isDark ? "bg-slate-800/40 border-slate-700" : "bg-slate-50 border-slate-100"
                        }`}
                      >
                        "{tagline}"
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className={`col-span-1 lg:col-span-2 p-6 border-t-4 border-t-pink-500 border ${
              isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-205 shadow-xs"
            }`}>
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border border-pink-200 bg-pink-55/10 text-pink-700 dark:text-pink-400">
                  Digital Media Campaigns
                </span>
                <span className="text-[9px] text-slate-400 font-bold uppercase">Outlines</span>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-850 border text-xs leading-relaxed max-h-48 overflow-y-auto font-mono text-slate-600 dark:text-slate-350">
                  <strong className="text-pink-600 dark:text-pink-450 uppercase text-[9px] block mb-1">Integrated GTM Direction:</strong> {report.marketingReport.strategy}
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase font-extrabold tracking-widest text-slate-500">Interactive Campaigns</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-medium">
                    {report.marketingReport.campaigns.map((camp, index) => (
                      <div
                        key={index}
                        className={`p-4 border flex flex-col justify-between ${
                          isDark ? "bg-slate-800/40 border-slate-700" : "bg-slate-50 border-slate-100"
                        }`}
                      >
                        <span className="text-[9px] uppercase font-bold text-pink-500">Campaign #{index + 1}</span>
                        <p className="text-[11px] mt-2 leading-relaxed text-slate-600 dark:text-slate-350 font-semibold">{camp}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`p-6 border-t-2 border-t-indigo-500 border ${
            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <h4 className="text-[10px] font-extrabold uppercase text-indigo-500 tracking-wider mb-3">Campaign Launch Countdown Plan</h4>
            <p className="text-xs font-semibold leading-relaxed text-slate-600 dark:text-slate-350 whitespace-pre-wrap">
              {report.marketingReport.launchPlan}
            </p>
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: RECHARTS EXECUTIVE GRAPHS */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className={`p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-800/35 flex items-center space-x-3`}>
            <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <p className="text-xs leading-normal">
              <strong>Calculated Insights Dashboard:</strong> Analytics represent compiled data generated through multi-agency parameters including estimated regional CAGRs, simulated competitor price margins, and modeled user feedback sentiments.
            </p>
          </div>

          <DashboardCharts analytics={report.analytics || report} isDark={isDark} />
        </div>
      )}
    </div>
  );
};
