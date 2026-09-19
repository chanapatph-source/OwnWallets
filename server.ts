import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser with 25MB limit for slip images
app.use(express.json({ limit: "25mb" }));

// Lazy Gemini client initialization
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return null;
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Slip Parsing API with Gemini Vision
app.post("/api/parse-slip", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: "Missing imageBase64 in request body" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(200).json({
        success: false,
        error: "GEMINI_API_KEY not configured",
        needsApiKey: true,
      });
    }

    // Strip data url prefix if present
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z0-9-+.]+;base64,/, "");

    const prompt = `You are an expert AI for OCR and information extraction from Thai bank transfer slips (สลิปโอนเงิน / ใบเสร็จโอนเงินผ่านธนาคารไทย เช่น KBank, SCB, Krungthai, Bangkok Bank, TTB, GSB, TrueMoney, PromptPay).
Carefully read the provided image of a transfer slip and extract all financial transaction details into the following strict JSON schema:
{
  "amount": <number, positive float, the transferred money amount e.g. 150.00. Do NOT include currency symbols or commas>,
  "date": <string, transfer date in format "YYYY-MM-DD", e.g. "2026-09-19". If Thai Buddhist year (พ.ศ.) is on slip like 2567, 2568, 2569, convert to Gregorian CE year like 2024, 2025, 2026>,
  "time": <string, transfer time in 24h format "HH:mm", e.g. "14:32">,
  "recipient": <string, name of recipient or merchant or promptpay ID, e.g. "ร้านกาแฟชื่นใจ" or "นาย สมชาย ใจดี">,
  "sender": <string, name of sender if visible>,
  "bank": <string, bank name e.g. "กสิกรไทย", "ไทยพาณิชย์", "กรุงไทย", "พร้อมเพย์", "ทรูมันนี่">,
  "categoryId": <string, choose exactly one from: "food", "transport", "shopping", "bills", "entertainment", "health", "education", "other_expense">,
  "categoryName": <string in Thai matching categoryId>,
  "note": <string, note or description of this transaction, e.g. "โอนเงินให้ นาย สมชาย" or note found on slip>,
  "confidence": <number between 0.0 and 1.0>
}

Classification rules for categoryId:
- "food": restaurants, cafes, food stalls, 7-Eleven, GrabFood, Lineman, food purchases
- "transport": BTS, MRT, gas stations (PTT, Bangchak, Shell, Caltex), taxi, Grab transport
- "shopping": Shopee, Lazada, retail stores, clothing, gadgets
- "bills": electricity, water, internet, phone bill, rent, condo common fee
- "entertainment": movies, games, travel, hotels, attractions
- "health": hospital, clinic, pharmacy, vitamins, medicines
- "education": books, tuition, courses, school supplies
- "other_expense": personal transfers or general expenses not categorized above

Return ONLY the raw JSON object, no Markdown ticks.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    const data = JSON.parse(responseText);

    return res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error parsing slip with Gemini:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to analyze slip",
    });
  }
});

// Vite middleware / static files
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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
