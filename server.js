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
    const { prompt, finetune_id, finetune_strength = 1, output_format = "png" } = req.body;

    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    console.log("🐧 Starting generation with prompt:", prompt);

    const stream = await fal.stream("workflows/0xmpf/api2", {
      input: { finetune_id, prompt, finetune_strength, output_format },
    });

    let completionEvent = null;

    for await (const event of stream) {
      console.log("📨 Stream event:", JSON.stringify(event, null, 2));

      // Capture the full completion event from flux-pro
      if (event.type === "completion" && event.node_id === "flux_1_pro_ultra_finetuned") {
        completionEvent = event;
      }
    }

    console.log("🔄 Finalizing generation...");
    await stream.done();

    if (!completionEvent) {
      return res.status(500).json({ error: "No completion event received" });
    }

    console.log("✅ Generation complete!");
    console.log("🖼️ Completion Event:", JSON.stringify(completionEvent, null, 2));

    // Return the full completion event exactly like local logs
    res.json(completionEvent);

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
