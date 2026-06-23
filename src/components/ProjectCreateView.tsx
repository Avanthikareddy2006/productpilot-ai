import React, { useState, useRef } from "react";
import { FolderPlus, HelpCircle, Upload, FileSpreadsheet, X, Sparkles, AlertCircle } from "lucide-react";
import { WorkflowType, Workflow1Input, Workflow2Input } from "../types";

interface ProjectCreateProps {
  onSubmit: (name: string, type: WorkflowType, input: any) => void;
  onCancel: () => void;
  isDark: boolean;
  userRole: string;
}

export const ProjectCreateView: React.FC<ProjectCreateProps> = ({ onSubmit, onCancel, isDark, userRole }) => {
  const [workflow, setWorkflow] = useState<WorkflowType>("new_product");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("SaaS Technology");

  // Workflow 1 States
  const [targetAudience, setTargetAudience] = useState("");
  const [budget, setBudget] = useState("");
  const [region, setRegion] = useState("Globall / Multiregional");
  const [businessGoal, setBusinessGoal] = useState("");

  // Workflow 2 States
  const [salesDataText, setSalesDataText] = useState("");
  const [reviewsText, setReviewsText] = useState("");
  const [competitorInfo, setCompetitorInfo] = useState("");
  const [description, setDescription] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState<string | undefined>(undefined);
  const [uploadedFileData, setUploadedFileData] = useState<string | undefined>(undefined);

  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse files
  const handleFile = (file: File) => {
    setFileError("");
    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "txt", "xlsx", "xls", "json", "report"].includes(extension || "")) {
      setFileError("Supported formats are CSV, TXT, Excel worksheets, or JSON reports.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setUploadedFileName(file.name);
      setUploadedFileData(content);

      // Auto-extract content into fields based on file name or content markers
      if (file.name.toLowerCase().includes("review") || content.includes("star") || content.includes("Review")) {
        setReviewsText((prev) => `${prev}\n[Imported from ${file.name}]:\n${content.substring(0, 800)}...`);
      } else {
        setSalesDataText((prev) => `${prev}\n[Imported from ${file.name}]:\n${content.substring(0, 800)}...`);
      }
    };
    reader.onerror = () => {
      setFileError("Unable to parse the specified spreadsheet file.");
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onFileSelectClick = () => {
    fileInputRef.current?.click();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (workflow === "new_product") {
      const input: Workflow1Input = {
        productName: name,
        category,
        targetAudience: targetAudience || "General Public",
        budget: budget || "$10,000",
        region,
        businessGoal: businessGoal || "Demonstrate product value & gather telemetry.",
      };
      onSubmit(name, "new_product", input);
    } else {
      const input: Workflow2Input = {
        productName: name,
        category,
        salesDataText: salesDataText || "Stable metrics",
        reviewsText: reviewsText || "Generally positive overall",
        competitorInfo: competitorInfo || "Mid-tier competitors",
        description: description || "An established product ecosystem.",
        uploadedFileName,
        uploadedFileData,
      };
      onSubmit(name, "improvement", input);
    }
  };

  return (
    <div className={`p-6 max-w-4xl mx-auto border-t-8 border-t-indigo-600 border transition-all ${
      isDark ? "bg-slate-900 border-slate-800 shadow-2xl" : "bg-white border-slate-205 shadow-xs"
    }`}>
      <div className="flex items-center justify-between border-b pb-4 mb-6 border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <FolderPlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-xl font-black uppercase tracking-wider">Launch Strategy Matrix</h2>
        </div>
        <button
          onClick={onCancel}
          className="p-1 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-xs text-slate-705 dark:text-slate-300 font-bold uppercase tracking-wider"
        >
          Cancel
        </button>
      </div>

      {/* Role Badge Helper */}
      <div className="mb-6 p-4 bg-indigo-125/10 bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <div>
            <span className="font-extrabold uppercase tracking-wider text-[10px] text-slate-500">Boardroom Consultant ROLE: </span>
            <span className="text-indigo-700 dark:text-indigo-400 font-bold tracking-tight">{userRole}</span>
          </div>
        </div>
        <span className="opacity-60 hidden md:inline text-[11px] font-medium text-slate-500">Spawning custom digital boardroom agent prompts depending on selected matrix.</span>
      </div>

      {/* Workflow Tabs */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button
          type="button"
          onClick={() => { setWorkflow("new_product"); }}
          className={`p-5 border-l-4 border text-left transition-all ${
            workflow === "new_product"
              ? "border-indigo-600 bg-slate-100/50 dark:bg-slate-850"
              : isDark ? "border-slate-800 hover:bg-slate-800" : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <div className="text-[10px] tracking-widest font-black uppercase mb-1 text-slate-400">Workflow 1</div>
          <p className="font-extrabold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-tight">New Product Design</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-450 mt-1 leading-relaxed">Ideate features, SWOTs, roadmap, naming, and launch programs.</p>
        </button>

        <button
          type="button"
          onClick={() => { setWorkflow("improvement"); }}
          className={`p-5 border-l-4 border text-left transition-all ${
            workflow === "improvement"
              ? "border-indigo-600 bg-slate-100/50 dark:bg-slate-850"
              : isDark ? "border-slate-800 hover:bg-slate-800" : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <div className="text-[10px] tracking-widest font-black uppercase mb-1 text-slate-400">Workflow 2</div>
          <p className="font-extrabold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-tight">Product Revitalization</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-455 mt-1 leading-relaxed">Audit sales declines, analyze reviews, adjust features & rebranding.</p>
        </button>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 opacity-80">
              Product Concept / Product Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. HydroGlow smart hydration flask"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full text-sm p-2.5 rounded-xl outline-hidden border focus:ring-2 focus:ring-indigo-500 ${
                isDark ? "bg-gray-700 border-gray-600 focus:bg-gray-600 text-white" : "bg-gray-50 border-gray-200 focus:bg-white text-gray-800"
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 opacity-80">
              Industry or Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`w-full text-sm p-2.5 rounded-xl outline-hidden border focus:ring-2 focus:ring-indigo-500 appearance-none ${
                isDark ? "bg-gray-700 border-gray-600 focus:bg-gray-600 text-white" : "bg-gray-50 border-gray-200 focus:bg-white text-gray-800"
              }`}
            >
              <option value="SaaS Technology / B2B">SaaS Technology / B2B</option>
              <option value="Consumer Health & Wearables">Consumer Health & Wearables</option>
              <option value="Sustainable Packaging & FMCGs">Sustainable Packaging & FMCG</option>
              <option value="E-Commerce & Smart Electronics">E-Commerce & Smart Electronics</option>
              <option value="FinTech & Digital Wallets">FinTech & Digital Wallets</option>
              <option value="Eco-friendly Apparel">Eco-friendly Apparel</option>
            </select>
          </div>
        </div>

        {/* INPUTS FOR WORKFLOW 1: NEW PRODUCT DEVELOPMENT */}
        {workflow === "new_product" ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 opacity-80">
                  Target Demographics / Target Audience
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gen-Z remote workers and gym-goers"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className={`w-full text-sm p-2.5 rounded-xl border focus:ring-2 focus:ring-indigo-500 ${
                    isDark ? "bg-gray-700 border-gray-600 focus:bg-gray-600 text-white" : "bg-gray-50 border-gray-200 focus:bg-white text-gray-800"
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 opacity-80">
                  Target Budget Allocation
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. $45,000 USD primary testing"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className={`w-full text-sm p-2.5 rounded-xl border focus:ring-2 focus:ring-indigo-500 ${
                    isDark ? "bg-gray-700 border-gray-600 focus:bg-gray-600 text-white" : "bg-gray-50 border-gray-200 focus:bg-white text-gray-800"
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 opacity-80">
                  Launch Region / Country
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. USA, UK, & Europe metropolitan grid"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className={`w-full text-sm p-2.5 rounded-xl border focus:ring-2 focus:ring-indigo-500 ${
                    isDark ? "bg-gray-700 border-gray-600 focus:bg-gray-600 text-white" : "bg-gray-50 border-gray-200 focus:bg-white"
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 opacity-80">
                  Corporate Core Business Goal
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Secure 1,500 active physical orders within first quarter"
                  value={businessGoal}
                  onChange={(e) => setBusinessGoal(e.target.value)}
                  className={`w-full text-sm p-2.5 rounded-xl border focus:ring-2 focus:ring-indigo-500 ${
                    isDark ? "bg-gray-700 border-gray-600 focus:bg-gray-600 text-white" : "bg-gray-50 border-gray-200 focus:bg-white text-gray-800"
                  }`}
                />
              </div>
            </div>
          </div>
        ) : (
          /* INPUTS FOR WORKFLOW 2: EXISTING PRODUCT IMPROVEMENT */
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col h-full">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 opacity-80">
                  Existing Product Description
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your current product parameters, assembly materials, and services..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full text-sm p-3 rounded-xl border grow focus:ring-2 focus:ring-indigo-500 ${
                    isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200 text-gray-800"
                  }`}
                />
              </div>

              {/* Secure Drag & Drop spreadsheet file Uploader */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 opacity-80 flex items-center justify-between">
                  <span>Audit spreadsheet / Report log</span>
                  <span className="text-gray-400 font-normal">Optional</span>
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all flex flex-col items-center justify-center h-[116px] cursor-pointer ${
                    dragOver
                      ? "border-indigo-500 bg-indigo-500/10"
                      : isDark ? "border-gray-600 hover:border-gray-500 bg-gray-700/20" : "border-gray-200 hover:border-indigo-400 bg-gray-50"
                  }`}
                  onClick={onFileSelectClick}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                    className="hidden"
                    accept=".csv, .txt, .xlsx, .xls, .json"
                  />
                  {uploadedFileName ? (
                    <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
                      <FileSpreadsheet className="w-6 h-6" />
                      <span className="text-xs font-bold line-clamp-1">{uploadedFileName}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedFileName(undefined);
                          setUploadedFileData(undefined);
                        }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
                      >
                        <X className="w-3 h-3 text-red-500" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-indigo-500 mb-1" />
                      <p className="text-xs font-medium">Drag or select a CRM CSV or Excel</p>
                      <p className="text-[10px] text-gray-400 mt-1">Logs extracts directly into text prompts</p>
                    </>
                  )}
                </div>
                {fileError && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{fileError}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 opacity-80">
                  Current Sales Performance
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g. Sales down 40% from Q1, heavy pricing pressure..."
                  value={salesDataText}
                  onChange={(e) => setSalesDataText(e.target.value)}
                  className={`w-full text-sm p-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 ${
                    isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200 text-gray-800"
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 opacity-80">
                  Critical Customer Feedback / Reviews
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g. Battery dies within 12 hours, rubber strap degrades easily..."
                  value={reviewsText}
                  onChange={(e) => setReviewsText(e.target.value)}
                  className={`w-full text-sm p-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 ${
                    isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200 text-gray-800"
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 opacity-80">
                  Competitive Landscape Context
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g. Competitor sells alternative for $30 with a 15-day cycle..."
                  value={competitorInfo}
                  onChange={(e) => setCompetitorInfo(e.target.value)}
                  className={`w-full text-sm p-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 ${
                    isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200 text-gray-800"
                  }`}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className={`px-6 py-3 border text-xs font-bold uppercase tracking-widest ${
              isDark ? "hover:bg-slate-800 border-slate-700 text-slate-350" : "hover:bg-slate-50 border-slate-250 text-slate-705"
            }`}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-8 py-3 bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-widest flex items-center space-x-2 border border-indigo-500"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Assemble Boardroom & Draft</span>
          </button>
        </div>
      </form>
    </div>
  );
};
