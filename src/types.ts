export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export type WorkflowType = 'new_product' | 'improvement';

export interface Workflow1Input {
  productName: string;
  category: string;
  targetAudience: string;
  budget: string;
  region: string;
  businessGoal: string;
}

export interface Workflow2Input {
  productName: string;
  category: string;
  salesDataText: string;
  reviewsText: string;
  competitorInfo: string;
  description: string;
  uploadedFileName?: string;
  uploadedFileData?: string; // base64 or raw string parsed
}

export interface SwotAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface MbaReport {
  marketResearch: string;
  competitorAnalysis: string;
  swotAnalysis: SwotAnalysis;
  demandForecasting: string;
  revenueEstimation: string;
  insights: string;
}

export interface PmReport {
  prd: string;
  features: string[];
  specifications: string[];
  roadmap: string[];
  pricingStrategy: string;
  recommendations: string;
}

export interface MarketingReport {
  brandingSuggestions: string[];
  taglineSuggestions: string[];
  strategy: string;
  campaigns: string[];
  launchPlan: string;
}

export interface AnalyticsData {
  trendData: { period: string; sales: number; competitor: number }[];
  sentimentData: { rating: string; value: number }[];
  growthPredictions: { period: string; withMarketing: number; baseline: number }[];
}

export interface AgentReport {
  executiveSummary: string;
  mbaReport: MbaReport;
  pmReport: PmReport;
  marketingReport: MarketingReport;
  analytics?: AnalyticsData;
  createdAt: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  type: WorkflowType;
  input1?: Workflow1Input;
  input2?: Workflow2Input;
  status: 'draft' | 'running' | 'completed' | 'failed';
  report?: AgentReport;
  createdAt: string;
  error?: string;
  approved?: boolean;
  approvalComment?: string;
  approvalDate?: string;
  approvedBy?: string;
}

export interface ProjectComment {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userRole: string;
  text: string;
  createdAt: string;
}

export interface WorkspaceTask {
  id: string;
  projectId: string;
  title: string;
  assignedTo: string;
  completed: boolean;
  createdAt: string;
  createdBy: string;
}

