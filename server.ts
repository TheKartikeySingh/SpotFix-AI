import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set up middleware to parse JSON and large requests (for base64 images)
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ limit: "25mb", extended: true }));

  // Initialize Gemini AI client server-side
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Gemini AI client successfully initialized server-side.");
  } else {
    console.warn("Warning: GEMINI_API_KEY environment variable is not set. AI features will fail.");
  }

  // API endpoint: Analyzes the image and user description of a reported issue
  app.post("/api/analyze-report", async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      if (!ai) {
        return res.status(503).json({
          error: "Gemini API is not configured. Please add GEMINI_API_KEY under Settings > Secrets in AI Studio.",
        });
      }

      const { image, description } = req.body;
      const parts: any[] = [];

      if (image) {
        // Parse the base64 data url
        const matches = image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (matches) {
          parts.push({
            inlineData: {
              mimeType: matches[1],
              data: matches[2],
            },
          });
        } else {
          // If pure base64 string is sent
          parts.push({
            inlineData: {
              mimeType: "image/jpeg",
              data: image,
            },
          });
        }
      }

      // Action-oriented structured prompt
      const promptString = `You are an expert municipal infrastructure inspector analyzing a civic issue report.
Analyze the user's description and any provided image.

User description: "${description || "No description provided."}"

Classify and extract:
1. Category: Must be exactly one of: "Pothole", "Garbage", "Water Leakage", "Broken Streetlight", "Road Damage", "Drainage", "Fallen Tree", or "Other".
2. Severity: "Low", "Medium", or "High" (impact on public safety/traffic).
3. Urgency: "Normal", "Urgent", or "Critical".
4. Suggested Government Department: The specific municipal agency responsible for resolving this (e.g., "Public Works", "Waste Management", "Water Supply & Sewerage", "Street Lighting & Electricity", "Parks & Forestry").
5. Estimated Risk: 1-2 clear, professional sentences detailing the danger (e.g., "Presents a collision hazard for night drivers and could damage vehicle suspension.").
6. Professional Complaint Summary: A polite, formal, brief, and action-oriented complaint summary (under 8 words or up to 60 words maximum) appropriate for submission to the government department.

Provide your output strictly in JSON format as specified in the schema.`;

      parts.push({ text: promptString });

      console.log("Calling Gemini 3.5 Flash for civic issue analysis...");
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: {
                type: Type.STRING,
                description: "Must be exactly one of: Pothole, Garbage, Water Leakage, Broken Streetlight, Road Damage, Drainage, Fallen Tree, Other",
              },
              severity: {
                type: Type.STRING,
                description: "Must be Low, Medium, or High",
              },
              urgency: {
                type: Type.STRING,
                description: "Must be Normal, Urgent, or Critical",
              },
              department: {
                type: Type.STRING,
                description: "Recommended local municipal department",
              },
              risk: {
                type: Type.STRING,
                description: "1-2 sentence risk evaluation of public safety impact",
              },
              summary: {
                type: Type.STRING,
                description: "Formal municipal complaint text",
              },
            },
            required: ["category", "severity", "urgency", "department", "risk", "summary"],
          },
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("No response text received from Gemini.");
      }

      const parsedResponse = JSON.parse(text.trim());
      console.log("Successfully analyzed report. Category:", parsedResponse.category);
      return res.json(parsedResponse);
    } catch (error: any) {
      console.error("Error analyzing report with Gemini:", error);
      return res.status(500).json({
        error: error.message || "An error occurred during Gemini issue analysis.",
      });
    }
  });

  // Integrate Vite dev middleware or serve static production build
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production assets from /dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SpotFix AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
