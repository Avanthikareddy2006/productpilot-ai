import React, { useState } from "react";
import { Lock, Mail, UserPlus, Briefcase, ChevronRight, Compass } from "lucide-react";

interface LoginProps {
  onLoginSuccess: (token: string, user: { id: string; email: string; name: string; role: string }) => void;
  isDark: boolean;
}

export const LoginView: React.FC<LoginProps> = ({ onLoginSuccess, isDark }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("Lead Strategist");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const url = isRegister ? "/api/auth/register" : "/api/auth/login";
    const payload = isRegister
      ? { email, password, name, role }
      : { email, password };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "An error occurred during authentication.");
      }

      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || "Failed to connect to full-stack server.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "guest@productpilot.ai", password: "guest" }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to spin up guest session.");
      }

      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || "Failed to spin up guest workspace.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 transition-all ${
      isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
    }`}>
      <div className={`w-full max-w-md p-8 border-t-8 border-t-indigo-600 border transition-all ${
        isDark ? "bg-slate-900 border-slate-800 shadow-2xl" : "bg-white border-slate-200"
      }`}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 text-white mb-4 border-2 border-indigo-400">
            <Compass className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-wider">ProductPilot AI</h1>
          <p className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400 dark:text-slate-500 mt-2">
            Multi-Agent Strategy Boardroom
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 text-xs font-mono bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest mb-1 opacity-70">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 opacity-50">
                  <UserPlus className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Connor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full text-xs pl-10 pr-4 py-2.5 outline-hidden border focus:ring-2 focus:ring-indigo-500 font-mono ${
                    isDark ? "bg-slate-850 border-slate-800 focus:bg-slate-800 text-white" : "bg-slate-50 border-slate-200 focus:bg-white text-slate-900"
                  }`}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-widest mb-1 opacity-70">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 opacity-50">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                placeholder="e.g. sarah@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full text-xs pl-10 pr-4 py-2.5 outline-hidden border focus:ring-2 focus:ring-indigo-500 font-mono ${
                  isDark ? "bg-slate-850 border-slate-800 focus:bg-slate-800 text-white" : "bg-slate-50 border-slate-200 focus:bg-white text-slate-900"
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-widest mb-1 opacity-70">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 opacity-50">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full text-xs pl-10 pr-4 py-2.5 outline-hidden border focus:ring-2 focus:ring-indigo-500 font-mono ${
                  isDark ? "bg-slate-850 border-slate-800 focus:bg-slate-800 text-white" : "bg-slate-50 border-slate-200 focus:bg-white text-slate-900"
                }`}
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest mb-1 opacity-70">
                Operational Role
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 opacity-50">
                  <Briefcase className="w-4 h-4" />
                </span>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={`w-full text-xs pl-10 pr-4 py-2.5 outline-hidden border focus:ring-2 focus:ring-indigo-500 appearance-none font-mono ${
                    isDark ? "bg-slate-850 border-slate-800 focus:bg-slate-800 text-white" : "bg-slate-50 border-slate-200 focus:bg-white text-slate-900"
                  }`}
                >
                  <option value="MBA Analyst">MBA Analyst (Viability & SWOTs)</option>
                  <option value="Product Manager">Product Manager (PRD & Specifications)</option>
                  <option value="Marketing Manager">Marketing Manager (Rebranding & Campaigns)</option>
                  <option value="Lead Strategist">Lead Strategist (Synthesizer Overseer)</option>
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest transition-all focus:ring-2 focus:ring-indigo-400 flex items-center justify-center space-x-1.5"
          >
            <span>{loading ? "Establishing session..." : isRegister ? "Create Enterprise Account" : "Access Boardroom"}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center space-y-4">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-[10px] uppercase font-black text-indigo-600 dark:text-indigo-400 hover:underline tracking-wider"
          >
            {isRegister ? "Already hold an account? Sign in" : "New member? Register Credentials"}
          </button>

          <div className="w-full flex items-center justify-between text-slate-400 dark:text-slate-550 text-[9px] font-bold tracking-widest">
            <span className="w-1/4 h-px bg-slate-200 dark:bg-slate-800" />
            <span>OR FASTPASS ACCESS</span>
            <span className="w-1/4 h-px bg-slate-200 dark:bg-slate-800" />
          </div>

          <button
            onClick={handleGuestLogin}
            disabled={loading}
            className={`w-full py-3 text-xs font-bold uppercase tracking-widest transition-all border ${
              isDark
                ? "bg-slate-800 hover:bg-slate-750 border-slate-700 text-indigo-400"
                : "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800"
            }`}
          >
            Launch Instant Demo Session
          </button>
        </div>
      </div>
    </div>
  );
};
