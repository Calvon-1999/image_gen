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

    // Submit job to FAL
    const submission = await fal.subscribe("workflows/0xmpf/api2", {
      input: { finetune_id, prompt, finetune_strength, output_format },
      logs: false,
      onQueueUpdate: () => {},
    });

    // ✅ Always return request_id
    res.json({
      request_id: submission.request_id,
      status: "submitted"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});
