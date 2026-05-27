import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const PORT = 3000;

// Lazy initialization of the Gemini AI clients
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("GEMINI_API_KEY is missing or unconfigured. Please configure it in AI Studio under Settings > Secrets.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Route - Get Smart Campaign Suggestions based on RFM customer segment statistics
  app.post("/api/smart-campaign-suggestions", async (req, res) => {
    try {
      const { segment, stats } = req.body;
      
      const ai = getGeminiClient();
      
      const prompt = `You are a world-class growth marketing director and retention scientist. 
Develop a highly tailored, custom Retention & Re-engagement Strategy for the following customer segment:

Segment name: "${segment}"
Statistics of this segment:
- Number of active customers: ${stats.count}
- Average Recency of Purchase: ${stats.avgRecency} days ago
- Average purchase cadence/frequency: ${stats.avgFrequency} items/year
- Average monetary purchase value: $${stats.avgMonetary} per order
- Total accumulated historical value: $${stats.totalRevenue}

Specifically, please return your recommendations formatted as JSON with the following schema:
{
  "strategicOverview": "A professional paragraph detailing the psychological state of these buyers and the strategic objective (e.g. increase frequency, winback, maintain premium status). Ensure it is extremely professional and actionable.",
  "keyRecommendations": [
    "A concise strategy item with exact visual or incentive offer details",
    "Another strategic milestone or automation trigger",
    "A third actionable retention strategy specific to this RFM score tier"
  ],
  "messageTemplateTitle": "Subject line text / Notification header",
  "messageTemplateBody": "The full copy of a highly personalized re-engagement or loyalty email template. Use markdown, include dynamic tags like [Customer Name] and [Discount Code] and [Last Purchased Category], and keep it incredibly compelling."
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseString = response.text || "{}";
      const cleanedJSON = JSON.parse(responseString.trim());
      res.json({ success: true, data: cleanedJSON });
    } catch (error: any) {
      console.error("API error in campaign suggestions:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "An internal error occurred running Gemini generation." 
      });
    }
  });

  // API Route - Generate custom re-engagement templates for single customers
  app.post("/api/personal-reengagement-generator", async (req, res) => {
    try {
      const { customerId, recency, frequency, monetary, segment, age } = req.body;
      
      const ai = getGeminiClient();
      
      const prompt = `You are an elite customer success copilot writing a direct, personal 1-to-1 re-engagement text or email to a specific customer who is in the "${segment}" segment.

Client details:
- Customer ID: ${customerId}
- Days since last purchase (Recency): ${recency} days ago
- Number of repeat checkout transactions (Frequency): ${frequency} successful cycles
- Average order basket volume (Monetary Value): $${monetary} per ticket
- Customer account age: ${age} days

Write a direct, non-spammy, warmly personalized outreach message that references their purchase frequency and includes a subtle, high-converting offer matched to their dollar tier (VIP gets premium status perks, dormant low tiers get discount tokens). Keep the email body visually clean and professional.

Return your response in standard JSON:
{
  "subject": "The specific subject line of the outreach message",
  "outreachChannel": "Email or SMS recommended",
  "body": "The direct, highly personalized text message body. Use spacing and paragraphs nicely. Keep it natural, human, and directly addresses their stats without sounding creepy about numbers."
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });
      
      const responseString = response.text || "{}";
      const cleanedJSON = JSON.parse(responseString.trim());
      res.json({ success: true, data: cleanedJSON });
    } catch (error: any) {
      console.error("API error in re-engagement generator:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "An error occurred during Gemini personalized generation." 
      });
    }
  });

  // Vite integration
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
    console.log(`[Server] Customer Analytics & CLV Server running on http://localhost:${PORT}`);
  });
}

startServer();
