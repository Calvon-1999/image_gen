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

    // Kick off the job
    const submission = await fal.subscribe("workflows/0xmpf/api2", {
      input: { finetune_id, prompt, finetune_strength, output_format },
      logs: false,
      onQueueUpdate: () => {}, // you can also log progress here
    });

    // 🔑 submission contains request_id
    res.json({
      request_id: submission.request_id, // <-- this is what you want
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
