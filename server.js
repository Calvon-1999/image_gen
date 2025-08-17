// server.js
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { fal } from "@fal-ai/client";
import fetch, { Headers, Request, Response } from "node-fetch";

// Polyfill fetch for Node
if (!global.fetch) {
  global.fetch = fetch;
  global.Headers = Headers;
  global.Request = Request;
  global.Response = Response;
}

const app = express();
app.use(cors());
app.use(bodyParser.json());

// FAL setup
fal.config({
  credentials: process.env.FAL_KEY, // Railway ENV variable
});

// --- ROUTES ---

app.post("/generate", async (req, res) => {
  try {
    const {
      prompt,
      finetune_id = "2b62d438-bd0e-4487-b86a-dac629bab6e0",
      finetune_strength = 1,
      output_format = "png",
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    console.log("🐧 Starting generation with prompt:", prompt);

    // Start streaming job
    const stream = await fal.stream("workflows/0xmpf/api2", {
      input: { finetune_id, prompt, finetune_strength, output_format },
    });

    // Log every stream event (debugging)
    for await (const event of stream) {
      console.log("📨 Stream event:", JSON.stringify(event, null, 2));
    }

    console.log("🔄 Finalizing generation...");
    const result = await stream.done();

    console.log("✅ Generation complete!");
    console.log("🖼️ Result:", JSON.stringify(result, null, 2));

    // ✅ Return the full Fal result directly (so n8n sees prompt, seed, etc.)
    res.json(result);

  } catch (err) {
    console.error("❌ Error in /generate:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
