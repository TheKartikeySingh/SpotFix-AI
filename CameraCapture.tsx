import React from "react";
import { Camera, ClipboardList, CheckCircle, AlertTriangle, Clock, HelpCircle, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { Report, ViewType } from "../types";

interface HomeProps {
  reports: Report[];
  setView: (view: ViewType) => void;
}

export default function Home({ reports, setView }: HomeProps) {
  // Compute real statistics from localStorage reports state
  const totalReported = reports.length;
  const totalResolved = reports.filter((r) => r.status === "Resolved").length;
  const totalPending = reports.filter((r) => r.status === "Reported" || r.status === "Verified").length;
  const totalInProgress = reports.filter((r) => r.status === "In Progress").length;
  const totalCritical = reports.filter((r) => r.urgency === "Critical" && r.status !== "Resolved").length;

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium border border-blue-100"
        >
          <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
          Empowering Communities with Smart Civic AI
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-6xl font-black tracking-tight text-slate-900 leading-tight"
        >
          Spot. Report. <span className="text-blue-600">Fix.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed"
        >
          Improve your neighborhood in less than 30 seconds. Snap a photo of any civic issue (potholes, garbage, leakages) — our AI instantly classifies, details, and routes it to the correct government department.
        </motion.p>

        {/* Call to Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <button
            id="btn-report-issue-hero"
            onClick={() => setView("report")}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 active:scale-98 transition text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3 group cursor-pointer"
          >
            <Camera className="w-5 h-5 group-hover:rotate-6 transition-transform" />
            Report an Issue
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            id="btn-dashboard-hero"
            onClick={() => setView("dashboard")}
            className="w-full sm:w-auto bg-white hover:bg-slate-50 border-2 border-slate-200 active:scale-98 transition text-slate-800 px-8 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 cursor-pointer"
          >
            <ClipboardList className="w-5 h-5 text-slate-500" />
            Community Dashboard
          </button>
        </motion.div>
      </div>

      {/* Live Platform Stats */}
      <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 border-b border-slate-100 pb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Local Impact Statistics</h2>
            <p className="text-slate-500 text-sm">Real-time civic progress in your neighborhood</p>
          </div>
          <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            Live Updates
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Reports */}
          <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-500">Reported</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Camera className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900">{totalReported}</div>
              <p className="text-xs text-slate-500 mt-1">Total citizen claims</p>
            </div>
          </div>

          {/* Pending / Active */}
          <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-500">Pending</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900">{totalPending + totalInProgress}</div>
              <p className="text-xs text-slate-500 mt-1">{totalInProgress} currently in progress</p>
            </div>
          </div>

          {/* Resolved */}
          <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-500">Resolved</span>
              <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 text-green-600">{totalResolved}</div>
              <p className="text-xs text-slate-500 mt-1">Success rate: {totalReported ? Math.round((totalResolved / totalReported) * 100) : 0}%</p>
            </div>
          </div>

          {/* Critical Warnings */}
          <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-500">Critical Issues</span>
              <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 text-red-600">{totalCritical}</div>
              <p className="text-xs text-slate-500 mt-1">Active urgent risk alerts</p>
            </div>
          </div>
        </div>
      </div>

      {/* How it works section - Easy UI for elderly and non-technical */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-slate-900 text-center">Get It Fixed In 3 Easy Steps</h3>
        <p className="text-center text-slate-500 -mt-3 text-sm">Designed for everyone, with large text and straightforward guidance</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs text-center space-y-3 relative overflow-hidden">
            <div className="absolute top-3 right-3 text-7xl font-black text-slate-50 select-none">1</div>
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg mx-auto relative z-10">
              📸
            </div>
            <h4 className="text-lg font-bold text-slate-800 relative z-10">Snap or Upload</h4>
            <p className="text-sm text-slate-600 relative z-10">
              Take a photo of the pothole, garbage, or leakage. No typing required to start!
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs text-center space-y-3 relative overflow-hidden">
            <div className="absolute top-3 right-3 text-7xl font-black text-slate-50 select-none">2</div>
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg mx-auto relative z-10">
              📍
            </div>
            <h4 className="text-lg font-bold text-slate-800 relative z-10">Auto Location</h4>
            <p className="text-sm text-slate-600 relative z-10">
              Your phone's GPS automatically marks where the problem is. Correct it manually if needed.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs text-center space-y-3 relative overflow-hidden">
            <div className="absolute top-3 right-3 text-7xl font-black text-slate-50 select-none">3</div>
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg mx-auto relative z-10">
              ⚡
            </div>
            <h4 className="text-lg font-bold text-slate-800 relative z-10">Instant AI Report</h4>
            <p className="text-sm text-slate-600 relative z-10">
              Our AI instantly analyzes the issue, warns about duplicates, and schedules the fix.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
