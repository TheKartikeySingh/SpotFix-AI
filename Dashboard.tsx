import React, { useState, useEffect } from "react";
import { Camera, MapPin, Loader2, Upload, AlertTriangle, ArrowRight, ArrowLeft, CheckCircle2, Navigation, Trash2, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Report, AIAnalysisResult, ViewType } from "../types";
import CameraCapture from "./CameraCapture";

interface ReportIssueProps {
  reports: Report[];
  onAddReport: (report: Report) => void;
  onSupportExisting: (reportId: string) => void;
  setView: (view: ViewType) => void;
}

// Function to calculate distance between two coordinates in meters (Haversine formula)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}

export default function ReportIssue({ reports, onAddReport, onSupportExisting, setView }: ReportIssueProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  
  // Location state
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string }>({
    lat: 37.7749, // Default to SF San Francisco center
    lng: -122.4194,
    address: "",
  });
  const [locationStatus, setLocationStatus] = useState<"idle" | "fetching" | "success" | "error">("idle");
  const [manualAddress, setManualAddress] = useState("");

  // Camera Overlay state
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Submission/Analysis States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);

  // Duplicate Check States
  const [duplicateMatch, setDuplicateMatch] = useState<Report | null>(null);
  const [duplicateDistance, setDuplicateDistance] = useState<number | null>(null);

  // Use browser geolocation on load/step 2 trigger
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      return;
    }

    setLocationStatus("fetching");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let address = `Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        
        // Reverse Geocode (simple mock fallback based on coordinates to look beautiful)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          if (res.ok) {
            const data = await res.json();
            address = data.display_name || address;
          }
        } catch (e) {
          console.warn("Reverse geocoding failed, using coordinates as address label.", e);
        }

        setLocation({
          lat: latitude,
          lng: longitude,
          address: address,
        });
        setManualAddress(address);
        setLocationStatus("success");
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocationStatus("error");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // Run automatically when user lands on Step 2
  useEffect(() => {
    if (step === 2 && locationStatus === "idle") {
      requestLocation();
    }
  }, [step]);

  // Handle standard image uploads via file selector
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setStep(2); // Auto advance to location step for ultra fast user experience!
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerManualAddressSubmit = () => {
    if (manualAddress.trim()) {
      // Offset slightly from SF center for realistic positioning if they type custom text
      setLocation((prev) => ({
        ...prev,
        address: manualAddress,
      }));
    }
  };

  // Step 4: Submission + Gemini Analysis Route
  const handleSubmitReport = async () => {
    setIsAnalyzing(true);
    setErrorMsg(null);
    setAnalysisResult(null);
    setDuplicateMatch(null);

    try {
      const response = await fetch("/api/analyze-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: image, // Base64 data URL
          description: description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze your civic issue. Check network.");
      }

      const result: AIAnalysisResult = await response.json();
      setAnalysisResult(result);

      // --- Smart Duplicate Detection Logic (Killer Feature) ---
      // We look for any existing report within 300 meters that shares the same category
      let foundDuplicate: Report | null = null;
      let minDistance = Infinity;

      for (const rep of reports) {
        if (rep.status === "Resolved") continue; // Ignore resolved issues

        // Case insensitive match or category similarity
        const isSameCategory = rep.category.toLowerCase().trim() === result.category.toLowerCase().trim();
        if (isSameCategory) {
          const distance = getDistance(location.lat, location.lng, rep.location.lat, rep.location.lng);
          // If within 300 meters, flag as potential duplicate
          if (distance <= 300 && distance < minDistance) {
            minDistance = distance;
            foundDuplicate = rep;
          }
        }
      }

      if (foundDuplicate) {
        // We found an issue in the same neighborhood! Prompt the user
        setDuplicateMatch(foundDuplicate);
        setDuplicateDistance(Math.round(minDistance));
      } else {
        // No duplicate found! Proceed to instantly save report
        saveReport(result);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred during AI analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Save report into localStorage system
  const saveReport = (aiData: AIAnalysisResult) => {
    const finalAddress = manualAddress.trim() || location.address || "Unknown Location";
    const newReport: Report = {
      id: `rep-${Date.now()}`,
      image: image,
      description: description,
      category: aiData.category,
      severity: aiData.severity,
      urgency: aiData.urgency,
      department: aiData.department,
      risk: aiData.risk,
      summary: aiData.summary,
      location: {
        lat: location.lat,
        lng: location.lng,
        address: finalAddress,
      },
      status: "Reported",
      supportCount: 1, // Self support initially
      date: new Date().toISOString(),
    };

    onAddReport(newReport);
    setView("dashboard"); // Go directly to community dashboard to see the new report!
  };

  const handleSupportDuplicate = () => {
    if (duplicateMatch) {
      onSupportExisting(duplicateMatch.id);
      setView("dashboard");
    }
  };

  const handleForceCreate = () => {
    if (analysisResult) {
      saveReport(analysisResult);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 md:p-8 space-y-8 relative">
      
      {/* Header with Step indicator */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Report Civic Issue</h2>
          <p className="text-slate-500 text-sm">Submit community issues in less than 30 seconds</p>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full text-xs font-bold text-slate-600">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
          Step {step} of 3
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
        <div 
          className="bg-blue-600 h-full transition-all duration-300 rounded-full"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      {/* Steps Container */}
      <div>
        <AnimatePresence mode="wait">
          
          {/* STEP 1: Upload or Snap Image */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-800">Step 1: Upload or Take a Photo</h3>
                <p className="text-sm text-slate-500">Provide an image of the pothole, trash pile, or damaged street element for the AI to instantly analyze.</p>
              </div>

              {image ? (
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-[4/3] bg-slate-50">
                    <img src={image} alt="Report Preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setImage(null)}
                      className="absolute top-4 right-4 bg-slate-900/80 hover:bg-slate-950 text-white p-2.5 rounded-full transition shadow-lg flex items-center justify-center cursor-pointer"
                      title="Remove Image"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <button
                    onClick={() => setStep(2)}
                    className="w-full bg-blue-600 hover:bg-blue-700 active:scale-98 text-white py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    Confirm Image & Continue
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Camera Launcher */}
                  <button
                    id="btn-use-camera"
                    onClick={() => setIsCameraOpen(true)}
                    className="flex flex-col items-center justify-center p-8 bg-blue-50/50 hover:bg-blue-50 border-2 border-dashed border-blue-200 hover:border-blue-300 rounded-2xl transition group cursor-pointer text-center space-y-4"
                  >
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Camera className="w-8 h-8" />
                    </div>
                    <div>
                      <span className="block font-bold text-slate-800 text-lg">Take Photo</span>
                      <span className="text-xs text-slate-500 block mt-1">Use your device's built-in camera</span>
                    </div>
                  </button>

                  {/* Local File Uploader */}
                  <label className="flex flex-col items-center justify-center p-8 bg-slate-50 hover:bg-slate-100/70 border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-2xl transition group cursor-pointer text-center space-y-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <div className="w-16 h-16 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Upload className="w-8 h-8" />
                    </div>
                    <div>
                      <span className="block font-bold text-slate-800 text-lg">Upload Image</span>
                      <span className="text-xs text-slate-500 block mt-1">Select PNG, JPG, or JPEG from files</span>
                    </div>
                  </label>
                </div>
              )}

              {/* Skip option for quick text-only entry */}
              <div className="pt-4 text-center">
                <button
                  onClick={() => setStep(2)}
                  className="text-sm font-semibold text-slate-500 hover:text-blue-600 transition underline decoration-dashed underline-offset-4"
                >
                  Skip image upload (Report with text description only)
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Address and GPS Auto-Location */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-800">Step 2: Tag Incident Location</h3>
                <p className="text-sm text-slate-500">We automatically attempt to fetch your device's exact GPS location for municipal routing precision.</p>
              </div>

              {/* GPS Status and Coordinates Container */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <span className="font-bold text-slate-800 text-sm">GPS Geolocation System</span>
                  </div>
                  {locationStatus === "fetching" && (
                    <span className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Locating...
                    </span>
                  )}
                  {locationStatus === "success" && (
                    <span className="text-xs text-green-600 font-bold bg-green-50 px-2.5 py-1 rounded-md flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                      GPS Active
                    </span>
                  )}
                  {locationStatus === "error" && (
                    <span className="text-xs text-amber-600 font-bold bg-amber-50 px-2.5 py-1 rounded-md">
                      GPS Offline
                    </span>
                  )}
                </div>

                {/* Display Address or Coordinates */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Neighborhood Address</p>
                  <p className="text-slate-700 text-sm font-semibold bg-white border border-slate-100 px-4 py-3 rounded-xl leading-relaxed">
                    {location.address || "Requesting device coordinates..."}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={requestLocation}
                    disabled={locationStatus === "fetching"}
                    className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Navigation className="w-3.5 h-3.5 text-blue-600" />
                    Refresh GPS Coordinate
                  </button>
                </div>
              </div>

              {/* Manual Override Form */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-800">
                  Manual Location Override <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    placeholder="E.g., 240 Valencia St, next to central bus stop"
                    className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition"
                  />
                  <button
                    onClick={triggerManualAddressSubmit}
                    className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-3 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Apply Override
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  If GPS coordinates are off, type a nearby street name or landmark to help civic workers locate the issue easily.
                </p>
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-5 py-3 rounded-xl text-sm font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  Next Step
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Description and Submission */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-800">Step 3: Description & Submit</h3>
                <p className="text-sm text-slate-500">Add any additional details about the problem to assist the municipal AI analysis engine.</p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-800">
                  Describe what is wrong <span className="text-slate-400 font-normal">(Highly Recommended)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe details: Is the water flowing rapidly? How deep is the pothole? Is the garbage causing bad odor? Our AI uses these details for priority routing..."
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition"
                />
              </div>

              {/* Report Summary Checklist */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3 text-xs">
                <p className="font-bold text-slate-500 uppercase tracking-wider">Report Metadata Recap</p>
                <div className="space-y-2 text-slate-700 font-medium">
                  <div className="flex justify-between">
                    <span>Uploaded Image:</span>
                    <span className={image ? "text-green-600 font-bold" : "text-amber-600 font-bold"}>
                      {image ? "✓ Attached" : "None (Text Only)"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>GPS Coordinates:</span>
                    <span className="text-slate-900 font-bold">
                      {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Incident Location:</span>
                    <span className="text-slate-900 font-bold text-right truncate max-w-xs">
                      {manualAddress || location.address || "Unknown"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={() => setStep(2)}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-5 py-3 rounded-xl text-sm font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  id="btn-submit-report"
                  onClick={handleSubmitReport}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-black text-base transition flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-500/15"
                >
                  Submit & Analyze with Gemini
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Loading Overlay with intelligent step breakdown during Gemini Analysis */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/95 z-40 flex flex-col items-center justify-center p-6 space-y-6 text-center rounded-3xl"
          >
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="absolute inset-0 flex items-center justify-center font-bold text-sm text-blue-600">AI</span>
            </div>
            
            <div className="space-y-2 max-w-sm">
              <h4 className="text-lg font-black text-slate-900">SpotFix AI is Inspecting...</h4>
              <p className="text-sm text-slate-500">
                Gemini 3.5 Flash is inspecting your photo, analyzing safety risks, categorizing severity, and formulating an official complaint.
              </p>
            </div>

            <div className="w-48 bg-slate-100 h-1 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full w-2/3 rounded-full animate-pulse"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Modal */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-4">
          <div className="flex gap-3">
            <div className="p-2 bg-red-100 text-red-700 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-red-900 text-base">Gemini API Connection Issue</h4>
              <p className="text-sm text-red-700 mt-1 leading-relaxed">{errorMsg}</p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setErrorMsg(null)}
              className="bg-white border border-red-200 hover:border-red-300 text-red-800 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleSubmitReport}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Retry AI Submission
            </button>
          </div>
        </div>
      )}

      {/* SMART DUPLICATE DETECTION POPUP (Killer Feature) */}
      <AnimatePresence>
        {duplicateMatch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/98 z-40 flex flex-col justify-center p-6 md:p-8 space-y-6 overflow-y-auto rounded-3xl"
          >
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-200 animate-bounce">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-extrabold text-slate-900">Issue Already Reported nearby!</h4>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                SpotFix AI found a highly similar <span className="font-bold text-slate-900">{duplicateMatch.category}</span> issue reported within <span className="font-extrabold text-blue-600">{duplicateDistance} meters</span> of your location.
              </p>
            </div>

            {/* Display the duplicate issue card in mini layout */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4 max-w-md mx-auto w-full">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className="px-2.5 py-1 bg-amber-50 border border-amber-100 text-amber-700 text-xs font-bold rounded-lg uppercase tracking-wide">
                    {duplicateMatch.category}
                  </span>
                  <h5 className="font-extrabold text-slate-800 text-base mt-2">Near: {duplicateMatch.location.address}</h5>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{duplicateMatch.description || "No manual description provided."}</p>
                </div>
                {duplicateMatch.image && (
                  <img src={duplicateMatch.image} alt="Existing reported file" className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0" />
                )}
              </div>

              <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-3">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Current Status</span>
                <span className="font-bold text-blue-600">{duplicateMatch.status}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Community Supports</span>
                <span className="font-bold text-slate-800">{duplicateMatch.supportCount} citizen signatures</span>
              </div>
            </div>

            {/* Action buttons to encourage community collaboration */}
            <div className="flex flex-col gap-3 max-w-sm mx-auto w-full pt-4">
              <button
                id="btn-support-duplicate"
                onClick={handleSupportDuplicate}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-4 rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/10 active:scale-98 transition"
              >
                <CheckCircle2 className="w-5 h-5" />
                Support Existing Report (+1 Vote)
              </button>

              <button
                id="btn-force-create-duplicate"
                onClick={handleForceCreate}
                className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 font-bold py-3.5 rounded-2xl text-sm transition cursor-pointer text-center"
              >
                No, this is a different issue (Submit New Report)
              </button>
            </div>

            <p className="text-center text-slate-400 text-xs">
              Supporting an existing issue merges your report to avoid duplication, making the complaint more impactful to city councilors.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera Capture Modal Overlay */}
      {isCameraOpen && (
        <CameraCapture
          onCapture={(base64) => {
            setImage(base64);
            setIsCameraOpen(false);
            setStep(2); // Auto advance to location step for swift flows!
          }}
          onClose={() => setIsCameraOpen(false)}
        />
      )}

    </div>
  );
}
