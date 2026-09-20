import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Global Security Headers for OAuth popups
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

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

    const prompt = `You are a specialized precision OCR engine for Thai bank transfer slips (สลิปโอนเงิน / ใบเสร็จธนาคารไทย).
Your critical task is to accurately read the EXACT amount of money transferred (จำนวนเงินที่โอน), recipient/merchant, date, and time.

Common Thai banking apps:
- KBank (กสิกรไทย - K PLUS): look for "จำนวนเงิน" or large bold number in baht, e.g. "85.00" or "1,250.00".
- SCB (ไทยพาณิชย์ - SCB EASY): look for "จำนวนเงิน (บาท)" or bold transaction amount.
- Krungthai (กรุงไทย - Krungthai NEXT): look for "จำนวนเงิน" or "บาท / THB".
- Bangkok Bank (บัวหลวง / Bualuang mBanking): look for "จำนวนเงิน".
- TTB (ทีเอ็มบีธนชาต / ttb touch), GSB (ออมสิน / MyMo), TrueMoney Wallet, PromptPay (พร้อมเพย์).

IMPORTANT RULES FOR AMOUNT:
1. "amount": Extract the PRIMARY transferred amount. Must be a positive floating number without commas or currency symbols (e.g., 85, 1250, 420.50).
2. DO NOT confuse the transfer amount with fee ("ค่าธรรมเนียม: 0.00"), remaining balance ("ยอดเงินคงเหลือ"), account number digits, or date numbers.
3. If amount has decimals like .00, extract as number e.g. 500 or 500.0.

IMPORTANT RULES FOR DATE & TIME:
1. "date": In standard format "YYYY-MM-DD" (e.g. "2026-09-19"). If slip shows Buddhist Era (พ.ศ. 2567 -> 2024, 2568 -> 2025, 2569 -> 2026), calculate Gregorian year accurately. If year is omitted or unclear, default to current year 2026.
2. "time": Transfer time in 24-hour format "HH:mm" (e.g. "14:35", "08:12").

OUTPUT JSON SCHEMA:
{
  "amount": <number, mandatory, positive number>,
  "date": <string, "YYYY-MM-DD">,
  "time": <string, "HH:mm">,
  "recipient": <string, name of recipient / receiver / promptpay account / merchant / shop>,
  "sender": <string, name of sender / payer>,
  "bank": <string, bank name e.g. "กสิกรไทย", "ไทยพาณิชย์", "กรุงไทย", "พร้อมเพย์", "ttb", "ออมสิน", "ทรูมันนี่">,
  "categoryId": <string, one of: "food", "transport", "shopping", "bills", "entertainment", "health", "education", "other_expense">,
  "categoryName": <string, category title in Thai>,
  "note": <string, memo or note written on slip or reasonable summary e.g. "โอนเงินให้ ...">,
  "confidence": <number between 0.0 and 1.0>
}

Classification rules for categoryId:
- "food": restaurants, food stalls, cafes, 7-Eleven, GrabFood, Lineman, coffee, tea, meals
- "transport": BTS, MRT, gas/fuel (PTT, Bangchak, Shell, Caltex), taxi, tolls, Grab ride
- "shopping": Shopee, Lazada, TikTok Shop, retail stores, clothes, electronics
- "bills": electricity (PEA/MEA), water (MWA/PWA), internet (True, AIS, 3BB), rent, mobile phone bills
- "entertainment": cinema, games, travel, hotels, vacations
- "health": hospitals, clinics, pharmacies, dental
- "education": tuition, books, courses, school fees
- "other_expense": general transfers to individuals, debts, miscellaneous

Return strictly raw valid JSON. Do not include markdown codeblocks (\`\`\`json).`;

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
    let data: any = {};
    try {
      const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      data = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.warn("Failed direct JSON parse, attempting substring match:", parseErr);
      const match = responseText.match(/\{[\s\S]*\}/);
      if (match) {
        data = JSON.parse(match[0]);
      }
    }

    // Ensure amount is parsed to a clean number
    if (data && data.amount !== undefined) {
      const parsedNum = parseFloat(String(data.amount).replace(/,/g, ""));
      data.amount = isNaN(parsedNum) ? 0 : parsedNum;
    }

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
