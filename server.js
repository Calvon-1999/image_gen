import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fal } from "@fal-ai/client";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Configure FAL with your API key
fal.config({
  credentials: process.env.FAL_KEY,
});

app.get("/", (req, res) => {
  res.send({ status: "FAL Proxy Server is running" });
});

app.post("/generate", async (req, res) => {
  try {
    const {
      prompt,
      finetune_id = "2b62d438-bd0e-4487-b86a-dac629bab6e0",
      finetune_strength = 1,
      output_format = "png"
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const stream = await fal.stream("workflows/0xmpf/api2", {
      input: {
        finetune_id,
        prompt,
        finetune_strength,
        output_format
      }
    });

    // Wait for the job to finish
    const finalResult = await stream.done();

    // Send final output JSON back to n8n
    res.json({
      success: true,
      prompt,
      output: finalResult.output || finalResult
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
