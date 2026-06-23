import React, { useState, useEffect } from "react";
import {
  Compass,
  Plus,
  Search,
  LogOut,
  Moon,
  Sun,
  Layers,
  History,
  TrendingUp,
  Award,
  Trash2,
  Play,
  RotateCw,
  Bell,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  User,
  SlidersHorizontal,
  MessageSquare,
  CheckSquare,
  ShieldAlert,
  Users,
} from "lucide-react";
import { Project, WorkflowType, ProjectComment, WorkspaceTask } from "./types";
import { LoginView } from "./components/LoginView";
import { ProjectCreateView } from "./components/ProjectCreateView";
import { ReportViewer } from "./components/ReportViewer";

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; name: string; role: string } | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDark, setIsDark] = useState(true);

  // Collaboration threads, checklist tasks, and authorization tabs
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [workspaceTasks, setWorkspaceTasks] = useState<WorkspaceTask[]>([]);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<"strat_board" | "collab_team" | "authority_signoff">("strat_board");
  const [newCommentText, setNewCommentText] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("Product Manager");

  // Executive approvals inputs
  const [approvalIsApproved, setApprovalIsApproved] = useState(true);
  const [approvalCommentText, setApprovalCommentText] = useState("");

  // System Team roster list
  const [teamRoster, setTeamRoster] = useState<{ id: string; name: string; email: string; role: string }[]>([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterWorkflow, setFilterWorkflow] = useState<"all" | "new_product" | "improvement">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "draft" | "completed" | "failed">("all");

  // Loaders & toast notifications
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [runningAgents, setRunningAgents] = useState<Record<string, boolean>>({});
  const [agentStepMessage, setAgentStepMessage] = useState("");
  const [notifications, setNotifications] = useState<{ id: string; text: string; type: "success" | "error" | "info" }[]>([]);

  // Validate session on boot
  useEffect(() => {
    if (token) {
      setLoadingWorkspace(true);
      fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("Session expired.");
          const data = await res.json();
          setCurrentUser(data.user);
          loadProjects(token);
          loadTeamRoster(token);
        })
        .catch((err) => {
          console.error(err);
          handleLogout();
          addNotification("Your security token has expired. Please sign in again.", "error");
        })
        .finally(() => {
          setLoadingWorkspace(false);
        });
    }
  }, [token]);

  // Load comments, tasks, and tabs whenever projectId changes
  useEffect(() => {
    if (token && selectedProjectId) {
      // Comments
      fetch(`/api/projects/${selectedProjectId}/comments`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setComments(data || []))
        .catch(err => console.error("Comments download error:", err));

      // Tasks
      fetch(`/api/projects/${selectedProjectId}/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setWorkspaceTasks(data || []))
        .catch(err => console.error("Tasks download error:", err));

      setActiveWorkspaceTab("strat_board");
    } else {
      setComments([]);
      setWorkspaceTasks([]);
    }
  }, [selectedProjectId, token]);

  const loadProjects = async (authToken: string) => {
    try {
      const res = await fetch("/api/projects", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        if (data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(data[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to load user projects", e);
    }
  };

  const loadTeamRoster = async (authToken: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTeamRoster(data || []);
      }
    } catch (e) {
      console.error("Failed to load team roster", e);
    }
  };

  const handleLoginSuccess = (newToken: string, user: { id: string; email: string; name: string; role: string }) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setCurrentUser(user);
    loadProjects(newToken);
    loadTeamRoster(newToken);
    addNotification(`Welcome back, ${user.name}! Switched seat to workspace.`, "success");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setCurrentUser(null);
    setProjects([]);
    setComments([]);
    setWorkspaceTasks([]);
    setTeamRoster([]);
    setSelectedProjectId(null);
    setIsCreating(false);
  };

  const addNotification = (text: string, type: "success" | "error" | "info" = "info") => {
    const id = Math.random().toString(36).substring(7);
    setNotifications((prev) => [{ id, text, type }, ...prev]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4500);
  };

  const handleSwitchRole = async (newRole: string) => {
    if (!token || !currentUser) return;
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: currentUser.name, role: newRole })
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data.user);
        addNotification(`Privileges updated: Switched seat perspective to ${newRole}.`, "success");
        // Also refresh user roster to align changes
        loadTeamRoster(token);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      addNotification(err.message || "Failed to update workbench seat.", "error");
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedProjectId || !newCommentText.trim()) return;

    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: newCommentText })
      });
      const data = await res.json();
      if (res.ok) {
        setComments(prev => [...prev, data]);
        setNewCommentText("");
        addNotification("Collaboration note added to canvas.", "success");
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      addNotification(err.message || "Failed to submit feedback.", "error");
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedProjectId || !newTaskTitle.trim()) return;

    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title: newTaskTitle, assignedTo: newTaskAssignee })
      });
      const data = await res.json();
      if (res.ok) {
        setWorkspaceTasks(prev => [...prev, data]);
        setNewTaskTitle("");
        addNotification(`New checkout milestone assigned to ${newTaskAssignee}.`, "success");
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      addNotification(err.message || "Failed to create task.", "error");
    }
  };

  const handleToggleTask = async (taskId: string) => {
    if (!token || !selectedProjectId) return;
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/tasks/${taskId}/toggle`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      const updated = await res.json();
      if (res.ok) {
        setWorkspaceTasks(prev => prev.map(t => t.id === taskId ? updated : t));
        addNotification(updated.completed ? "Milestone task completed." : "Milestone reverted to open status.", "info");
      }
    } catch (e) {
      addNotification("Milestone toggle failed.", "error");
    }
  };

  const handleApproveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedProjectId) return;
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ approved: approvalIsApproved, comment: approvalCommentText })
      });
      const data = await res.json();
      if (res.ok) {
        setProjects(prev => prev.map(p => p.id === selectedProjectId ? data : p));
        addNotification(approvalIsApproved ? "Project strategy formally APPROVED!" : "Project designated for revision cycle.", "success");
        setApprovalCommentText("");
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      addNotification(err.message || "Approval submission intercept failed.", "error");
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  // Trigger new project submission
  const handleCreateProject = async (name: string, type: WorkflowType, input: any) => {
    if (!token) return;
    try {
      const payload = {
        name,
        type,
        input1: type === "new_product" ? input : undefined,
        input2: type === "improvement" ? input : undefined,
      };

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const newProj = await res.json();
      if (!res.ok) throw new Error(newProj.error || "Failed to catalog project.");

      setProjects((prev) => [newProj, ...prev]);
      setSelectedProjectId(newProj.id);
      setIsCreating(false);
      addNotification(`Draft created successfully for "${name}". Ready for Board review.`, "success");
    } catch (e: any) {
      addNotification(e.message || "Unable to catalog project.", "error");
    }
  };

  // Trigger Multi-Agent Orchestrator
  const handleRunAgents = async (projId: string) => {
    if (!token) return;
    setRunningAgents((prev) => ({ ...prev, [projId]: true }));

    // Cyclical loading message sequence to reassure user
    const steps = [
      "Establishing connection to virtual boardroom session...",
      "MBA Analyst Agent starting competitive SWOT and regional demand calculations...",
      "MBA Analyst Analyst feeding pricing strategies to Product Manager Agent...",
      "Product Manager Agent compiling PRD specifications and phase metrics...",
      "Marketing Manager Agent ideating brand tagline ideas matching demographic...",
      "Executive Synthesizer compiling all reports into metrics dashboard...",
    ];

    let stepIndex = 0;
    setAgentStepMessage(steps[0]);
    const interval = setInterval(() => {
      stepIndex = (stepIndex + 1) % steps.length;
      setAgentStepMessage(steps[stepIndex]);
    }, 2800);

    try {
      const res = await fetch(`/api/projects/${projId}/agents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedProj = await res.json();
      clearInterval(interval);

      if (!res.ok) {
        throw new Error(updatedProj.error || "Boardroom failed to complete review.");
      }

      setProjects((prev) => prev.map((p) => (p.id === projId ? updatedProj : p)));
      addNotification(`boardroom multi-agent assessment completed for ${updatedProj.name}!`, "success");
    } catch (e: any) {
      clearInterval(interval);
      addNotification(e.message || "Failed to complete multi-agent review.", "error");

      // Reload list to recover baseline error state
      loadProjects(token);
    } finally {
      setRunningAgents((prev) => ({ ...prev, [projId]: false }));
      setAgentStepMessage("");
    }
  };

  // Delete project
  const handleDeleteProject = async (projId: string) => {
    if (!token) return;
    const confirmDelete = window.confirm("Are you sure you want to delete this strategic matrix?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/projects/${projId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== projId));
        if (selectedProjectId === projId) {
          setSelectedProjectId(null);
        }
        addNotification("Project deleted from registry.", "info");
      }
    } catch (e) {
      addNotification("Failed to delete project.", "error");
    }
  };

  // Search/Filters compute
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.input1?.category || p.input2?.category || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesWorkflow = filterWorkflow === "all" ? true : p.type === filterWorkflow;
    const matchesStatus = filterStatus === "all" ? true : p.status === filterStatus;
    return matchesSearch && matchesWorkflow && matchesStatus;
  });

  if (!token) {
    return <LoginView onLoginSuccess={handleLoginSuccess} isDark={isDark} />;
  }

  return (
    <div className={`min-h-screen font-sans flex flex-col md:flex-row transition-all ${
      isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
    }`}>
      {/* Toast Popover */}
      <div className="fixed top-5 right-5 z-50 space-y-2 pointer-events-none max-w-sm">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`p-4 flex items-start space-x-3 shadow-xl border pointer-events-auto transition-all ${
              n.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/90 border-emerald-500 text-emerald-800 dark:text-emerald-300"
                : n.type === "error"
                  ? "bg-red-50 dark:bg-red-950/90 border-red-500 text-red-800 dark:text-red-300"
                  : "bg-indigo-50 dark:bg-indigo-950/90 border-indigo-500 text-indigo-850 dark:text-indigo-300"
            }`}
          >
            {n.type === "success" ? (
              <CheckCircle className="w-5 h-5 shrink-0" />
            ) : n.type === "error" ? (
              <AlertCircle className="w-5 h-5 shrink-0" />
            ) : (
              <Bell className="w-5 h-5 shrink-0" />
            )}
            <p className="text-xs font-semibold leading-relaxed">{n.text}</p>
          </div>
        ))}
      </div>

      {/* LEFT SIDEBAR PANEL */}
      <aside className={`w-full md:w-80 shrink-0 border-r flex flex-col justify-between p-5 transition-all ${
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-205"
      }`}>
        <div className="space-y-6">
          {/* Brand Flag / Name */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 bg-indigo-600 text-white flex items-center justify-center font-black border border-indigo-400">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-black uppercase tracking-wider">ProductPilot AI</h1>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Boardroom Hub</span>
              </div>
            </div>

            <button
              onClick={() => setIsDark(!isDark)}
              className="p-1.5 border text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-850 hover:text-indigo-500 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          {/* User Meta Card with Dynamic Seat Swapper */}
          {currentUser && (
            <div className={`p-3.5 border-l-4 border-l-indigo-600 border flex flex-col space-y-2.5 ${
              isDark ? "bg-slate-850 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-150 text-slate-700"
            }`}>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 border border-indigo-200 text-xs font-bold flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="grow min-w-0 font-medium">
                  <p className="text-xs font-bold truncate">{currentUser.name}</p>
                  <p className="text-[10px] text-indigo-500 uppercase font-black tracking-wider leading-none">Seat: {currentUser.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1 hover:bg-red-500/15"
                  title="Log Out Session"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                </button>
              </div>

              {/* Dynamic perspective bench switch */}
              <div className="pt-2 border-t border-slate-250 dark:border-slate-800/80">
                <label className="block text-[8px] font-extrabold uppercase tracking-widest text-slate-400 mb-1 leading-none">
                  Swap Workbench Seat Perspective:
                </label>
                <select
                  value={currentUser.role}
                  onChange={(e) => handleSwitchRole(e.target.value)}
                  className={`w-full text-[10px] font-bold p-1 border uppercase tracking-wide cursor-pointer focus:ring-1 focus:ring-indigo-500 ${
                    isDark ? "bg-slate-900 border-slate-800 text-indigo-400" : "bg-white border-slate-200 text-slate-701"
                  }`}
                >
                  <option value="Lead Strategist">Lead Strategist</option>
                  <option value="Admin">Board Administrator (Admin)</option>
                  <option value="MBA Analyst">MBA Analyst</option>
                  <option value="Product Manager">Product Manager</option>
                  <option value="Marketing Manager">Marketing Manager</option>
                </select>
              </div>
            </div>
          )}

          {/* New Project trigger button */}
          <button
            onClick={() => {
              setIsCreating(true);
              setSelectedProjectId(null);
            }}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-widest transition flex items-center justify-center space-x-1.5 border border-indigo-500"
          >
            <Plus className="w-4 h-4" />
            <span>New Strategy Canvas</span>
          </button>

          {/* Search bar inside sidebar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none opacity-40">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search product strategy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full text-xs pl-9 pr-3 py-2.5 border outline-hidden font-mono ${
                isDark ? "bg-slate-850 border-slate-800 focus:border-indigo-600 text-white" : "bg-slate-50 border-slate-200 focus:border-indigo-400 text-slate-850"
              }`}
            />
          </div>

          {/* Filters dropdowns */}
          <div className="space-y-2 p-3 border dark:border-slate-800">
            <div className="flex items-center justify-between text-[10px] font-black uppercase opacity-60">
              <span className="flex items-center space-x-1">
                <SlidersHorizontal className="w-3 h-3" />
                <span>Filters</span>
              </span>
              {(filterWorkflow !== "all" || filterStatus !== "all" || searchQuery !== "") && (
                <button
                  onClick={() => {
                    setFilterWorkflow("all");
                    setFilterStatus("all");
                    setSearchQuery("");
                  }}
                  className="text-indigo-500 hover:underline cursor-pointer lowercase"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <span className="block opacity-50 mb-1 uppercase font-bold tracking-wider">Matrix</span>
                <select
                  value={filterWorkflow}
                  onChange={(e) => setFilterWorkflow(e.target.value as any)}
                  className={`w-full p-1.5 border text-[10px] uppercase font-bold ${
                    isDark ? "bg-slate-950 border-slate-800 text-slate-350" : "bg-white border-slate-200 text-slate-705"
                  }`}
                >
                  <option value="all">All</option>
                  <option value="new_product">Workflow 1</option>
                  <option value="improvement">Workflow 2</option>
                </select>
              </div>

              <div>
                <span className="block opacity-50 mb-1 uppercase font-bold tracking-wider">Status</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className={`w-full p-1.5 border text-[10px] uppercase font-bold ${
                    isDark ? "bg-slate-950 border-slate-800 text-slate-350" : "bg-white border-slate-200 text-slate-705"
                  }`}
                >
                  <option value="all">All</option>
                  <option value="draft">Draft</option>
                  <option value="completed">Analyzed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Project History List selector */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-black uppercase tracking-wider opacity-60 flex items-center space-x-1.5 select-none text-slate-400">
              <History className="w-3.5 h-3.5" />
              <span>Project Chronology ({filteredProjects.length})</span>
            </h3>

            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {filteredProjects.map((proj) => {
                const isActive = proj.id === selectedProjectId;
                return (
                  <div
                    key={proj.id}
                    onClick={() => {
                      setIsCreating(false);
                      setSelectedProjectId(proj.id);
                    }}
                    className={`p-3 border text-left cursor-pointer transition flex items-center justify-between ${
                      isActive
                        ? "border-l-4 border-l-indigo-600 border-indigo-500 bg-slate-50 dark:bg-slate-850 text-indigo-700 dark:text-indigo-400 font-bold"
                        : isDark ? "border-slate-800 bg-slate-900/40 hover:bg-slate-850 text-slate-300" : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <div className="min-w-0 pr-2 grow">
                      <p className="text-xs font-bold uppercase tracking-tight truncate">{proj.name}</p>
                      <span className="text-[9px] opacity-60 uppercase font-extrabold tracking-wider block leading-none mt-1">
                        {proj.type.replace("_", " ")}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      <span className={`w-2.5 h-2.5 ${
                        proj.status === "completed"
                          ? "bg-emerald-500"
                          : proj.status === "failed"
                            ? "bg-red-500"
                            : proj.status === "running"
                              ? "bg-indigo-500 animate-pulse"
                              : "bg-slate-400"
                      }`} />
                    </div>
                  </div>
                );
              })}

              {filteredProjects.length === 0 && (
                <p className="text-[11px] text-center opacity-40 mt-4 uppercase font-bold tracking-wider">No matching draft vectors found.</p>
              )}
            </div>
          </div>
        </div>

        <div className="text-[9px] text-center opacity-40 border-t pt-3 border-slate-200 dark:border-slate-800 select-none uppercase font-extrabold tracking-widest text-slate-400">
          ProductPilot AI Enterprise Boardroom
        </div>
      </aside>

      {/* MAIN FRAME ACTION AREA */}
      <main className="grow flex flex-col min-w-0">
        {loadingWorkspace ? (
          <div className="grow flex flex-col items-center justify-center p-8">
            <RotateCw className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
            <p className="text-xs opacity-60">Initializing premium boardrooms channels...</p>
          </div>
        ) : isCreating ? (
          <div className="p-6 md:p-8 overflow-y-auto">
            <ProjectCreateView
              onSubmit={handleCreateProject}
              onCancel={() => {
                setIsCreating(false);
                if (projects.length > 0) {
                  setSelectedProjectId(projects[0].id);
                }
              }}
              isDark={isDark}
              userRole={currentUser?.role || "Lead Strategist"}
            />
          </div>
        ) : selectedProject ? (
          <div className="p-6 md:p-8 grow overflow-y-auto flex flex-col space-y-6">
             {/* Project Header Widget */}
            <div className={`p-6 border-t-4 border-t-indigo-650 border flex flex-col md:flex-row md:items-center justify-between gap-6 transition ${
              isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-205"
            }`}>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 block mb-1">
                  Currently Auditing Workspace
                </span>
                <h2 className="text-2xl font-black uppercase tracking-tight">{selectedProject.name}</h2>
                <p className="text-xs text-slate-500 mt-1 uppercase font-semibold">
                  Workflow Matrix: <span className="text-indigo-605 dark:text-indigo-400">{selectedProject.type.replace("_", " ")}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {selectedProject.status === "draft" && (
                  <button
                    onClick={() => handleRunAgents(selectedProject.id)}
                    disabled={runningAgents[selectedProject.id]}
                    className="px-6 py-3 text-xs font-bold uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white flex items-center space-x-2 transition border border-indigo-505 disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Convene Board Meeting</span>
                  </button>
                )}

                {selectedProject.status === "completed" && (
                  <button
                    onClick={() => handleRunAgents(selectedProject.id)}
                    disabled={runningAgents[selectedProject.id]}
                    className="px-6 py-3 bg-slate-100 hover:bg-slate-205 dark:bg-slate-800 dark:hover:bg-slate-750 text-xs font-bold uppercase tracking-widest flex items-center space-x-2 transition border border-slate-350 dark:border-slate-700"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Re-Convene Sprints (AI)</span>
                  </button>
                )}

                <button
                  onClick={() => handleDeleteProject(selectedProject.id)}
                  className="p-3 bg-red-500/10 hover:bg-red-500/25 text-red-500 border border-red-500/30 transition"
                  title="Wipe Canvas Project"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* AI Runs visual loader */}
            {runningAgents[selectedProject.id] ? (
              <div className={`p-12 rounded-3xl border flex flex-col items-center justify-center text-center space-y-4 ${
                isDark ? "bg-gray-950 border-indigo-900/30" : "bg-indigo-50/20 border-indigo-100 shadow-sm"
              }`}>
                <div className="relative">
                  <div className="w-16 h-16 rounded-3xl border-4 border-indigo-200 border-t-indigo-600 animate-spin flex items-center justify-center" />
                  <Compass className="w-6 h-6 text-indigo-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Multi-Agent Board Convened</h3>
                  <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-2 font-mono italic animate-pulse">
                    "{agentStepMessage}"
                  </p>
                </div>
                <p className="text-[10px] text-gray-400 max-w-sm leading-relaxed">
                  The virtual boardroom sequentially communicates. Market size variables align with specs, and dynamic pricing metrics formulate creative tagline briefs.
                </p>
              </div>
            ) : selectedProject.status === "completed" ? (
              <div className="space-y-6">
                {/* Board Workspace sub-tab navigation buttons */}
                <div className={`flex flex-wrap gap-2 border-b ${isDark ? "border-slate-800" : "border-slate-200"}`}>
                  <button
                    onClick={() => setActiveWorkspaceTab("strat_board")}
                    className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider relative transition-colors ${
                      activeWorkspaceTab === "strat_board"
                        ? "text-indigo-500 font-extrabold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {activeWorkspaceTab === "strat_board" && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
                    )}
                    <span className="flex items-center space-x-2">
                      <Compass className="w-3.5 h-3.5" />
                      <span>Executive Report Board</span>
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveWorkspaceTab("collab_team")}
                    className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider relative transition-colors ${
                      activeWorkspaceTab === "collab_team"
                        ? "text-indigo-500 font-extrabold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {activeWorkspaceTab === "collab_team" && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
                    )}
                    <span className="flex items-center space-x-2">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Collaboration & Tasks ({comments.length + workspaceTasks.length})</span>
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveWorkspaceTab("authority_signoff")}
                    className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider relative transition-colors ${
                      activeWorkspaceTab === "authority_signoff"
                        ? "text-indigo-500 font-extrabold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {activeWorkspaceTab === "authority_signoff" && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
                    )}
                    <span className="flex items-center space-x-2">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Board Approvals {selectedProject.approved ? "✅" : "⏳"}</span>
                    </span>
                  </button>
                </div>

                {/* Grid sub-tab display */}
                {activeWorkspaceTab === "strat_board" ? (
                  <ReportViewer
                    project={selectedProject}
                    isDark={isDark}
                    currentUserRole={currentUser?.role || "Lead Strategist"}
                  />
                ) : activeWorkspaceTab === "collab_team" ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LEFT CHAT COLLABORATION PANEL */}
                    <div className={`p-5 border flex flex-col justify-between space-y-4 lg:col-span-7 ${
                      isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-xs"
                    }`}>
                      <div>
                        <h3 className="text-xs font-extrabold uppercase tracking-widest text-indigo-400 mb-3 flex items-center space-x-2">
                          <MessageSquare className="w-4 h-4 text-indigo-500" />
                          <span>Boardroom Notes & Feedbacks ({comments.length})</span>
                        </h3>
                        
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                          {comments.map((c) => (
                            <div
                              key={c.id}
                              className={`p-3.5 border text-xs relative ${
                                isDark ? "bg-slate-950 border-slate-850" : "bg-slate-100 border-slate-200"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1 opacity-75">
                                <span className="font-bold text-slate-200 dark:text-indigo-300">{c.userName}</span>
                                <span className="text-[9px] uppercase tracking-wider bg-indigo-105 border dark:border-slate-800 px-1.5 py-0.5 text-indigo-600 dark:text-indigo-400 font-extrabold">
                                  {c.userRole}
                                </span>
                              </div>
                              <p className="opacity-90 leading-relaxed font-sans">{c.text}</p>
                              <span className="absolute bottom-1 right-2 text-[8px] font-mono opacity-40">
                                {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))}

                          {comments.length === 0 && (
                            <p className="text-xs text-center opacity-40 py-6 uppercase font-bold tracking-wider">No comments logged in boardroom.</p>
                          )}
                        </div>
                      </div>

                      <form onSubmit={handleAddComment} className="pt-4 border-t dark:border-slate-800 space-y-2">
                        <textarea
                          rows={2}
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          placeholder="Log strategic input, review notes, or critique..."
                          className={`w-full text-xs p-2.5 border outline-hidden font-sans resize-none ${
                            isDark ? "bg-slate-950 border-slate-850 focus:border-indigo-500 text-white" : "bg-slate-50 border-slate-200 focus:border-indigo-400 text-slate-850"
                          }`}
                        />
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] opacity-40 uppercase font-mono">Posting as {currentUser.name}</span>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase tracking-widest transition border border-indigo-500"
                          >
                            Add Note
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* RIGHT ASSIGNED WORKPLACE ROADMAP CHECKLIST */}
                    <div className={`p-5 border flex flex-col justify-between space-y-4 lg:col-span-5 ${
                      isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-xs"
                    }`}>
                      <div>
                        <h3 className="text-xs font-extrabold uppercase tracking-widest text-indigo-400 mb-3 flex items-center space-x-2">
                          <CheckSquare className="w-4 h-4 text-indigo-500" />
                          <span>Ad-Hoc Sprint Checklist ({workspaceTasks.length})</span>
                        </h3>

                        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                          {workspaceTasks.map((t) => (
                            <div
                              key={t.id}
                              onClick={() => handleToggleTask(t.id)}
                              className={`p-3 border flex items-start space-x-3 cursor-pointer transition select-none ${
                                t.completed
                                  ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/40 opacity-70"
                                  : isDark ? "bg-slate-950 border-slate-850 hover:bg-slate-850 text-slate-200" : "bg-slate-100 border-slate-200 hover:bg-slate-150"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={t.completed}
                                onChange={() => {}} 
                                className="w-4 h-4 mt-0.5 cursor-pointer accent-indigo-600 rounded"
                              />
                              <div className="grow min-w-0">
                                <p className={`text-xs ${t.completed ? "line-through text-slate-500" : "font-semibold"}`}>
                                  {t.title}
                                </p>
                                <div className="flex items-center space-x-2 mt-1 text-[9px] uppercase font-bold text-indigo-400">
                                  <span>Role Assigned: {t.assignedTo}</span>
                                </div>
                              </div>
                            </div>
                          ))}

                          {workspaceTasks.length === 0 && (
                            <p className="text-xs text-center opacity-40 py-6 uppercase font-bold tracking-wider">No checkpoint milestones initialized.</p>
                          )}
                        </div>
                      </div>

                      {/* Add Task panel */}
                      <form onSubmit={handleAddTask} className="pt-4 border-t dark:border-slate-800 space-y-3">
                        <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">Create Corporate Task Assignment</h4>
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            placeholder="Milestone description..."
                            className={`w-full text-xs p-2 border outline-hidden ${
                              isDark ? "bg-slate-950 border-slate-850 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 focus:border-indigo-400 text-slate-850"
                            }`}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <select
                                value={newTaskAssignee}
                                onChange={(e) => setNewTaskAssignee(e.target.value)}
                                className={`w-full p-1.5 border text-[10px] uppercase font-bold ${
                                  isDark ? "bg-slate-950 border-slate-850 text-indigo-300" : "bg-white border-slate-205 text-slate-705"
                                }`}
                              >
                                <option value="MBA Analyst">MBA Analyst</option>
                                <option value="Product Manager">Product Manager</option>
                                <option value="Marketing Manager">Marketing Manager</option>
                                <option value="Lead Strategist">Lead Strategist</option>
                              </select>
                            </div>
                            <button
                              type="submit"
                              className="py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase tracking-widest transition border border-indigo-500"
                            >
                              Assign Task
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className={`p-6 border ${
                    isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                  }`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b dark:border-slate-800 gap-6">
                      <div>
                        <h3 className="text-sm font-extrabold uppercase tracking-widest text-indigo-400 mb-1">Board of Directors Sign-off Certificate</h3>
                        <p className="text-xs opacity-60">Requires Executive or Admin approval overrides to release strategy drafts into production.</p>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        {selectedProject.approved ? (
                          <div className="px-4 py-2 border border-emerald-500 bg-emerald-500/10 text-emerald-500 text-xs font-bold uppercase tracking-widest flex items-center space-x-2">
                            <span>● STRATEGY SIGNED-OFF</span>
                          </div>
                        ) : (
                          <div className="px-4 py-2 border border-amber-500 bg-amber-500/10 text-amber-500 text-xs font-bold uppercase tracking-widest flex items-center space-x-3 animate-pulse">
                            <span>● PENDING BOARD AUDIT</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                      {/* Left half: Seal info */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-extrabold uppercase text-indigo-400">Strategic Seal / Executive Records</h4>
                        
                        <div className={`p-5 border border-dashed relative overflow-hidden ${
                          selectedProject.approved
                            ? "bg-emerald-500/5 border-emerald-500/45 text-emerald-900 dark:text-emerald-300"
                            : "bg-slate-950/20 border-slate-800 text-slate-400"
                        }`}>
                          {selectedProject.approved && (
                            <div className="absolute -right-3 -bottom-3 w-28 h-28 border-4 border-emerald-500/20 rounded-full flex items-center justify-center transform rotate-12">
                              <span className="text-[10px] font-black text-emerald-500/20 uppercase tracking-widest text-center">APPROVED</span>
                            </div>
                          )}

                          <div className="space-y-2 text-xs">
                            <p><strong>Approved Status:</strong> {selectedProject.approved ? "TRUE (Corporate Endorsement)" : "FALSE (Revision Required)"}</p>
                            <p><strong>Sign-off Date:</strong> {selectedProject.approvalDate ? new Date(selectedProject.approvalDate).toLocaleString() : "Undated"}</p>
                            <p><strong>Authorized Signatory:</strong> {selectedProject.approvedBy || "Unsigned"}</p>
                            <p className="border-t dark:border-slate-800/85 pt-3 italic text-[11px] opacity-80">
                              "{selectedProject.approvalComment || "No executive comments logged for this signature record."}"
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Right half: Form for signoff (Visible to Admin + Lead) */}
                      <div>
                        {currentUser.role === "Admin" || currentUser.role === "Lead Strategist" ? (
                          <form onSubmit={handleApproveProject} className="space-y-4">
                            <h4 className="text-xs font-extrabold uppercase text-indigo-400">Log Strategic Disposition</h4>
                            
                            <div className="space-y-2">
                              <label className="block text-[10px] font-extrabold uppercase text-slate-400">Sign-off Status Decision:</label>
                              <div className="flex gap-4">
                                <button
                                  type="button"
                                  onClick={() => setApprovalIsApproved(true)}
                                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border ${
                                    approvalIsApproved
                                      ? "bg-emerald-600 border-emerald-550 text-white"
                                      : "bg-slate-950 border-slate-800 text-slate-400"
                                  }`}
                                >
                                  Endorse & Approve Strategy
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setApprovalIsApproved(false)}
                                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border ${
                                    !approvalIsApproved
                                      ? "bg-amber-600 border-amber-550 text-white"
                                      : "bg-slate-950 border-slate-800 text-slate-400"
                                  }`}
                                >
                                  Reject / Revision Cycle
                                </button>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-extrabold uppercase text-slate-400">Executive Endorsement Comment:</label>
                              <textarea
                                value={approvalCommentText}
                                onChange={(e) => setApprovalCommentText(e.target.value)}
                                placeholder="State core rationale / directives for the launch team..."
                                rows={3}
                                className={`w-full text-xs p-2.5 border outline-hidden resize-none ${
                                  isDark ? "bg-slate-950 border-slate-850 text-white focus:border-indigo-505" : "bg-slate-50 border-slate-200 focus:border-indigo-405 text-slate-850"
                                }`}
                              />
                            </div>

                            <button
                              type="submit"
                              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 hover:cursor-pointer text-white text-xs font-bold uppercase tracking-widest transition border border-indigo-500"
                            >
                              Register Approved Seal & Authorize
                            </button>
                          </form>
                        ) : (
                          <div className="p-4 bg-sky-500/10 border border-sky-450/20 text-sky-400 text-xs rounded-xl">
                            <p className="font-semibold leading-relaxed">
                              🔒 Only members carrying Board Administrator (Admin) or Lead Strategist privileges may issue strategic endorsements or mandate revisions. Please use the seat swapper dropdown on the left side to switch seats if you wish to review.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : selectedProject.status === "failed" ? (
              <div className="p-8 rounded-3xl bg-red-100/10 border border-red-500/25 flex items-start space-x-4">
                <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-red-700 dark:text-red-400">Boardroom Analysis Terminated</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedProject.error || "An unexpected compile error intervened."}
                  </p>
                  <button
                    onClick={() => handleRunAgents(selectedProject.id)}
                    className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-650 transition"
                  >
                    Retry Agent Sequence
                  </button>
                </div>
              </div>
            ) : (
              /* DRAFT VIEW - OUTLINING WHAT WILL HAPPEN ON ACTIVE RUN */
              <div className={`p-8 rounded-3xl border ${
                isDark ? "bg-gray-950/40 border-gray-800" : "bg-white border-gray-150"
              }`}>
                <h3 className="text-base font-bold mb-3 flex items-center space-x-2">
                  <Plus className="w-5 h-5 text-indigo-500" />
                  <span>Draft Concept Parameters Enrolled</span>
                </h3>
                <p className="text-xs opacity-60 leading-relaxed mb-6">
                  You have enrolled the initial product criteria. To activate the collaborative Multi-Agent consultation team, click the **"Convene Board Meeting"** button. The agents will draft a complete business viability plan.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={`p-5 rounded-2xl border ${isDark ? "bg-gray-900 border-gray-850" : "bg-gray-50 border-gray-100"}`}>
                    <h4 className="text-xs font-bold uppercase text-indigo-500 mb-3">Specifications Entered</h4>
                    <ul className="space-y-2 text-xs">
                      {selectedProject.type === "new_product" ? (
                        <>
                          <li><strong>Category:</strong> {selectedProject.input1?.category}</li>
                          <li><strong>Target Demographics:</strong> {selectedProject.input1?.targetAudience}</li>
                          <li><strong>Initial Budget:</strong> {selectedProject.input1?.budget}</li>
                          <li><strong>Target Launch Region:</strong> {selectedProject.input1?.region}</li>
                          <li><strong>Core Business Goal:</strong> {selectedProject.input1?.businessGoal}</li>
                        </>
                      ) : (
                        <>
                          <li><strong>Category:</strong> {selectedProject.input2?.category}</li>
                          <li><strong>Current Parameters:</strong> {selectedProject.input2?.description}</li>
                          <li><strong>Sales Trends:</strong> {selectedProject.input2?.salesDataText}</li>
                          <li><strong>Customer Feedback:</strong> {selectedProject.input2?.reviewsText}</li>
                          <li><strong>Competitors:</strong> {selectedProject.input2?.competitorInfo}</li>
                          {selectedProject.input2?.uploadedFileName && (
                            <li className="text-indigo-500 font-semibold text-[10px]">
                              📁 Attached spreadsheets Audit: {selectedProject.input2?.uploadedFileName}
                            </li>
                          )}
                        </>
                      )}
                    </ul>
                  </div>

                  <div className={`p-5 rounded-2xl border flex flex-col justify-between ${isDark ? "bg-gray-900 border-gray-850" : "bg-gray-50 border-gray-100"}`}>
                    <div>
                      <h4 className="text-xs font-bold uppercase text-indigo-500 mb-3">Expected Deliverable Suite</h4>
                      <p className="text-xs leading-relaxed opacity-70">
                        Convening the boardroom activates three virtual roles that collaborate sequentially. The system will deliver:
                      </p>
                      <ul className="text-xs space-y-1.5 mt-3 list-disc pl-4 opacity-80">
                        <li>Comprehensive MBA Sizing, SWOTs & forecasts</li>
                        <li>Lead PM requirements PRD & checked milestones</li>
                        <li>Innovative Marketing rebrands, taglines & launch lists</li>
                        <li>Fully interactive Recharts Growth Trend Dashboard</li>
                      </ul>
                    </div>

                    <button
                      onClick={() => handleRunAgents(selectedProject.id)}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold mt-4"
                    >
                      Trigger Board Meeting
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* NO PROJECTS WELCOME ONBOARD STATE */
          <div className="grow flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 border border-indigo-200 shadow-xl flex items-center justify-center mb-6">
              <Compass className="w-10 h-10 animate-spin-slow" />
            </div>
            <h2 className="text-2xl font-black tracking-tight">Strategy Canvas Empty</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
              Activate your first virtual agent consultation by clicking **"New Strategy Canvas"** to layout new concepts or revitalize existing, underperforming products.
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20"
            >
              Spawn First Concept
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
