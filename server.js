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

// Submit generation job
app.post("/generate", async (req, res) => {
  try {
    const {
      prompt,
      finetune_id = "2b62d438-bd0e-4487-b86a-dac629bab6e0",
      finetune_strength = 1,
      output_format = "png"
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    // Kick off the job (subscribe = async queue handling)
    const submission = await fal.subscribe("workflows/0xmpf/api2", {
      input: { finetune_id, prompt, finetune_strength, output_format },
      logs: false,
      onQueueUpdate: () => {},
    });

    res.json({
      request_id: submission.request_id,
      status: "submitted"
    });

  } catch (err) {
    console.error("❌ Error in /generate:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// Check job status
app.get("/status/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const response = await fetch(`https://fal.run/requests/${id}`, {
      headers: {
        "Authorization": `Key ${process.env.FAL_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FAL API error: ${errorText}`);
    }

    const result = await response.json();

    res.json({
      request_id: id,
      status: result.status,
      output: result.output || null,
    });
  } catch (err) {
    console.error("❌ Error in /status:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
