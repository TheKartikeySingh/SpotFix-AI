import React, { useState } from "react";
import { Search, MapPin, Calendar, Heart, ShieldAlert, CheckCircle2, ChevronRight, MessageSquare, AlertTriangle, ExternalLink } from "lucide-react";
import { Report, ViewType } from "../types";

interface DashboardProps {
  reports: Report[];
  onSupportIssue: (reportId: string) => void;
  setView: (view: ViewType) => void;
}

export default function Dashboard({ reports, onSupportIssue, setView }: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

  // Unique categories list for filtering dropdown/tab pills
  const categories = ["All", ...Array.from(new Set(reports.map((r) => r.category)))];
  const statuses = ["All", "Reported", "Verified", "In Progress", "Resolved"];

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.location.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.summary.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "All" || r.category === selectedCategory;
    const matchesStatus = selectedStatus === "All" || r.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Count active stats
  const countReported = reports.filter((r) => r.status === "Reported").length;
  const countVerified = reports.filter((r) => r.status === "Verified").length;
  const countInProgress = reports.filter((r) => r.status === "In Progress").length;
  const countResolved = reports.filter((r) => r.status === "Resolved").length;

  const getStatusBadgeStyles = (status: Report["status"]) => {
    switch (status) {
      case "Reported":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "Verified":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "In Progress":
        return "bg-purple-50 text-purple-700 border-purple-100";
      case "Resolved":
        return "bg-green-50 text-green-700 border-green-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  const getSeverityBadgeStyles = (severity: Report["severity"]) => {
    switch (severity) {
      case "High":
        return "bg-red-50 text-red-700 border-red-100";
      case "Medium":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "Low":
        return "bg-slate-100 text-slate-600 border-slate-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  // Safe helper to format dates beautifully
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8">
      {/* Platform Summary Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Community Dashboard</h2>
          <p className="text-slate-500 text-sm">Transparency in local infrastructure audits</p>
        </div>
        <button
          onClick={() => setView("report")}
          className="bg-blue-600 hover:bg-blue-700 active:scale-98 transition text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-md cursor-pointer"
        >
          + File a New Report
        </button>
      </div>

      {/* Grid count pills of current counts in the community dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => setSelectedStatus("Reported")}
          className={`p-4 bg-white rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer ${
            selectedStatus === "Reported" ? "border-blue-600 ring-2 ring-blue-50 shadow-sm" : "border-slate-100 hover:border-slate-200"
          }`}
        >
          <div>
            <div className="text-2xl font-black text-slate-900">{countReported}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Reported</div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
        </button>

        <button
          onClick={() => setSelectedStatus("Verified")}
          className={`p-4 bg-white rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer ${
            selectedStatus === "Verified" ? "border-amber-600 ring-2 ring-amber-50 shadow-sm" : "border-slate-100 hover:border-slate-200"
          }`}
        >
          <div>
            <div className="text-2xl font-black text-slate-900">{countVerified}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Verified</div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
        </button>

        <button
          onClick={() => setSelectedStatus("In Progress")}
          className={`p-4 bg-white rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer ${
            selectedStatus === "In Progress" ? "border-purple-600 ring-2 ring-purple-50 shadow-sm" : "border-slate-100 hover:border-slate-200"
          }`}
        >
          <div>
            <div className="text-2xl font-black text-slate-900">{countInProgress}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">In Progress</div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
        </button>

        <button
          onClick={() => setSelectedStatus("Resolved")}
          className={`p-4 bg-white rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer ${
            selectedStatus === "Resolved" ? "border-green-600 ring-2 ring-green-50 shadow-sm" : "border-slate-100 hover:border-slate-200"
          }`}
        >
          <div>
            <div className="text-2xl font-black text-green-600">{countResolved}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Resolved</div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
        </button>
      </div>

      {/* Interactive Filters and Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          
          {/* Search Box */}
          <div className="relative w-full md:flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search issues by keyword, street, landmark, or category..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>

          {/* Category Dropdown */}
          <div className="w-full md:w-56 flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:border-blue-500 transition font-medium"
            >
              <option disabled>Filter Category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "All" ? "All Categories" : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters Option */}
          {(searchTerm || selectedCategory !== "All" || selectedStatus !== "All") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("All");
                setSelectedStatus("All");
              }}
              className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-2.5 rounded-xl hover:bg-blue-100 transition cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Status quick tabs pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Filter Status:</span>
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`text-xs font-semibold px-4 py-1.5 rounded-full border shrink-0 cursor-pointer transition ${
                selectedStatus === status
                  ? "bg-slate-900 border-slate-900 text-white"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Main Issues Listing Grid */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <div className="w-16 h-16 bg-slate-50 border border-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <Search className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-slate-800">No civic issues found</h4>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              We couldn't find any issues matching your active search filters. Try adjusting your query or report a new local issue.
            </p>
          </div>
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory("All");
              setSelectedStatus("All");
            }}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow group duration-300"
            >
              {/* Card Main Area */}
              <div>
                
                {/* Image or Category placeholder gradient */}
                <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden">
                  {report.image ? (
                    <img
                      src={report.image}
                      alt={report.category}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                    />
                  ) : (
                    // Creative abstract SVG/CSS visual placeholder based on category
                    <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex flex-col items-center justify-center text-slate-500 relative">
                      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>
                      <div className="text-4xl mb-2 filter drop-shadow">
                        {report.category === "Pothole" && "🕳️"}
                        {report.category === "Garbage" && "🗑️"}
                        {report.category === "Water Leakage" && "💧"}
                        {report.category === "Broken Streetlight" && "💡"}
                        {report.category === "Road Damage" && "🛣️"}
                        {report.category === "Drainage" && "🌊"}
                        {report.category === "Fallen Tree" && "🌳"}
                        {report.category === "Other" && "⚠️"}
                      </div>
                      <span className="font-extrabold text-xs tracking-widest text-slate-600 uppercase">
                        {report.category} Image Missing
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1">Submitted as text-only report</span>
                    </div>
                  )}

                  {/* Badges Overlaid on Image */}
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                    <span className={`px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider rounded-lg border shadow-sm ${getStatusBadgeStyles(report.status)}`}>
                      ● {report.status}
                    </span>
                    <span className={`px-2.5 py-1 text-xs font-black uppercase tracking-wider rounded-lg border shadow-sm ${getSeverityBadgeStyles(report.severity)}`}>
                      {report.severity} Severity
                    </span>
                  </div>
                </div>

                {/* Content Padding */}
                <div className="p-6 space-y-4">
                  
                  {/* Category and Title */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-blue-600 uppercase tracking-widest">
                      <span>{report.category}</span>
                      <span>•</span>
                      <span>{report.department}</span>
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 leading-snug">
                      {report.summary || "Civic Incident Claim"}
                    </h4>
                  </div>

                  {/* Risk estimate warning section */}
                  {report.risk && (
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed text-slate-600">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-800 block">AI Public Risk Assessment</span>
                        {report.risk}
                      </div>
                    </div>
                  )}

                  {/* Description if any */}
                  {report.description && (
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                      {report.description}
                    </p>
                  )}

                  {/* Metadata and location badges */}
                  <div className="pt-2 space-y-2 border-t border-slate-50 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-700 truncate" title={report.location.address}>
                        {report.location.address}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-500">
                        Reported on {formatDate(report.date)}
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Action Buttons & Interactions Row */}
              <div className="bg-slate-50/50 border-t border-slate-100 p-4 flex items-center justify-between">
                
                {/* Incremental Vote signature button to resolve issues quickly */}
                <button
                  onClick={() => onSupportIssue(report.id)}
                  className="bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-700 hover:text-red-600 active:scale-95 px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Heart className="w-4 h-4 fill-red-500 text-red-500 animate-pulse" />
                  Support This Issue
                </button>

                <div className="text-right">
                  <span className="block text-sm font-black text-slate-800">
                    {report.supportCount}
                  </span>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Citizens Supporting
                  </span>
                </div>

              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
