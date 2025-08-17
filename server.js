import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fal } from "@fal-ai/client";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

fal.config({
  credentials: process.env.FAL_KEY,
});

// Health check
app.get("/", (req, res) => {
  res.send({ status: "FAL Proxy Server is running" });
});

// 1. Start a new generation job
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

    // Submit the job (non-streaming)
    const submission = await fal.subscribe("workflows/0xmpf/api2", {
      input: { finetune_id, prompt, finetune_strength, output_format },
      logs: false, // we don’t stream logs here
      onQueueUpdate: () => {},
    });

    res.json({
      request_id: submission.request_id,
      status: "submitted"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// 2. Poll job status by request_id
app.get("/status/:id", async (req, res) => {
  try {
    const requestId = req.params.id;
    if (!requestId) {
      return res.status(400).json({ error: "Missing request_id" });
    }

    const job = await fal.jobs.get(requestId);
    res.json(job);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
