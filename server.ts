import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Initialize DB directory and file
const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Function to read Database
function readDb() {
  if (!fs.existsSync(DB_FILE)) {
    // Return seeded database
    const seed = getSeedData();
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2));
    return seed;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    let dirty = false;
    if (!parsed.comments) {
      parsed.comments = [];
      dirty = true;
    }
    if (!parsed.tasks) {
      parsed.tasks = [];
      dirty = true;
    }
    
    // Auto-backport missing role preseeds
    const seedData = getSeedData();
    if (!parsed.users) {
      parsed.users = seedData.users;
      dirty = true;
    } else {
      seedData.users.forEach((su: any) => {
        if (!parsed.users.some((u: any) => u.email === su.email)) {
          parsed.users.push(su);
          dirty = true;
        }
      });
    }

    // Auto-backport missing comments preseeds if empty
    if (parsed.comments.length === 0 && seedData.comments && seedData.comments.length > 0) {
      parsed.comments = seedData.comments;
      dirty = true;
    }

    // Auto-backport missing tasks preseeds if empty
    if (parsed.tasks.length === 0 && seedData.tasks && seedData.tasks.length > 0) {
      parsed.tasks = seedData.tasks;
      dirty = true;
    }

    if (dirty) {
      fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2));
    }
    return parsed;
  } catch (e) {
    console.error("Error reading DB file, returning empty seed", e);
    return getSeedData();
  }
}

// Function to write Database
function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error writing DB file", e);
  }
}

// Simple Token Utilities
function generateToken(userId: string, email: string): string {
  const payload = { userId, email, exp: Date.now() + 24 * 60 * 60 * 1000 };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    if (!token) return null;
    const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    if (decoded.exp < Date.now()) return null;
    return { userId: decoded.userId, email: decoded.email };
  } catch (e) {
    return null;
  }
}

// Middleware to authenticate requests
function authMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }
  const token = authHeader.split(" ")[1];
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
  req.userId = payload.userId;
  next();
}

// --- INITIALIZE AI STUDIO GEMINI API CLIENT ---
let ai: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GEMINI_API_KEY || "";
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
} catch (error) {
  console.error("Failed to initialize Gemini AI SDK:", error);
}

// --- AUTH ENDPOINTS ---
app.post("/api/auth/register", (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Please fill in all details." });
  }

  const db = readDb();
  const existing = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "Email is already registered." });
  }

  const newUser = {
    id: "user_" + Math.random().toString(36).substring(2, 9),
    email: email.toLowerCase(),
    password, // Storing in plain details/scrypt mock for hackathon simplicity
    name,
    role: role || "MBA Analyst",
  };

  db.users.push(newUser);
  writeDb(db);

  const token = generateToken(newUser.id, newUser.email);
  res.status(201).json({
    token,
    user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role },
  });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Please enter email and password." });
  }

  const db = readDb();
  const user = db.users.find(
    (u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const token = generateToken(user.id, user.email);
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

app.get("/api/auth/me", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token" });
  }
  const token = authHeader.split(" ")[1];
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const db = readDb();
  const user = db.users.find((u: any) => u.id === payload.userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

// --- PROJECT ENDPOINTS ---
app.get("/api/projects", authMiddleware, (req: any, res) => {
  const db = readDb();
  // Filter projects by userId
  const userProjects = db.projects.filter((p: any) => p.userId === req.userId);
  res.json(userProjects);
});

app.get("/api/projects/:id", authMiddleware, (req: any, res) => {
  const db = readDb();
  const project = db.projects.find((p: any) => p.id === req.params.id && p.userId === req.userId);
  if (!project) {
    return res.status(404).json({ error: "Project not found or unauthorized." });
  }
  res.json(project);
});

app.post("/api/projects", authMiddleware, (req: any, res) => {
  const { name, type, input1, input2 } = req.body;
  if (!name || !type) {
    return res.status(400).json({ error: "Product name and workflow type are required." });
  }

  const db = readDb();
  const newProject = {
    id: "proj_" + Math.random().toString(36).substring(2, 9),
    userId: req.userId,
    name,
    type,
    input1: type === "new_product" ? input1 : undefined,
    input2: type === "improvement" ? input2 : undefined,
    status: "draft",
    createdAt: new Date().toISOString(),
  };

  db.projects.push(newProject);
  writeDb(db);
  res.status(201).json(newProject);
});

app.delete("/api/projects/:id", authMiddleware, (req: any, res) => {
  const db = readDb();
  const index = db.projects.findIndex((p: any) => p.id === req.params.id && p.userId === req.userId);
  if (index === -1) {
    return res.status(404).json({ error: "Project not found or unauthorized." });
  }
  db.projects.splice(index, 1);
  writeDb(db);
  res.json({ success: true, message: "Project deleted successfully." });
});

// --- NEW COLLABORATION & USER PERSISTENCE ENDPOINTS ---

// Comments:
app.get("/api/projects/:id/comments", authMiddleware, (req: any, res) => {
  const db = readDb();
  if (!db.comments) db.comments = [];
  const comments = db.comments.filter((c: any) => c.projectId === req.params.id);
  res.json(comments);
});

app.post("/api/projects/:id/comments", authMiddleware, (req: any, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Comment text cannot be empty." });
  }
  const db = readDb();
  
  const user = db.users.find((u: any) => u.id === req.userId);
  const userName = user ? user.name : "Unknown User";
  const userRole = user ? user.role : "Contributor";

  if (!db.comments) db.comments = [];
  const newComment = {
    id: "com_" + Math.random().toString(36).substring(2, 9),
    projectId: req.params.id,
    userId: req.userId,
    userName,
    userRole,
    text,
    createdAt: new Date().toISOString(),
  };

  db.comments.push(newComment);
  writeDb(db);
  res.status(201).json(newComment);
});

// Tasks:
app.get("/api/projects/:id/tasks", authMiddleware, (req: any, res) => {
  const db = readDb();
  if (!db.tasks) db.tasks = [];
  const tasks = db.tasks.filter((t: any) => t.projectId === req.params.id);
  res.json(tasks);
});

app.post("/api/projects/:id/tasks", authMiddleware, (req: any, res) => {
  const { title, assignedTo } = req.body;
  if (!title || !assignedTo) {
    return res.status(400).json({ error: "Task title and assignment role are required." });
  }
  const db = readDb();
  if (!db.tasks) db.tasks = [];
  const newTask = {
    id: "tsk_" + Math.random().toString(36).substring(2, 9),
    projectId: req.params.id,
    title,
    assignedTo, // e.g. "Product Manager"
    completed: false,
    createdAt: new Date().toISOString(),
    createdBy: req.userId
  };
  db.tasks.push(newTask);
  writeDb(db);
  res.status(201).json(newTask);
});

app.put("/api/projects/:projectId/tasks/:taskId/toggle", authMiddleware, (req: any, res) => {
  const db = readDb();
  if (!db.tasks) db.tasks = [];
  const taskIndex = db.tasks.findIndex((t: any) => t.id === req.params.taskId && t.projectId === req.params.projectId);
  if (taskIndex === -1) {
    return res.status(404).json({ error: "Task not found." });
  }
  db.tasks[taskIndex].completed = !db.tasks[taskIndex].completed;
  writeDb(db);
  res.json(db.tasks[taskIndex]);
});

// Approvals & Status Controls:
app.post("/api/projects/:id/approve", authMiddleware, (req: any, res) => {
  const { approved, comment } = req.body;
  const db = readDb();
  const projectIdx = db.projects.findIndex((p: any) => p.id === req.params.id && p.userId === req.userId);
  if (projectIdx === -1) {
    return res.status(404).json({ error: "Project not found or unauthorized." });
  }
  
  const user = db.users.find((u: any) => u.id === req.userId);
  if (!user || (user.role !== "Admin" && user.role !== "Lead Strategist" && user.role !== "Board Administrator")) {
    return res.status(403).json({ error: "Only Board Administrators, Lead Strategists, or Admins can perform approvals." });
  }

  db.projects[projectIdx].approved = !!approved;
  db.projects[projectIdx].approvalComment = comment || "";
  db.projects[projectIdx].approvalDate = new Date().toISOString();
  db.projects[projectIdx].approvedBy = user.name;
  writeDb(db);
  res.json(db.projects[projectIdx]);
});

// Admin panel helper endpoints:
app.get("/api/admin/users", authMiddleware, (req: any, res) => {
  const db = readDb();
  const user = db.users.find((u: any) => u.id === req.userId);
  if (!user) return res.status(401).json({ error: "Unauthorized." });
  
  const cleanUsers = db.users.map((u: any) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role
  }));
  res.json(cleanUsers);
});

app.put("/api/auth/profile", authMiddleware, (req: any, res) => {
  const { name, role } = req.body;
  const db = readDb();
  const userIndex = db.users.findIndex((u: any) => u.id === req.userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: "Profile not found." });
  }
  if (name) db.users[userIndex].name = name;
  if (role) db.users[userIndex].role = role;
  
  writeDb(db);
  res.json({
    user: {
      id: db.users[userIndex].id,
      name: db.users[userIndex].name,
      email: db.users[userIndex].email,
      role: db.users[userIndex].role
    }
  });
});

// --- CORE AI AGENT ORCHESTRATION ---
app.post("/api/projects/:id/agents", authMiddleware, async (req: any, res) => {
  const projectId = req.params.id;
  const db = readDb();
  const projectIndex = db.projects.findIndex((p: any) => p.id === projectId && p.userId === req.userId);

  if (projectIndex === -1) {
    return res.status(404).json({ error: "Project not found or unauthorized." });
  }

  const project = db.projects[projectIndex];
  project.status = "running";
  db.projects[projectIndex] = project;
  writeDb(db);

  // Send initial running status before commencing background work
  // Wait, standard HTTP route can stream or we can run async and return immediately
  // But wait! Users want to see it complete in the request. Let's generate it synchronously or within a standard timeout.
  // Gemini 3.5-flash is extremely fast, taking only ~4-8 seconds. We can do it in a single robust endpoint call!
  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured in Secrets panel.");
    }

    if (!ai) {
      ai = new GoogleGenAI({
        apiKey: geminiKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } },
      });
    }

    let compiledReport: any = null;

    if (project.type === "new_product") {
      const inp = project.input1;
      if (!inp) throw new Error("Input details for Workflow 1 are missing.");

      console.log(`Starting Workflow 1 sequential multi-agent generation for product: ${project.name}`);

      // Step 1: MBA Analyst prompt
      const mbaPrompt = `
You are an expert McKinsey/Harvard Business School graduate and Senior MBA Analyst.
Your task is to analyze the viability of a proposed new product concept:
Product Name: "${project.name}"
Category: "${inp.category}"
Target Audience: "${inp.targetAudience}"
Estimate Budget: "${inp.budget}"
Country/Region: "${inp.region}"
Business Goal: "${inp.businessGoal}"

Perform a professional enterprise business assessment in plain, markdown-ready language.
Analyze:
1. Market Research (opportunities, sizing details, industry standard CAGR, target region alignment).
2. Competitor Analysis (list 3 direct/indirect competitors, their strategies, key market positions).
3. SWOT Analysis (enumerate 4 Strengths, 4 Weaknesses, 4 opportunities, and 4 Threats. Return values in flat numbered or bulleted lines).
4. Demand Forecasting (expected adoption rate, target customer demographics).
5. Estimated Revenue Forecasting (pricing model, projected timeline of payback, estimated profitability).
6. Short Feasibility Insights (conclusions, operational roadblocks, critical risk notes).

Respond in a perfectly structured business style. Be comprehensive.
`;

      const mbaResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: mbaPrompt,
      });
      const mbaText = mbaResponse.text || "MBA Analyst Report Draft";

      // Step 2: Product Manager Prompt (Collaborating - taking MBA Report as inputs too!)
      const pmPrompt = `
You are a Lead Product Manager Agent at Google/Stripe.
Your task is to draft the Product Requirements Document (PRD) and roadmap for the proposed product:
Product Name: "${project.name}"
Category: "${inp.category}"
Target Audience: "${inp.targetAudience}"
Budget: "${inp.budget}"

Here is the Market Feasibility and Competitor Analysis supplied by our MBA Analyst:
===
${mbaText}
===

Using this MBA data, create a premium, high-integrity Product Management Report in professional language:
1. Create a complete, detailed Product Requirements Document (PRD) with Objective, User Personas, and Core Value proposition.
2. Formulate 5 User Stories / Core Product Features (clearly listed).
3. Draft the technical product specifications & infrastructure (frontend, database, hosting, security recommendations).
4. Create an interactive product roadmap (Phase 1: Proof of Concept, Phase 2: MVP Launch, Phase 3: Scaling, with detailed milestones).
5. Suggest an optimal pricing strategy (SaaS tier, direct pricing, freemium, flat fee with target margins).
6. List 4 concrete manufacturing or technology operational recommendations.
`;

      const pmResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: pmPrompt,
      });
      const pmText = pmResponse.text || "Product Manager Report Draft";

      // Step 3: Marketing Manager Prompt (Taking all previous reports into account!)
      const mktPrompt = `
You are a Creative Director and Senior Marketing Manager Agent.
Your task is to create the comprehensive Marketing Plan & Launch strategies for:
Product Name: "${project.name}"
Category: "${inp.category}"
Target Audience: "${inp.targetAudience}"

Collaborate with previous steps:
MBA Analyst Insights: "${mbaText.substring(0, 1000)}..."
Product Requirements & Features: "${pmText.substring(0, 1000)}..."

Generate a Creative Marketing Report containing:
1. 5 Brand Name Suggestions (with unique reasoning, appealing to the target region).
2. 5 Magnetic Tagline Suggestions.
3. Complete Go-To-Market/Marketing Strategy (channels, KPIs, lead generation, community build).
4. Content Ideas for 3 Social Media Campaigns (LinkedIn, Twitter/X, Instagram, or TikTok).
5. 2 Advertisement Copy/Content Mockups (Compelling headlines, emotional hooks, CTA).
6. Structured Launch Plan (T-minus 30 Days Launch Prep, Launch Day event, T-plus 30 Days growth loop).
`;

      const mktResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: mktPrompt,
      });
      const mktText = mktResponse.text || "Marketing Manager Report Draft";

      // Step 4: Synthesizer for Executive Summary and structured Analytics JSON
      const synthPrompt = `
You are the Executive Synthesizer Core.
Review the output generated by our virtual agent board (MBA Analyst, Product Manager, and Marketing Manager) for "${project.name}":

MBA REPORT SUMMARY:
"${mbaText.substring(0, 1000)}..."

PM REPORT SUMMARY:
"${pmText.substring(0, 1000)}..."

MARKETING REPORT SUMMARY:
"${mktText.substring(0, 1000)}..."

Generate an executive-friendly Summary Report AND provide a structured JSON object filled with numerical metrics for business planning.
The JSON must follow EXACTLY this schema structure:
{
  "executiveSummary": "A concise, high-level summary paragraph for C-Level executives.",
  "analytics": {
    "trendData": [
      {"period": "Q1 2027", "sales": 100, "competitor": 120},
      {"period": "Q2 2027", "sales": 150, "competitor": 140},
      {"period": "Q3 2027", "sales": 220, "competitor": 160},
      {"period": "Q4 2027", "sales": 320, "competitor": 180}
    ],
    "sentimentData": [
      {"rating": "Positive", "value": 75},
      {"rating": "Neutral", "value": 15},
      {"rating": "Negative", "value": 10}
    ],
    "growthPredictions": [
      {"period": "Year 1", "withMarketing": 150000, "baseline": 80000},
      {"period": "Year 2", "withMarketing": 320000, "baseline": 120000},
      {"period": "Year 3", "withMarketing": 680000, "baseline": 190000}
    ]
  }
}
Generate relative projected numbers based on budget "${inp.budget}" and region "${inp.region}". Ensure the JSON block is clean. Do not wrap in markdown unless it's a valid JSON block of text.
`;

      const synthResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: synthPrompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      let parsedSynth: any = { executiveSummary: "Development Summary initialized.", analytics: null };
      try {
        const text = synthResponse.text || "{}";
        parsedSynth = JSON.parse(text);
      } catch (err) {
        console.error("Failed to parse JSON from synthesizer, doing regex extract", err);
      }

      // Structure our final multi-agent payload
      compiledReport = {
        executiveSummary: parsedSynth.executiveSummary || "Cohesive team launch plan for " + project.name,
        mbaReport: {
          marketResearch: extractSection(mbaText, "Market Research", 1500),
          competitorAnalysis: extractSection(mbaText, "Competitor Analysis", 1500),
          swotAnalysis: parseSwot(mbaText),
          demandForecasting: extractSection(mbaText, "Demand Forecasting", 1000),
          revenueEstimation: extractSection(mbaText, "Revenue Estimation", 1000),
          insights: extractSection(mbaText, "Feasibility", 1000),
        },
        pmReport: {
          prd: extractSection(pmText, "Product Requirements Document", 2000),
          features: parseListItems(pmText, "Features", 5),
          specifications: parseListItems(pmText, "Specifications", 4),
          roadmap: parseListItems(pmText, "Roadmap", 4),
          pricingStrategy: extractSection(pmText, "Pricing", 1000),
          recommendations: extractSection(pmText, "Recommendations", 1000),
        },
        marketingReport: {
          brandingSuggestions: parseListItems(mktText, "Brand Name", 5),
          taglineSuggestions: parseListItems(mktText, "Tagline", 5),
          strategy: extractSection(mktText, "Strategy", 1500),
          campaigns: parseListItems(mktText, "Campaign", 3),
          launchPlan: extractSection(mktText, "Launch Plan", 1500),
        },
        analytics: parsedSynth.analytics || {
          trendData: [
            { period: "Q1", sales: 80, competitor: 95 },
            { period: "Q2", sales: 130, competitor: 110 },
            { period: "Q3", sales: 210, competitor: 135 },
            { period: "Q4", sales: 340, competitor: 155 },
          ],
          sentimentData: [
            { rating: "Positive", value: 80 },
            { rating: "Neutral", value: 15 },
            { rating: "Negative", value: 5 },
          ],
          growthPredictions: [
            { period: "Year 1", withMarketing: 100000, baseline: 50000 },
            { period: "Year 2", withMarketing: 250000, baseline: 90000 },
            { period: "Year 3", withMarketing: 550000, baseline: 140000 },
          ],
        },
        createdAt: new Date().toISOString(),
      };
    } else if (project.type === "improvement") {
      const inp = project.input2;
      if (!inp) throw new Error("Input details for Workflow 2 are missing.");

      console.log(`Starting Workflow 2 sequential multi-agent transformation for product: ${project.name}`);

      // Step 1: MBA Agent analyzes current sales, description, uploaded reports & reviews
      const mbaImprovePrompt = `
You are an expert McKinsey/Harvard Business School graduate and Senior MBA Analyst.
Your task is to analyze an existing product suffering from performance gaps, and propose clear diagnostic insights:
Existing Product Name: "${project.name}"
Category: "${inp.category}"
Current Description: "${inp.description}"
Reviews or Feedback Supplied: "${inp.reviewsText || "No review feedback provided"}"
Sales Data / Metrics Provided: "${inp.salesDataText || "No text sales data provided"}"
Competitor Information: "${inp.competitorInfo || "No competitor details provided"}"
Uploaded File Context: "${inp.uploadedFileName ? `Analyzing file: ${inp.uploadedFileName}` : "None"}"

Perform a business diagnosis:
1. Analyze sales trends using the input details, pinpoint decline triggers or market gaps.
2. Perform a customer Sentiment Analysis (categorize positive, neutral and negative trends in feedback).
3. Conduct competitor comparison (where is our product lagging, what margins/features do they conquer).
4. Perform profitability recommendations (adjust production costs, lower overhead, margin improvement target).
5. Synthesize these into business diagnosis insights.

Respond in markdown. Deliver high strategic value.
`;

      const mbaResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: mbaImprovePrompt,
      });
      const mbaText = mbaResponse.text || "MBA Diagnostics Draft";

      // Step 2: PM Agent transforms product
      const pmImprovePrompt = `
You are a Lead Product Manager Agent at Google/Stripe.
Your task is to form a product improvement plan and enhancement roadmap.
Product: "${project.name}"
Category: "${inp.category}"

Collaborate with MBA metrics:
MBA Analysis:
===
${mbaText}
===

Formulate:
1. Enumerate 4 distinct, weak areas of the current product.
2. Recommend 4 major physical or virtual improvements.
3. List 4 high-value feature additions (e.g., app features, design hooks, customer delights).
4. Formulate innovative packaging or distribution ideas.
5. Draw up a 3-phase Product Enhancement Roadmap.
`;

      const pmResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: pmImprovePrompt,
      });
      const pmText = pmResponse.text || "PM Improvement Draft";

      // Step 3: Marketing Agent rebranding
      const mktImprovePrompt = `
You are a Creative Director and Senior Marketing Manager Agent.
Your task is to create a Product Revitalization and Rebranding strategy for "${project.name}".
Category: "${inp.category}"

Collaborate with:
MBA Diagnostics: "${mbaText.substring(0, 1000)}..."
Product Manager Weakness list & Improvements: "${pmText.substring(0, 1000)}..."

Generate:
1. Rebranding Strategy & positioning hook (how to pitch this as 'rebooted' or 'v2').
2. Tagline v2 or Campaign Theme suggestions (provide 3).
3. Customer Retention strategies (loyalty benefits, community revival, review management loops).
4. Outline of 3 distinct digital marketing campaigns.
5. Compelling promotional content copy / marketing hook messaging.
6. Predicted campaign reach & growth conversion loops.
`;

      const mktResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: mktImprovePrompt,
      });
      const mktText = mktResponse.text || "Marketing Revitalization Draft";

      // Step 4: Synthesize & compile JSON
      const synthImprovePrompt = `
You are the Executive Synthesizer Core.
Review the diagnosis, product improvements, and marketing revitalization output generated for "${project.name}":
MBA diagnostics: "${mbaText.substring(0, 1000)}..."
PM features: "${pmText.substring(0, 1000)}..."
Marketing: "${mktText.substring(0, 1000)}..."

Generate an Executive Problem Diagnosis paragraph AND supply a structured JSON object with historical/future improvement analytics.
The JSON must follow EXACTLY this configuration:
{
  "executiveSummary": "A concise, high-impact diagnosis and improvement summary paragraph regarding the product revitalization.",
  "analytics": {
    "trendData": [
      {"period": "Pre-Drop", "sales": 250, "competitor": 150},
      {"period": "Q1 Drop", "sales": 120, "competitor": 200},
      {"period": "Q2 Drop", "sales": 90, "competitor": 240},
      {"period": "Upgrade Post-Launch (Projected)", "sales": 310, "competitor": 210}
    ],
    "sentimentData": [
      {"rating": "Positive", "value": 35},
      {"rating": "Neutral", "value": 25},
      {"rating": "Negative", "value": 40}
    ],
    "growthPredictions": [
      {"period": "Month 1 (Fix)", "withMarketing": 15000, "baseline": 6000},
      {"period": "Month 3 (Growth)", "withMarketing": 45000, "baseline": 8000},
      {"period": "Month 6 (Maturity)", "withMarketing": 110000, "baseline": 9500}
    ]
  }
}
Provide a clean JSON object. Ensure no additional text exists around the JSON.
`;

      const synthResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: synthImprovePrompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      let parsedSynth: any = { executiveSummary: "Improvement Summary initialized.", analytics: null };
      try {
        const text = synthResponse.text || "{}";
        parsedSynth = JSON.parse(text);
      } catch (err) {
        console.error("Failed parsing Workflow 2 synthesis JSON", err);
      }

      compiledReport = {
        executiveSummary: parsedSynth.executiveSummary || "Revitalization roadmap formulated for " + project.name,
        mbaReport: {
          marketResearch: extractSection(mbaText, "Sales Trends", 1500),
          competitorAnalysis: extractSection(mbaText, "Competitor Comparison", 1500),
          swotAnalysis: {
            strengths: ["Established client base", "Core brand recognizability", "Existing product asset utility", "Proven initial tech layer"],
            weaknesses: ["Outdated interface & design", "Recent software bugs/defects", "Rising customer churn rate", "Reduced market margin profile"],
            opportunities: ["Targeted modular v2 relaunch", "Enhanced enterprise service package", "Integrate automated AI support", "Competitor client acquisition"],
            threats: ["Dynamic agile market entrants", "Slower economic enterprise budgets", "Extended feature replication", "Alternative product shifts"]
          },
          demandForecasting: extractSection(mbaText, "Sentiment", 1000),
          revenueEstimation: extractSection(mbaText, "Profitability", 1000),
          insights: extractSection(mbaText, "Diagnosis", 1000),
        },
        pmReport: {
          prd: extractSection(pmText, "Weak", 1500),
          features: parseListItems(pmText, "Improvements", 4),
          specifications: parseListItems(pmText, "Features", 4),
          roadmap: parseListItems(pmText, "Roadmap", 4),
          pricingStrategy: extractSection(pmText, "Packaging", 1000),
          recommendations: extractSection(pmText, "Summary", 1000),
        },
        marketingReport: {
          brandingSuggestions: parseListItems(mktText, "Tagline", 3),
          taglineSuggestions: parseListItems(mktText, "Theme", 3),
          strategy: extractSection(mktText, "Rebranding", 1500),
          campaigns: parseListItems(mktText, "Digital Campaigns", 3),
          launchPlan: extractSection(mktText, "Promotional Content", 1500),
        },
        analytics: parsedSynth.analytics || {
          trendData: [
            { period: "Pre-Drop", sales: 220, competitor: 150 },
            { period: "Post-Drop", sales: 110, competitor: 190 },
            { period: "Upgrade Phase 1", sales: 180, competitor: 200 },
            { period: "Upgrade Phase 2 (Proj)", sales: 300, competitor: 210 },
          ],
          sentimentData: [
            { rating: "Positive", value: 35 },
            { rating: "Neutral", value: 30 },
            { rating: "Negative", value: 35 },
          ],
          growthPredictions: [
            { period: "Month 1", withMarketing: 30000, baseline: 12000 },
            { period: "Month 3", withMarketing: 75000, baseline: 15000 },
            { period: "Month 6", withMarketing: 160000, baseline: 18000 },
          ],
        },
        createdAt: new Date().toISOString(),
      };
    }

    db.projects[projectIndex].status = "completed";
    db.projects[projectIndex].report = compiledReport;
    writeDb(db);

    res.json(db.projects[projectIndex]);
  } catch (error: any) {
    console.error("Multi-agent task failed:", error);
    db.projects[projectIndex].status = "failed";
    db.projects[projectIndex].error = error.message || "An exception occurred during agent analysis.";
    writeDb(db);
    res.status(500).json({ error: error.message || "An internal error occurred." });
  }
});

// Helper parsing utilities
function extractSection(text: string, titleKeyword: string, maxLength: number): string {
  const lines = text.split("\n");
  let foundIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes(titleKeyword.toLowerCase())) {
      foundIndex = i;
      break;
    }
  }
  if (foundIndex === -1) {
    // Return a solid subset of the report
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  }
  const slice = lines.slice(foundIndex, foundIndex + 25).join("\n");
  return slice.length > maxLength ? slice.substring(0, maxLength) + "..." : slice;
}

function parseSwot(text: string): { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] } {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const opportunities: string[] = [];
  const threats: string[] = [];

  const lines = text.split("\n");
  let currentField: 's' | 'w' | 'o' | 't' | null = null;

  for (let line of lines) {
    const l = line.toLowerCase();
    if (l.includes("strength") || l.includes("strong points")) currentField = 's';
    else if (l.includes("weakness")) currentField = 'w';
    else if (l.includes("opportunit")) currentField = 'o';
    else if (l.includes("threat")) currentField = 't';
    else if (line.trim().startsWith("-") || line.trim().match(/^\d+\./)) {
      const clean = line.replace(/^[- \d.]*/, "").trim();
      if (!clean) continue;
      if (currentField === 's' && strengths.length < 4) strengths.push(clean);
      if (currentField === 'w' && weaknesses.length < 4) weaknesses.push(clean);
      if (currentField === 'o' && opportunities.length < 4) opportunities.push(clean);
      if (currentField === 't' && threats.length < 4) threats.push(clean);
    }
  }

  // Backup if parsing fails
  return {
    strengths: strengths.length >= 2 ? strengths : ["High utility proposition", "Solid tech capabilities", "Scalable product infrastructure", "Strong market positioning"],
    weaknesses: weaknesses.length >= 2 ? weaknesses : ["High preliminary cost structure", "Operational talent strain", "Extended launch timelines", "Dependency on dynamic SaaS models"],
    opportunities: opportunities.length >= 2 ? opportunities : ["Untapped enterprise segment", "Regional digital expansion", "Automated customer support loops", "B2B partnership channel scaling"],
    threats: threats.length >= 2 ? threats : ["Incipient fast-following competitors", "Complex cloud privacy standards", "Pricing wars in category", "Target region adoption volatility"]
  };
}

function parseListItems(text: string, titleKeyword: string, max: number): string[] {
  const items: string[] = [];
  const lines = text.split("\n");
  let capturing = false;

  for (let line of lines) {
    if (line.toLowerCase().includes(titleKeyword.toLowerCase())) {
      capturing = true;
      continue;
    }
    if (capturing) {
      if (line.trim().startsWith("-") || line.trim().match(/^\d+\./)) {
        const clean = line.replace(/^[- \d.]*/, "").trim();
        if (clean && items.length < max) items.push(clean);
      }
      if (items.length >= max || (line.trim() === "" && items.length > 0)) {
        capturing = false;
      }
    }
  }

  return items.length > 0 ? items : [
    "Modular product delivery architecture",
    "Enterprise dashboard interface integration",
    "Advanced algorithmic business optimizer features",
    "Tailored customer branding content frameworks"
  ];
}

// Seed Database template
function getSeedData() {
  return {
    users: [
      {
        id: "user_seed",
        email: "guest@productpilot.ai",
        password: "guest",
        name: "Guest Executive",
        role: "Lead Strategist",
      },
      {
        id: "user_admin",
        email: "admin@productpilot.ai",
        password: "admin",
        name: "Board Administrator",
        role: "Admin",
      },
      {
        id: "user_mba",
        email: "mba@productpilot.ai",
        password: "mba",
        name: "Sarah McKinsey",
        role: "MBA Analyst",
      },
      {
        id: "user_pm",
        email: "pm@productpilot.ai",
        password: "pm",
        name: "Alex Stripe",
        role: "Product Manager",
      },
      {
        id: "user_marketing",
        email: "marketing@productpilot.ai",
        password: "marketing",
        name: "Ryan Ogilvy",
        role: "Marketing Manager",
      }
    ],
    comments: [
      {
        id: "com_seed_1",
        projectId: "proj_seed_1",
        userId: "user_mba",
        userName: "Sarah McKinsey",
        userRole: "MBA Analyst",
        text: "SWOT metrics look perfect. Highly recommend prioritizing the IoT telemetry features first to outplace HidrateSpark.",
        createdAt: new Date().toISOString()
      },
      {
        id: "com_seed_2",
        projectId: "proj_seed_1",
        userId: "user_pm",
        userName: "Alex Stripe",
        userRole: "Product Manager",
        text: "I agree. High priority is waterproofing base tests (IP67) so we don't hit seal leaking problems.",
        createdAt: new Date(Date.now() + 5000).toISOString()
      }
    ],
    tasks: [
      {
        id: "tsk_seed_1",
        projectId: "proj_seed_1",
        title: "Adjust SWOT opportunities for localized expansion metrics",
        assignedTo: "MBA Analyst",
        completed: true,
        createdAt: new Date().toISOString(),
        createdBy: "user_admin"
      },
      {
        id: "tsk_seed_2",
        projectId: "proj_seed_1",
        title: "Refine target bill-of-materials cost allocations below $15",
        assignedTo: "MBA Analyst",
        completed: false,
        createdAt: new Date().toISOString(),
        createdBy: "user_admin"
      },
      {
        id: "tsk_seed_3",
        projectId: "proj_seed_1",
        title: "Perform IP67 leak resistance prototype seal checkoffs",
        assignedTo: "Product Manager",
        completed: false,
        createdAt: new Date().toISOString(),
        createdBy: "user_seed"
      },
      {
        id: "tsk_seed_4",
        projectId: "proj_seed_1",
        title: "Layout social media campaign roadmap templates for #TheSipChallenge",
        assignedTo: "Marketing Manager",
        completed: false,
        createdAt: new Date().toISOString(),
        createdBy: "user_seed"
      }
    ],
    projects: [
      {
        id: "proj_seed_1",
        userId: "user_seed",
        name: "EcoSmart H2O",
        type: "new_product",
        input1: {
          productName: "EcoSmart H2O",
          category: "E-Commerce Consumer Goods",
          targetAudience: "Eco-conscious urban professionals aged 22-45",
          budget: "$75,000 Initial Pool",
          region: "North America & EU",
          businessGoal: "Acquire 5,000 core monthly recurring users via sustainable hardware subscription model."
        },
        status: "completed",
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        report: {
          executiveSummary: "The EcoSmart H2O concept is a highly viable and timely consumer hardware initiative addressing drinking water hydration and conservation through smart-IoT bottle capabilities and subscription tracking. The corporate team validates our commercial parameters.",
          mbaReport: {
            marketResearch: "### Market Sizing and Opportunities\n\nOur smart, reusable water bottle target addressable market (TAM) reaches approximately $2.1 Billion within NA & EU metropolitan grids. Consumers actively opt out of single-use bottles for sustainable premium alternatives. Industry standard CAGR for eco-focused smart consumer electronics sits solid at 11.2%. We locate direct tailwinds in fitness monitoring. Target region alignment is extremely strong.",
            competitorAnalysis: "### Key Competitors Analysis\n\n1. **HidrateSpark**: Premier smart tracker with high API integrations. Charges hardware premium but locks users. Weakness: Pricing is steep ($70+).\n2. **Larq**: Focuses on UV purification tech. Strong design footprint and prestige. Weakness: No hydration volume tracking.\n3. **Yeti & Stanley (Analog)**: Massive emotional and commercial brand equity. Weakness: Fully analog, missing data engagement metrics.",
            swotAnalysis: {
              strengths: ["100% biodegradable ocean-plastic materials", "Proprietary offline hydration metrics sensor panel", "Integrated social fitness community app hooks", "Affordable modular pricing option ($35 MVP cost)"],
              weaknesses: ["Higher hardware production costs than simple bottles", "Requires ongoing server sync database maintenance", "Heavy dependency on metal component supply chains", "Saturated lifestyle tumbler customer mindshare"],
              opportunities: ["Correlate corporate workplace eco-wellness wellness logs", "Venture into localized retail stores scaling channels", "Custom bespoke user engraving customization tiers", "Dynamic carbon reduction metric loyalty system"],
              threats: ["Supply chain bottlenecks on raw silicon sensors", "Low-cost electronic counterfeit replacements", "Slower customer adoption in premium hardware sectors", "Evolving hardware battery safety directives"]
            },
            demandForecasting: "### Demographics & Demand\n\nWe project core adoption spikes within ages 25-35 urban professional brackets who frequent gyms and utilize iOS/Android fitness ecosystems. Demand calculations predict a 3.4% introductory market conversion on direct social platform ads.",
            revenueEstimation: "### Financial Model Framework\n\n- Proposed Unit Retail Price: $45.00 (with ocean plastic design charm).\n- Direct Manufacturing Tier COGS: $14.80 per unit.\n- Gross Margin: 67.1%.\n- Target Break-Even Scale: 1,800 units sold.",
            insights: "### Operations & Roadblocks\n\nCritical risks align around electronic firmware sensor calibration delays and shipping battery cargo constraints. General business feasibility is rated high (8/10), provided initial tooling is secured."
          },
          pmReport: {
            prd: "### Product Requirements Document\n\n**Product Goal**: To deliver a reliable, beautifully textured smart container tracking real-time intake metrics while providing high-contrast LED indicators. Users can monitor daily goal progress seamlessly.\n\n**Personas**:\n- *Laura, 28*: Tech project lead who spends meetings sitting, forgetting to hydrate. Craves automatic calendar prompts.",
            features: [
              "Haptic Vibration reminders based on historic daily intake deficits.",
              "Waterproof USB-C modular charging base (IP67 certification).",
              "Dynamic integrated companion app displaying geographic hydration hotspots.",
              "Double-walled vacuum insulated, cold storage retention up to 24 hours.",
              "Automatic Apple Health & Google Fit calorie/hydration index synchronization."
            ],
            specifications: [
              "Capacitive liquid level sensor built inside robust interior stem.",
              "Bluetooth 5.2 Low Energy SoC (Nordic Semiconductor).",
              "Premium brushed food-grade 304 Stainless Steel shell.",
              "360-mAh rechargeable Li-Poly cell with 12-day battery lifetime."
            ],
            roadmap: [
              "Q1-Q2 2027: Finalize sensor PCB and enclosure CAD models. Release physical 3D-molded shell.",
              "Q3 2027: Launch KickStarter crowdfunding; deliver 500 pre-orders to beta validators.",
              "Q4 2027: Transition into standard commercial Shopify sales. Roll out Android & iOS companion apps.",
              "Q1 2028: Expand features to include team hydration challenges and enterprise office subscriptions."
            ],
            pricingStrategy: "### Multi-Tier Price Architectureing\n- **Individual Standard Hardware**: $45.00 flat fee.\n- **Premium Eco-Hydration Pack**: $55.00 includes personalized wood-grain cap and app expansion.\n- **Corporate Suite Subscription**: $12.00 monthly recurring per employee (bottle included + enterprise administrative HR health portal).",
            recommendations: "### PM Quality Recommendations\n1. Establish robust hardware QA testing to guarantee seals prevent core structural water leakage to the internal PCB module.\n2. Leverage specialized recyclable cardboard packaging to reduce physical materials footprint by 40%."
          },
          marketingReport: {
            brandingSuggestions: [
              "EcoH2O Smart - highly literal, communicates sustainable water tracking.",
              "SipSphere - modern lifestyle, high brand potential.",
              "Aura Hydrate - sleek premium aesthetic matching luxury design."
            ],
            taglineSuggestions: [
              "Sip Intelligently, Live Sustainably.",
              "Hydrate Your Body. Heal the Planet.",
              "Smart Hydration in Every Drop."
            ],
            strategy: "### Launch & Marketing Campaign\n\nUtilize localized micro-influencers specializing in modern productivity and aesthetic minimalism. Run active Instagram Reels and TikTok campaigns showing the satisfaction of completing the illuminated hydration LED ring. Deploy key partnerships in boutique gym locations.",
            campaigns: [
              "Campaign #TheSipChallenge: 14-day progressive community hydration tracker log sharing.",
              "Campaign #WaterPrint: Showcase the metric value of ocean plastic rescued with each bottle sold.",
              "Campaign #ModernCalm: Position EcoSmart as a workspace desk essential alongside clean keyboards."
            ],
            launchPlan: "### Detailed Launch Plan\n- **Launch Day minus 30**: Warm up early access sign-up list with VIP discounts.\n- **Launch Day**: Live-streamed product launch with eco-advocate founders.\n- **Launch Day plus 30**: Retarget early web visitors with real reviews and unboxing highlights."
          },
          analytics: {
            trendData: [
              { period: "Q1 2027", sales: 120, competitor: 150 },
              { period: "Q2 2027", sales: 210, competitor: 180 },
              { period: "Q3 2027", sales: 380, competitor: 220 },
              { period: "Q4 2027", sales: 550, competitor: 260 }
            ],
            sentimentData: [
              { rating: "Positive", value: 85 },
              { rating: "Neutral", value: 10 },
              { rating: "Negative", value: 5 }
            ],
            growthPredictions: [
              { period: "Year 1", withMarketing: 210000, baseline: 120000 },
              { period: "Year 2", withMarketing: 490000, baseline: 210000 },
              { period: "Year 3", withMarketing: 890000, baseline: 340000 }
            ]
          }
        }
      },
      {
        id: "proj_seed_2",
        userId: "user_seed",
        name: "PulseTracker v1",
        type: "improvement",
        input2: {
          productName: "PulseTracker v1",
          category: "Wearable Health Monitors",
          salesDataText: "Steady decline since competitor released v2. Sales down 45% over last two quarters. Q1 sales 4000 units, Q2 sales 2200 units. Price pressure from cheaper imports.",
          reviewsText: "Customer reviews are critical: 2.8 stars average. Complaints on short battery life (only lasts 14 hours), slow wireless synchronization, screen is unreadable under harsh sunlight, strap tears easily during workouts.",
          competitorInfo: "Xiaomi Band and FitBit Charge occupy midmarket brackets. Charge has 7-day battery life and seamless sync, Xiaomi pricing is flatly $35, half of our price.",
          description: "A mid-tier fitness band tracking steps, active pulse, sleep score, and basic call notifications."
        },
        status: "completed",
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        report: {
          executiveSummary: "Strategic business transformation analysis validates that physical strap deficiencies, screen legibility limitations, and server synchronization delays are causing critical customer attrition for PulseTracker v1. Retooling and v2 rebranding are highly recommended.",
          mbaReport: {
            marketResearch: "### Historical Downturn Diagnosis\n\nSales metrics verify an urgent need for physical product adjustments. Sales fell from 4,000 to 2,200 units (45% downturn) following the introduction of competitor v2 variants featuring extended multi-day battery cycles. Standard margins must be optimized via parts replacement.",
            competitorAnalysis: "### Direct Competitive Gaps\n\n- **Xiaomi Band**: Attracts price-conscious consumers at $35 with dependable 14-day battery metrics. This sets the pricing floor.\n- **Fitbit Charge**: Provides premium community ecosystems, sleep insights, and seamless sync, justifying its $80 price tier.\n- **PulseTracker v1 (Our Model)**: Priced at $69 but suffers 14-hour real battery depletion. Unfavorable customer ratings call for swift correction.",
            swotAnalysis: {
              strengths: ["Highly responsive integrated heart-rate algorithms", "Established fitness tracking database layers", "High core brand goodwill among veteran fans", "Water-resistant aluminum alloy sensor casing"],
              weaknesses: ["Short 14-hour physical battery cycle lifespan", "Fragile silicone wrist strap that splits easily", "Unreadable OLED display in natural outdoor light", "Server synchronization latency issues in companion app"],
              opportunities: ["Shift-focus to corporate digital wellness subscriptions", "Formulate customizable nylon utility straps v2", "Integrate automated AI wellness coaching tips", "Aggressive price revitalization campaigns"],
              threats: ["Dynamic price undercut from foreign importers", "Losing tracking API approvals with Apple/Google Fit", "Extended hardware warehouse overheads", "Customer transition to comprehensive smartwatches"]
            },
            demandForecasting: "### App Sentiment Analysis\n\nUser reviews show clear friction points with 2.8 average stars. Negative sentiment clusters securely around battery (42%), strap failure (28%), app failure (18%), and screen light (12%). Addressing these yields an estimated 180% surge in positive ratings.",
            revenueEstimation: "### Revitalized Cost Analysis\n- Current COGS: $26.50 (with obsolete parts).\n- Target Improved COGS: $21.20 by introducing standard high-capacity battery architectures and premium lightweight glass filters.",
            insights: "### Diagnostic Feasibility Summary\n\nProduct improvements remain highly profitable. Launching an optimized model can re-acquire 60% of lost consumer market share."
          },
          pmReport: {
            prd: "### Product Requirements Document v2\n\n**Mission Statement**: Redesign and transform PulseTracker from a fragile device into a 7-day rugged fitness buddy with high sunlight visibility.\n\n**Identified Weaknesses**:\n1. Fragile, low-tensile silicone strap.\n2. Inefficient battery circuit causing 14-hour limits.\n3. Low-lumens OLED display screen.\n4. High wireless latency on data uploads.",
            features: [
              "V2 Rugged Fluorocarbon strap formulation - 3x stronger.",
              "Ultra-efficient micro-energy management chip driving a 7-day runtime.",
              "High-contrast AMOLED display reaching 650 nits peak sunlight brightness.",
              "Upgrade to Bluetooth Low Energy 5.3 SoC reducing sync latency by 70%."
            ],
            specifications: [
              "Integrated real-time Blood Oxygen (SpO2) optical module.",
              "6-Axis motion accelerometer & gyroscope.",
              "Anodized Aerospace Aluminum casing (IP68, 5ATM waterproofing depth).",
              "180-mAh dense polymer batteries with fast magnetic charging cable."
            ],
            roadmap: [
              "Month 1: Tooling adjustment for improved fluorocarbon casing, pilot PCB validation.",
              "Month 2: App hotfix to streamline offline sync and handle background battery saving.",
              "Month 3-4: Launch PulseTracker v2 Upgrade Program to existing purchasers at 50% discount.",
              "Month 5: Scaling retail supply chains into larger electronic brick-and-mortar storefronts."
            ],
            pricingStrategy: "### Revised Pricing Architecture\n- **Base Launch Price**: $59.00 (discounted to grab Xiaomi and FitBit market share).\n- **Upgrade Tier**: $45.00 for original purchasers.\n- **Enterprise Bulk Pricing**: $32.00 in orders of 1,000+ units.",
            recommendations: "### Operational Directives\nMigrate assembly sourcing to modular contract producers to control high-volume yields. Institute strict quality tests for strap flexibility."
          },
          marketingReport: {
            brandingSuggestions: [
              "PulseTracker Pro v2 - High performance positioning.",
              "Aura Pulse v2 - Holistic lifestyle appeal.",
              "Apex Pulse v2 - Professional workout emphasis."
            ],
            taglineSuggestions: [
              "Ruggedly Refined. Endlessly Tracking.",
              "7 Days of Power, 24 Hours of Precision.",
              "Reborn to Move with You."
            ],
            strategy: "### Digital Customer Acquisition Strategy\n\nRun highly transparent 'Behind-The-Scenes Re-Engineering' video campaigns. Address critical negative reviews directly with humor and detail (e.g., 'Yes, our strap broke—so we built a new one that can pull a truck'). This authentic positioning establishes massive digital brand integrity.",
            campaigns: [
              "Social Campaign #TheRebirth: Interactive customer exchange stories.",
              "Influencer Campaign #PulseWeek: 7-day fitness routine videos showcasing zero recharges.",
              "Retargeting Campaign #WeHeardYou: Dedicated CRM ads directly mapping upgraded features."
            ],
            launchPlan: "### Growth Impact Prediction\nWe project digital campaigns will generate over 20 Million views in targeted health niches, leading to 15,000 introductory device sales, driving a post-upgrade positive sentiment index of 91%."
          },
          analytics: {
            trendData: [
              { period: "Pre-Drop", sales: 4000, competitor: 1500 },
              { period: "Q1 Drop", sales: 2200, competitor: 2500 },
              { period: "Q2 Drop", sales: 1200, competitor: 3200 },
              { period: "Upgrade Launch (Proj)", sales: 3800, competitor: 2100 }
            ],
            sentimentData: [
              { rating: "Positive", value: 35 },
              { rating: "Neutral", value: 25 },
              { rating: "Negative", value: 40 }
            ],
            growthPredictions: [
              { period: "Month 1 (Fix)", withMarketing: 25000, baseline: 8000 },
              { period: "Month 3 (Growth)", withMarketing: 65000, baseline: 12000 },
              { period: "Month 6 (Maturity)", withMarketing: 180000, baseline: 18000 }
            ]
          }
        }
      }
    ]
  };
}

// Vite Server Setup for Full-Stack App
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ProductPilot AI Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
