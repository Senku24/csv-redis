import { db } from "@repo/db";
import express from "express";
import { createClient } from "redis";
import cors from "cors";
import { randomUUID } from "node:crypto";


const app = express();
const redis = createClient();
redis.connect();

app.use(cors());
app.use(express.json());

app.post("/csv", async (req, res) => {
  const { csv } = req.body ?? {};;

  if (!csv) {
    return res.status(402).json({ error: "CSV data is required" });
  }
  const job = await db.orm.public.Job.create({
    id: randomUUID(), filename: "", status: "queued"
  });
  await redis.lPush("csv_data", JSON.stringify({ jobId: job.id, csv }));

  res.json({ jobId: job.id, message: "CSV data queued for processing" });
});



app.get("/jobs/:id", async (req, res) => {
  const job = await db.orm.public.Job.where({ id: req.params.id }).first();
  if (!job) return res.status(404).json({ error: "not found" });
  res.json(job);
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});