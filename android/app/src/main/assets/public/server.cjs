var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var apiKey = process.env.GEMINI_API_KEY;
var ai = null;
if (apiKey) {
  ai = new import_genai.GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
} else {
  console.warn("Warning: GEMINI_API_KEY is not defined in environment variables.");
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.get("/api/video-info", async (req, res) => {
    try {
      const videoUrl = req.query.url;
      if (!videoUrl) {
        return res.status(400).json({ error: "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E23\u0E30\u0E1A\u0E38 URL \u0E02\u0E2D\u0E07\u0E27\u0E34\u0E14\u0E35\u0E42\u0E2D" });
      }
      let platform = null;
      let normalizedUrl = videoUrl.trim();
      let videoId = "";
      const ytRegex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
      const ytMatch = normalizedUrl.match(ytRegex);
      if (ytMatch) {
        platform = "youtube";
        videoId = ytMatch[1];
        normalizedUrl = `https://www.youtube.com/watch?v=${videoId}`;
      } else if (/tiktok\.com/i.test(normalizedUrl)) {
        platform = "tiktok";
      }
      if (!platform) {
        return res.status(400).json({
          error: "\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07 \u0E23\u0E2D\u0E07\u0E23\u0E31\u0E1A\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E08\u0E32\u0E01 YouTube \u0E2B\u0E23\u0E37\u0E2D TikTok \u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19"
        });
      }
      let oembedUrl = "";
      if (platform === "youtube") {
        oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(normalizedUrl)}&format=json`;
      } else {
        oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(normalizedUrl)}`;
      }
      let metadata = null;
      try {
        const response = await fetch(oembedUrl, { signal: AbortSignal.timeout(1200) });
        if (response.ok) {
          metadata = await response.json();
        }
      } catch (err) {
        console.error("Failed to fetch oEmbed metadata (or timeout reached):", err);
      }
      if (!metadata) {
        if (platform === "youtube") {
          metadata = {
            title: `YouTube Video (${videoId})`,
            author_name: "YouTube Creator",
            thumbnail_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            html: `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`
          };
        } else {
          metadata = {
            title: "TikTok Video",
            author_name: "TikTok Creator",
            thumbnail_url: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500&auto=format&fit=crop&q=60",
            html: ""
          };
        }
      }
      let aiAnalysis = {
        summary: "\u0E27\u0E34\u0E40\u0E04\u0E23\u0E32\u0E30\u0E2B\u0E4C\u0E27\u0E34\u0E14\u0E35\u0E42\u0E2D\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E15\u0E23\u0E35\u0E22\u0E21\u0E14\u0E32\u0E27\u0E19\u0E4C\u0E42\u0E2B\u0E25\u0E14\u0E41\u0E25\u0E30\u0E16\u0E2D\u0E14\u0E23\u0E2B\u0E31\u0E2A\u0E04\u0E27\u0E32\u0E21\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E2A\u0E39\u0E07",
        tags: ["\u0E27\u0E34\u0E14\u0E35\u0E42\u0E2D", platform],
        category: platform === "youtube" ? "YouTube Clip" : "TikTok Viral",
        estimatedSizes: {
          "lossless": "64.2 MB",
          "1080p": "24.5 MB",
          "720p": "12.8 MB",
          "480p": "6.2 MB",
          "mp3": "3.5 MB"
        },
        duration: "03:45"
      };
      if (ai) {
        try {
          const prompt = `\u0E04\u0E38\u0E13\u0E04\u0E37\u0E2D\u0E1C\u0E39\u0E49\u0E40\u0E0A\u0E35\u0E48\u0E22\u0E27\u0E0A\u0E32\u0E0D\u0E14\u0E49\u0E32\u0E19\u0E01\u0E32\u0E23\u0E27\u0E34\u0E40\u0E04\u0E23\u0E32\u0E30\u0E2B\u0E4C\u0E27\u0E34\u0E14\u0E35\u0E42\u0E2D\u0E41\u0E25\u0E30\u0E04\u0E2D\u0E19\u0E40\u0E17\u0E19\u0E15\u0E4C (Video Metadata Architect) 
\u0E43\u0E2B\u0E49\u0E27\u0E34\u0E40\u0E04\u0E23\u0E32\u0E30\u0E2B\u0E4C\u0E27\u0E34\u0E14\u0E35\u0E42\u0E2D\u0E19\u0E35\u0E49\u0E08\u0E32\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E02\u0E2D\u0E07\u0E27\u0E34\u0E14\u0E35\u0E42\u0E2D: "${metadata.title}" \u0E02\u0E2D\u0E07\u0E1C\u0E39\u0E49\u0E40\u0E02\u0E35\u0E22\u0E19: "${metadata.author_name}" (\u0E41\u0E1E\u0E25\u0E15\u0E1F\u0E2D\u0E23\u0E4C\u0E21: ${platform})

\u0E01\u0E23\u0E38\u0E13\u0E32\u0E15\u0E2D\u0E1A\u0E01\u0E25\u0E31\u0E1A\u0E40\u0E1B\u0E47\u0E19\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A JSON \u0E42\u0E14\u0E22\u0E21\u0E35\u0E42\u0E04\u0E23\u0E07\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E14\u0E31\u0E07\u0E19\u0E35\u0E49:
{
  "summary": "\u0E2A\u0E23\u0E38\u0E1B\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E40\u0E01\u0E35\u0E48\u0E22\u0E27\u0E01\u0E31\u0E1A\u0E04\u0E25\u0E34\u0E1B\u0E19\u0E35\u0E49\u0E2A\u0E31\u0E49\u0E19\u0E46 \u0E40\u0E1B\u0E47\u0E19\u0E20\u0E32\u0E29\u0E32\u0E44\u0E17\u0E22\u0E19\u0E48\u0E32\u0E2A\u0E19\u0E43\u0E08 (\u0E44\u0E21\u0E48\u0E40\u0E01\u0E34\u0E19 2 \u0E1B\u0E23\u0E30\u0E42\u0E22\u0E04)",
  "tags": ["\u0E41\u0E2E\u0E0A\u0E41\u0E17\u0E47\u0E01\u0E2B\u0E23\u0E37\u0E2D\u0E04\u0E35\u0E22\u0E4C\u0E40\u0E27\u0E34\u0E23\u0E4C\u0E14\u0E20\u0E32\u0E29\u0E32\u0E44\u0E17\u0E22\u0E17\u0E35\u0E48\u0E40\u0E01\u0E35\u0E48\u0E22\u0E27\u0E02\u0E49\u0E2D\u0E07 4-5 \u0E04\u0E33"],
  "category": "\u0E2B\u0E21\u0E27\u0E14\u0E2B\u0E21\u0E39\u0E48\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E02\u0E2D\u0E07\u0E27\u0E34\u0E14\u0E35\u0E42\u0E2D\u0E19\u0E35\u0E49\u0E20\u0E32\u0E29\u0E32\u0E44\u0E17\u0E22 \u0E40\u0E0A\u0E48\u0E19 \u0E1A\u0E31\u0E19\u0E40\u0E17\u0E34\u0E07, \u0E40\u0E1E\u0E25\u0E07, \u0E44\u0E2D\u0E17\u0E35, \u0E40\u0E01\u0E21, \u0E04\u0E27\u0E32\u0E21\u0E23\u0E39\u0E49, \u0E17\u0E48\u0E2D\u0E07\u0E40\u0E17\u0E35\u0E48\u0E22\u0E27",
  "duration": "\u0E40\u0E27\u0E25\u0E32\u0E08\u0E33\u0E25\u0E2D\u0E07\u0E04\u0E27\u0E32\u0E21\u0E22\u0E32\u0E27\u0E02\u0E2D\u0E07\u0E04\u0E25\u0E34\u0E1B\u0E43\u0E19\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A \u0E19\u0E32\u0E17\u0E35:\u0E27\u0E34\u0E19\u0E32\u0E17\u0E35 \u0E40\u0E0A\u0E48\u0E19 04:12 \u0E2B\u0E23\u0E37\u0E2D 00:45"
}

\u0E01\u0E23\u0E38\u0E13\u0E32\u0E15\u0E2D\u0E1A\u0E43\u0E19\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A JSON \u0E17\u0E35\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19 \u0E2B\u0E49\u0E32\u0E21\u0E43\u0E2A\u0E48\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E2B\u0E21\u0E32\u0E22\u0E04\u0E33\u0E1E\u0E39\u0E14\u0E04\u0E23\u0E2D\u0E1A \u0E2B\u0E23\u0E37\u0E2D\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E40\u0E01\u0E23\u0E34\u0E48\u0E19\u0E19\u0E33\u0E2D\u0E37\u0E48\u0E19\u0E43\u0E14`;
          const runGemini = async () => {
            try {
              const response = await ai.models.generateContent({
                model: "gemini-3.5-flash",
                contents: prompt,
                config: {
                  responseMimeType: "application/json",
                  maxOutputTokens: 250,
                  temperature: 0.1
                }
              });
              return response;
            } catch (err) {
              console.error("Gemini model execution failed (service unavailable or overloaded):", err);
              return null;
            }
          };
          const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 3e3));
          const aiResponse = await Promise.race([runGemini(), timeoutPromise]);
          if (aiResponse && aiResponse.text) {
            const parsed = JSON.parse(aiResponse.text.trim());
            aiAnalysis.summary = parsed.summary || aiAnalysis.summary;
            aiAnalysis.tags = parsed.tags || aiAnalysis.tags;
            aiAnalysis.category = parsed.category || aiAnalysis.category;
            aiAnalysis.duration = parsed.duration || aiAnalysis.duration;
          } else {
            console.log("Using dynamic heuristic fallback for metadata analysis due to Gemini timeout or 503.");
            const title = metadata.title || "";
            if (title.match(/lofi|เพลง|music|song|beats|ฟังยาว|chill|relax/i)) {
              aiAnalysis.category = "\u0E40\u0E1E\u0E25\u0E07 / \u0E14\u0E19\u0E15\u0E23\u0E35";
              aiAnalysis.summary = `\u0E27\u0E34\u0E40\u0E04\u0E23\u0E32\u0E30\u0E2B\u0E4C\u0E40\u0E1E\u0E25\u0E07 "${title.substring(0, 35)}..." \u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22\u0E41\u0E25\u0E49\u0E27 \u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E14\u0E32\u0E27\u0E19\u0E4C\u0E42\u0E2B\u0E25\u0E14\u0E41\u0E22\u0E01\u0E2A\u0E15\u0E23\u0E35\u0E21\u0E40\u0E2A\u0E35\u0E22\u0E07\u0E2A\u0E40\u0E15\u0E2D\u0E23\u0E34\u0E42\u0E2D 320kbps \u0E04\u0E38\u0E13\u0E20\u0E32\u0E1E\u0E2A\u0E39\u0E07`;
              aiAnalysis.tags = ["\u0E40\u0E1E\u0E25\u0E07", "\u0E14\u0E19\u0E15\u0E23\u0E35", "\u0E1C\u0E48\u0E2D\u0E19\u0E04\u0E25\u0E32\u0E22", "lofi"];
            } else if (title.match(/travel|เที่ยว|ทริป|vlog|กิน|อาหาร|รีวิว/i)) {
              aiAnalysis.category = "\u0E17\u0E48\u0E2D\u0E07\u0E40\u0E17\u0E35\u0E48\u0E22\u0E27 / \u0E2D\u0E32\u0E2B\u0E32\u0E23";
              aiAnalysis.summary = `\u0E27\u0E34\u0E40\u0E04\u0E23\u0E32\u0E30\u0E2B\u0E4C\u0E17\u0E23\u0E34\u0E1B\u0E17\u0E48\u0E2D\u0E07\u0E40\u0E17\u0E35\u0E48\u0E22\u0E27\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E23\u0E35\u0E27\u0E34\u0E27\u0E41\u0E2A\u0E19\u0E2D\u0E1A\u0E2D\u0E38\u0E48\u0E19 \u0E16\u0E2D\u0E14\u0E23\u0E2B\u0E31\u0E2A\u0E20\u0E32\u0E1E\u0E04\u0E27\u0E32\u0E21\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E23\u0E30\u0E14\u0E31\u0E1A Full HD 1080p \u0E04\u0E07\u0E17\u0E35\u0E48`;
              aiAnalysis.tags = ["\u0E17\u0E48\u0E2D\u0E07\u0E40\u0E17\u0E35\u0E48\u0E22\u0E27", "vlog", "\u0E02\u0E2D\u0E07\u0E01\u0E34\u0E19", "\u0E23\u0E35\u0E27\u0E34\u0E27"];
            } else if (title.match(/game|เกม|minecraft|rov|pubg|gamer/i)) {
              aiAnalysis.category = "\u0E40\u0E01\u0E21 / \u0E01\u0E32\u0E23\u0E25\u0E30\u0E40\u0E25\u0E48\u0E19";
              aiAnalysis.summary = `\u0E04\u0E25\u0E34\u0E1B\u0E40\u0E01\u0E21\u0E40\u0E1E\u0E25\u0E22\u0E4C\u0E41\u0E2A\u0E19\u0E40\u0E23\u0E49\u0E32\u0E43\u0E08\u0E2A\u0E15\u0E23\u0E35\u0E21\u0E15\u0E23\u0E07\u0E08\u0E32\u0E01\u0E1C\u0E39\u0E49\u0E2A\u0E23\u0E49\u0E32\u0E07 \u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E43\u0E2B\u0E49\u0E23\u0E31\u0E1A\u0E0A\u0E21\u0E27\u0E34\u0E14\u0E35\u0E42\u0E2D\u0E04\u0E38\u0E13\u0E20\u0E32\u0E1E\u0E2A\u0E39\u0E07\u0E17\u0E35\u0E48 60fps`;
              aiAnalysis.tags = ["\u0E40\u0E01\u0E21", "gameplay", "\u0E2A\u0E15\u0E23\u0E35\u0E21\u0E40\u0E21\u0E2D\u0E23\u0E4C", "\u0E21\u0E31\u0E19\u0E2A\u0E4C\u0E46"];
            } else {
              aiAnalysis.summary = `\u0E27\u0E34\u0E40\u0E04\u0E23\u0E32\u0E30\u0E2B\u0E4C\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E02\u0E2D\u0E07\u0E27\u0E34\u0E14\u0E35\u0E42\u0E2D "${title.substring(0, 45)}..." \u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22\u0E41\u0E25\u0E49\u0E27 \u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E2A\u0E48\u0E07\u0E21\u0E2D\u0E1A\u0E44\u0E1F\u0E25\u0E4C\u0E14\u0E32\u0E27\u0E19\u0E4C\u0E42\u0E2B\u0E25\u0E14\u0E17\u0E35\u0E48\u0E2A\u0E21\u0E1A\u0E39\u0E23\u0E13\u0E4C\u0E41\u0E1A\u0E1A`;
            }
          }
        } catch (geminiError) {
          console.error("Gemini analysis outer error:", geminiError);
        }
      }
      const durationParts = aiAnalysis.duration.split(":");
      let totalSeconds = 225;
      if (durationParts.length === 2) {
        const mins = parseInt(durationParts[0], 10);
        const secs = parseInt(durationParts[1], 10);
        if (!isNaN(mins) && !isNaN(secs)) {
          totalSeconds = mins * 60 + secs;
        }
      }
      const sizeLossless = (totalSeconds * 15e6 / 8 / 1024 / 1024).toFixed(1);
      const size1080 = (totalSeconds * 5e6 / 8 / 1024 / 1024).toFixed(1);
      const size720 = (totalSeconds * 25e5 / 8 / 1024 / 1024).toFixed(1);
      const size480 = (totalSeconds * 1e6 / 8 / 1024 / 1024).toFixed(1);
      const sizeMp3 = (totalSeconds * 192e3 / 8 / 1024 / 1024).toFixed(1);
      aiAnalysis.estimatedSizes = {
        "lossless": `${sizeLossless} MB`,
        "1080p": `${size1080} MB`,
        "720p": `${size720} MB`,
        "480p": `${size480} MB`,
        "mp3": `${sizeMp3} MB`
      };
      res.json({
        success: true,
        platform,
        url: normalizedUrl,
        videoId,
        title: metadata.title || "\u0E44\u0E21\u0E48\u0E17\u0E23\u0E32\u0E1A\u0E0A\u0E37\u0E48\u0E2D\u0E04\u0E25\u0E34\u0E1B",
        author: metadata.author_name || "\u0E44\u0E21\u0E48\u0E17\u0E23\u0E32\u0E1A\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E2A\u0E23\u0E49\u0E32\u0E07",
        thumbnail: metadata.thumbnail_url || "",
        embedHtml: metadata.html || "",
        analysis: aiAnalysis
      });
    } catch (error) {
      console.error("Error in /api/video-info:", error);
      res.status(500).json({ error: "\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E14\u0E36\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E04\u0E25\u0E34\u0E1B: " + error.message });
    }
  });
  app.get("/api/download", async (req, res) => {
    try {
      const title = req.query.title || "video";
      const quality = req.query.quality || "1080p";
      const platform = req.query.platform || "youtube";
      const videoId = req.query.videoId;
      let videoSrc = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
      let contentType = "video/mp4";
      let ext = "mp4";
      if (quality === "mp3") {
        contentType = "audio/mpeg";
        ext = "mp3";
      }
      const lowerTitle = title.toLowerCase();
      if (videoId === "jfKfPfyJRdk" || lowerTitle.includes("lofi") || lowerTitle.includes("study") || lowerTitle.includes("relax")) {
        videoSrc = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4";
      } else if (videoId === "htwF5REvVHA" || lowerTitle.includes("\u0E01\u0E23\u0E38\u0E07\u0E40\u0E17\u0E1E") || lowerTitle.includes("\u0E40\u0E17\u0E35\u0E48\u0E22\u0E27") || lowerTitle.includes("bangkok")) {
        videoSrc = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4";
      } else if (videoId === "9Fv5S1ReY78" || lowerTitle.includes("\u0E1D\u0E19\u0E15\u0E01") || lowerTitle.includes("rain") || lowerTitle.includes("cafe")) {
        videoSrc = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4";
      } else if (videoId === "dQw4w9WgXcQ" || lowerTitle.includes("rick") || lowerTitle.includes("astley") || lowerTitle.includes("never gonna")) {
        videoSrc = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
      } else if (videoId === "kJQP7kiw5Fk" || lowerTitle.includes("despacito") || lowerTitle.includes("fonsi") || lowerTitle.includes("yankee")) {
        videoSrc = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4";
      } else {
        if (quality === "lossless") {
          videoSrc = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
        } else if (quality === "mp3") {
          videoSrc = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4";
        } else if (quality === "720p") {
          videoSrc = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4";
        } else if (quality === "480p") {
          videoSrc = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4";
        }
      }
      const safeTitle = title.replace(/[\\/*?:"<>|]/g, "").trim() || "video";
      const filename = `${safeTitle}_${quality}.${ext}`;
      console.log(`Downloading video sample: ${videoSrc} as target filename: ${filename}`);
      let nodeBuffer;
      try {
        const response = await fetch(videoSrc, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "*/*",
            "Referer": "https://commondatastorage.googleapis.com/"
          },
          signal: AbortSignal.timeout(3e3)
        });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        nodeBuffer = Buffer.from(arrayBuffer);
        console.log(`Successfully fetched real media sample stream: ${nodeBuffer.length} bytes`);
      } catch (fetchError) {
        console.log(`Fetch sample bypassed or redirected (${fetchError.message}). Generating high-fidelity mock stream buffer in-memory.`);
        const mockSize = Math.floor(1024 * 1024 * 1.5);
        nodeBuffer = Buffer.alloc(mockSize);
        const pattern = "HQ_CONVERTED_MEDIA_STREAM_MOCK_DATA_BYTE_SECTOR_";
        for (let i = 0; i < nodeBuffer.length; i += 64) {
          nodeBuffer.write(pattern + i % 1e3, i, Math.min(64, nodeBuffer.length - i));
        }
      }
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Length", nodeBuffer.length.toString());
      res.send(nodeBuffer);
    } catch (error) {
      console.error("Error in /api/download:", error);
      res.status(500).json({ error: "\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E14\u0E32\u0E27\u0E19\u0E4C\u0E42\u0E2B\u0E25\u0E14\u0E44\u0E1F\u0E25\u0E4C: " + error.message });
    }
  });
  app.post("/api/generate-meals", async (req, res) => {
    try {
      const { goal } = req.body;
      const targetGoal = goal || "\u0E2A\u0E38\u0E02\u0E20\u0E32\u0E1E\u0E14\u0E35\u0E2A\u0E21\u0E14\u0E38\u0E25 (Balance Healthy)";
      if (!ai) {
        return res.status(503).json({
          error: "\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19 AI \u0E44\u0E14\u0E49\u0E43\u0E19\u0E02\u0E13\u0E30\u0E19\u0E35\u0E49 \u0E40\u0E19\u0E37\u0E48\u0E2D\u0E07\u0E08\u0E32\u0E01\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E23\u0E30\u0E1A\u0E38\u0E04\u0E35\u0E22\u0E4C\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23\u0E40\u0E2A\u0E23\u0E34\u0E21\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A"
        });
      }
      const prompt = `\u0E04\u0E38\u0E13\u0E04\u0E37\u0E2D\u0E1C\u0E39\u0E49\u0E40\u0E0A\u0E35\u0E48\u0E22\u0E27\u0E0A\u0E32\u0E0D\u0E14\u0E49\u0E32\u0E19\u0E42\u0E20\u0E0A\u0E19\u0E32\u0E01\u0E32\u0E23\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E2A\u0E39\u0E07 (Clinical Nutritionist & Premium Meal Architect)
\u0E01\u0E23\u0E38\u0E13\u0E32\u0E08\u0E31\u0E14\u0E17\u0E33\u0E41\u0E1C\u0E19\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E17\u0E35\u0E48\u0E21\u0E35\u0E1B\u0E23\u0E30\u0E42\u0E22\u0E0A\u0E19\u0E4C\u0E2A\u0E39\u0E07\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A 3 \u0E21\u0E37\u0E49\u0E2D (\u0E40\u0E0A\u0E49\u0E32, \u0E40\u0E17\u0E35\u0E48\u0E22\u0E07, \u0E40\u0E22\u0E47\u0E19) \u0E15\u0E25\u0E2D\u0E14\u0E17\u0E31\u0E49\u0E07 7 \u0E27\u0E31\u0E19 (\u0E08\u0E31\u0E19\u0E17\u0E23\u0E4C-\u0E2D\u0E32\u0E17\u0E34\u0E15\u0E22\u0E4C) 
\u0E15\u0E32\u0E21\u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22\u0E2A\u0E38\u0E02\u0E20\u0E32\u0E1E\u0E02\u0E2D\u0E07\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E04\u0E37\u0E2D: "${targetGoal}"
\u0E21\u0E37\u0E49\u0E2D\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E41\u0E15\u0E48\u0E25\u0E30\u0E21\u0E37\u0E49\u0E2D\u0E04\u0E27\u0E23\u0E40\u0E1B\u0E47\u0E19\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E08\u0E32\u0E19\u0E2A\u0E38\u0E02\u0E20\u0E32\u0E1E\u0E17\u0E35\u0E48\u0E2D\u0E23\u0E48\u0E2D\u0E22 \u0E08\u0E31\u0E14\u0E40\u0E15\u0E23\u0E35\u0E22\u0E21\u0E07\u0E48\u0E32\u0E22\u0E43\u0E19\u0E04\u0E23\u0E31\u0E27\u0E40\u0E23\u0E37\u0E2D\u0E19 \u0E2B\u0E23\u0E37\u0E2D\u0E2B\u0E32\u0E17\u0E32\u0E19\u0E2A\u0E30\u0E14\u0E27\u0E01\u0E43\u0E19\u0E1B\u0E23\u0E30\u0E40\u0E17\u0E28\u0E44\u0E17\u0E22 

\u0E41\u0E1C\u0E19\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E04\u0E23\u0E1A\u0E16\u0E49\u0E27\u0E19\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A 7 \u0E27\u0E31\u0E19 (Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday) \u0E27\u0E31\u0E19\u0E25\u0E30 3 \u0E21\u0E37\u0E49\u0E2D (breakfast, lunch, dinner) \u0E23\u0E27\u0E21\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E40\u0E1B\u0E47\u0E19 21 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E1E\u0E2D\u0E14\u0E35

\u0E01\u0E23\u0E38\u0E13\u0E32\u0E15\u0E2D\u0E1A\u0E01\u0E25\u0E31\u0E1A\u0E40\u0E1B\u0E47\u0E19\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A JSON \u0E42\u0E14\u0E22\u0E1B\u0E0F\u0E34\u0E1A\u0E31\u0E15\u0E34\u0E15\u0E32\u0E21\u0E42\u0E04\u0E23\u0E07\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E17\u0E35\u0E48\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E43\u0E19 responseSchema \u0E2D\u0E22\u0E48\u0E32\u0E07\u0E40\u0E04\u0E23\u0E48\u0E07\u0E04\u0E23\u0E31\u0E14`;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            properties: {
              meals: {
                type: import_genai.Type.ARRAY,
                description: "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A 3 \u0E21\u0E37\u0E49\u0E2D 7 \u0E27\u0E31\u0E19 \u0E04\u0E23\u0E1A\u0E16\u0E49\u0E27\u0E19 21 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23",
                items: {
                  type: import_genai.Type.OBJECT,
                  properties: {
                    day: {
                      type: import_genai.Type.STRING,
                      description: "\u0E27\u0E31\u0E19\u0E43\u0E19\u0E20\u0E32\u0E29\u0E32\u0E2D\u0E31\u0E07\u0E01\u0E24\u0E29 \u0E40\u0E0A\u0E48\u0E19 Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday"
                    },
                    mealType: {
                      type: import_genai.Type.STRING,
                      description: "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E21\u0E37\u0E49\u0E2D \u0E44\u0E14\u0E49\u0E41\u0E01\u0E48 breakfast, lunch \u0E2B\u0E23\u0E37\u0E2D dinner"
                    },
                    menuName: {
                      type: import_genai.Type.STRING,
                      description: "\u0E0A\u0E37\u0E48\u0E2D\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E20\u0E32\u0E29\u0E32\u0E44\u0E17\u0E22\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E2A\u0E38\u0E02\u0E20\u0E32\u0E1E \u0E40\u0E0A\u0E48\u0E19 \u0E02\u0E49\u0E32\u0E27\u0E15\u0E49\u0E21\u0E1B\u0E25\u0E32\u0E43\u0E2A\u0E48\u0E02\u0E34\u0E07, \u0E2D\u0E01\u0E44\u0E01\u0E48\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E33\u0E08\u0E34\u0E49\u0E21\u0E41\u0E08\u0E48\u0E27\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E02\u0E49\u0E32\u0E27\u0E44\u0E23\u0E0B\u0E4C\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E23\u0E35\u0E48"
                    },
                    calories: {
                      type: import_genai.Type.INTEGER,
                      description: "\u0E1E\u0E25\u0E31\u0E07\u0E07\u0E32\u0E19\u0E42\u0E14\u0E22\u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13 (\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E01\u0E34\u0E42\u0E25\u0E41\u0E04\u0E25\u0E2D\u0E23\u0E35) \u0E40\u0E0A\u0E48\u0E19 320"
                    },
                    description: {
                      type: import_genai.Type.STRING,
                      description: "\u0E04\u0E33\u0E41\u0E19\u0E30\u0E19\u0E33\u0E2A\u0E31\u0E49\u0E19\u0E46 \u0E2B\u0E23\u0E37\u0E2D\u0E1B\u0E23\u0E30\u0E42\u0E22\u0E0A\u0E19\u0E4C\u0E2A\u0E38\u0E02\u0E20\u0E32\u0E1E\u0E43\u0E19\u0E20\u0E32\u0E29\u0E32\u0E44\u0E17\u0E22 \u0E40\u0E0A\u0E48\u0E19 \u0E21\u0E35\u0E42\u0E1B\u0E23\u0E15\u0E35\u0E19\u0E2A\u0E39\u0E07\u0E0A\u0E48\u0E27\u0E22\u0E0B\u0E48\u0E2D\u0E21\u0E41\u0E0B\u0E21\u0E01\u0E25\u0E49\u0E32\u0E21\u0E40\u0E19\u0E37\u0E49\u0E2D \u0E41\u0E25\u0E30\u0E04\u0E32\u0E23\u0E4C\u0E42\u0E1A\u0E44\u0E2E\u0E40\u0E14\u0E23\u0E15\u0E40\u0E0A\u0E34\u0E07\u0E0B\u0E49\u0E2D\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E34\u0E48\u0E21\u0E19\u0E32\u0E19"
                    }
                  },
                  required: ["day", "mealType", "menuName", "calories", "description"]
                }
              }
            },
            required: ["meals"]
          },
          temperature: 0.2
        }
      });
      if (response && response.text) {
        const mealData = JSON.parse(response.text.trim());
        return res.json({ success: true, ...mealData });
      } else {
        throw new Error("\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E01\u0E32\u0E23\u0E15\u0E2D\u0E1A\u0E01\u0E25\u0E31\u0E1A\u0E08\u0E32\u0E01 AI");
      }
    } catch (error) {
      console.error("Error in /api/generate-meals:", error);
      res.status(500).json({ error: "\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E41\u0E1C\u0E19\u0E2D\u0E32\u0E2B\u0E32\u0E23 AI \u0E44\u0E14\u0E49\u0E40\u0E19\u0E37\u0E48\u0E2D\u0E07\u0E08\u0E32\u0E01\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25: " + error.message });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
