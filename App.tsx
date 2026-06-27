import React, { useState, useEffect } from "react";
import { AlertCircle, Camera, CheckSquare, Compass, Shield, HelpCircle, Laptop, Menu, X, Landmark, FileText, CheckCircle2 } from "lucide-react";
import { Report, ViewType } from "./types";
import { mockReports } from "./data/mockReports";
import Home from "./components/Home";
import ReportIssue from "./components/ReportIssue";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [view, setView] = useState<ViewType>("home");
  const [reports, setReports] = useState<Report[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize reports from local storage, or fall back to beautiful mock records
  useEffect(() => {
    const stored = localStorage.getItem("spotfix_reports");
    if (stored) {
      try {
        setReports(JSON.parse(stored));
      } catch (e) {
        console.error("Error parsing stored reports, resetting to defaults", e);
        setReports(mockReports);
        localStorage.setItem("spotfix_reports", JSON.stringify(mockReports));
      }
    } else {
      setReports(mockReports);
      localStorage.setItem("spotfix_reports", JSON.stringify(mockReports));
    }
  }, []);

  // Sync state back to localStorage
  const saveToLocalStorage = (updatedReports: Report[]) => {
    setReports(updatedReports);
    localStorage.setItem("spotfix_reports", JSON.stringify(updatedReports));
  };

  const handleAddReport = (newReport: Report) => {
    const updated = [newReport, ...reports];
    saveToLocalStorage(updated);
    showToast(`Successfully reported issue! AI categorized it as ${newReport.category}.`);
  };

  const handleSupportIssue = (reportId: string) => {
    const updated = reports.map((r) => {
      if (r.id === reportId) {
        return {
          ...r,
          supportCount: r.supportCount + 1,
        };
      }
      return r;
    });
    saveToLocalStorage(updated);
    showToast("Thank you! Your signature support has been registered locally.");
  };

  const handleSupportExistingDuplicate = (reportId: string) => {
    const updated = reports.map((r) => {
      if (r.id === reportId) {
        return {
          ...r,
          supportCount: r.supportCount + 1,
          status: r.status === "Reported" ? "Verified" as const : r.status, // Escalate to Verified on duplicate signature
        };
      }
      return r;
    });
    saveToLocalStorage(updated);
    showToast("Duplicate matched! Your signature has been added to the existing local report.");
  };

  // Toast notifier helper
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Reset demo back to clean defaults
  const handleResetDemoData = () => {
    if (window.confirm("Are you sure you want to reset the local store to seed records? Any newly submitted claims will be removed.")) {
      saveToLocalStorage(mockReports);
      showToast("Storage has been restored to default seed values successfully.");
      setView("home");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col text-slate-950 antialiased selection:bg-blue-100 selection:text-blue-900">
      
      {/* Navigation Header bar matching Sleek theme */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs shrink-0 px-4 md:px-8">
        <div className="max-w-7xl mx-auto h-16 flex items-center justify-between">
          
          {/* Logo Branding */}
          <button
            onClick={() => {
              setView("home");
              setIsMobileMenuOpen(false);
            }}
            className="flex items-center gap-2.5 hover:opacity-90 transition cursor-pointer text-left"
          >
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/10">
              <svg className="w-5.5 h-5.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">
              SpotFix<span className="text-blue-600 italic font-extrabold">AI</span>
            </span>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 font-bold text-sm text-slate-500">
            <button
              onClick={() => setView("home")}
              className={`py-1.5 transition-colors cursor-pointer ${
                view === "home" ? "text-blue-600 border-b-2 border-blue-600" : "hover:text-blue-600"
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setView("report")}
              className={`py-1.5 transition-colors cursor-pointer ${
                view === "report" ? "text-blue-600 border-b-2 border-blue-600" : "hover:text-blue-600"
              }`}
            >
              Report Issue
            </button>
            <button
              onClick={() => setView("dashboard")}
              className={`py-1.5 transition-colors cursor-pointer ${
                view === "dashboard" ? "text-blue-600 border-b-2 border-blue-600" : "hover:text-blue-600"
              }`}
            >
              Community Dashboard
            </button>
            
            <span className="h-4 w-[1px] bg-slate-200"></span>

            <button
              onClick={handleResetDemoData}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3.5 py-2 rounded-full font-bold transition cursor-pointer"
              title="Reset data back to seed state"
            >
              Reset Seed Data
            </button>
          </nav>

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 focus:outline-none cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown Menu */}
        {isMobileMenuOpen && (
          <nav className="md:hidden border-t border-slate-100 py-4 px-2 flex flex-col gap-3 font-bold text-slate-600 text-sm">
            <button
              onClick={() => {
                setView("home");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left py-2.5 px-4 rounded-xl cursor-pointer ${
                view === "home" ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50"
              }`}
            >
              Home
            </button>
            <button
              onClick={() => {
                setView("report");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left py-2.5 px-4 rounded-xl cursor-pointer ${
                view === "report" ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50"
              }`}
            >
              Report Issue
            </button>
            <button
              onClick={() => {
                setView("dashboard");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left py-2.5 px-4 rounded-xl cursor-pointer ${
                view === "dashboard" ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50"
              }`}
            >
              Community Dashboard
            </button>
            <button
              onClick={() => {
                handleResetDemoData();
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left py-2.5 px-4 rounded-xl text-amber-700 hover:bg-slate-50 font-bold"
            >
              Reset Seed Data
            </button>
          </nav>
        )}
      </header>

      {/* Main Container Wrapper */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-10">
        
        {/* Dynamic Interactive Render Views */}
        {view === "home" && <Home reports={reports} setView={setView} />}
        {view === "report" && (
          <ReportIssue
            reports={reports}
            onAddReport={handleAddReport}
            onSupportExisting={handleSupportExistingDuplicate}
            setView={setView}
          />
        )}
        {view === "dashboard" && (
          <Dashboard
            reports={reports}
            onSupportIssue={handleSupportIssue}
            setView={setView}
          />
        )}

      </main>

      {/* Persistent platform systems footer banner */}
      <footer className="mt-16 bg-white border-t border-slate-200/80 py-8 shrink-0">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
          <div>© 2026 SpotFix AI Technology</div>
          <div className="flex flex-wrap gap-6 items-center justify-center">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Gemini 3.5 Active
            </span>
            <span>Civic Engagement Platform</span>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => alert("SpotFix AI utilizes state-of-the-art computer vision to detect municipal claims locally in real-time. Created for Hackathons.")}
              className="hover:text-blue-600 transition cursor-pointer"
            >
              Guidelines
            </button>
          </div>
        </div>
      </footer>

      {/* Floating System Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className="bg-slate-900 border border-slate-800 text-white px-5 py-4 rounded-2xl flex items-center gap-3 shadow-2xl max-w-md">
            <div className="p-1.5 bg-blue-600 text-white rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold leading-normal">{toastMessage}</p>
          </div>
        </div>
      )}

    </div>
  );
}
