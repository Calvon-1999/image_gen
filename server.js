// server.js
import express from "express";
import bodyParser from "body-parser";
import { fal } from "@fal-ai/client";

const app = express();
app.use(bodyParser.json());

// FAL setup
fal.config({
  credentials: process.env.FAL_KEY, // Railway will store this in ENV
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

    // Start the job with stream
    const stream = await fal.stream("workflows/0xmpf/api2", {
      input: { finetune_id, prompt, finetune_strength, output_format },
    });

    let requestId = null;

    // Grab the first event with request_id
    for await (const event of stream) {
      if (event.type === "submit") {
        requestId = event.request_id;
        break;
      }
    }

    if (!requestId) {
      return res.status(500).json({ error: "No request_id returned from FAL" });
    }

    res.json({
      request_id: requestId,
      status: "submitted"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// Check job status
app.get("/status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await fal.get(`requests/${id}`);

    res.json({
      request_id: id,
      status: result.status,
      output: result.output || null,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
