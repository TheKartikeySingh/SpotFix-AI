export interface Report {
  id: string;
  image: string | null; // Base64 data URL
  description: string;
  category: string; // Pothole, Garbage, Water Leakage, Broken Streetlight, Road Damage, Drainage, Fallen Tree, Other
  severity: "Low" | "Medium" | "High";
  urgency: "Normal" | "Urgent" | "Critical";
  department: string;
  risk: string;
  summary: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  status: "Reported" | "Verified" | "In Progress" | "Resolved";
  supportCount: number;
  date: string; // ISO string
}

export type ViewType = "home" | "report" | "dashboard";

export interface AIAnalysisResult {
  category: string;
  severity: "Low" | "Medium" | "High";
  urgency: "Normal" | "Urgent" | "Critical";
  department: string;
  risk: string;
  summary: string;
}
