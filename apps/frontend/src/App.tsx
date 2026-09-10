
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { useRef, useState } from "react";
import axios from "axios";
import "./index.css";

const BACKEND_URL = "http://localhost:3000";

interface Job {
  id: string;
  filename: string;
  status: "queued" | "processing" | "done" | "failed";
  totalRows: number | null;
  processedRows: number;
  errorCount: number;
}

export function App() {
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  const urlRef = useRef<HTMLInputElement>(null);

  // Fetches the raw CSV text from a given URL
  async function fetchCsvFromUrl(url: string): Promise<string> {
    const response = await axios.get(url, { responseType: "text" });
    return response.data;
  }

  async function pollBackend(jobId: string) {
    const response = await axios.get<Job>(`${BACKEND_URL}/jobs/${jobId}`);
    const job = response.data;

    if (job.status === "done") {
      setStatus("done");
      setProgress(`${job.processedRows} / ${job.totalRows} rows processed`);
    } else if (job.status === "failed") {
      setStatus("failed");
      setError("Job failed while processing.");
    } else {
      // still "queued" or "processing" — keep polling
      setStatus(job.status);
      setProgress(
        job.totalRows
          ? `${job.processedRows} / ${job.totalRows} rows`
          : "starting..."
      );
      setTimeout(() => pollBackend(jobId), 1000);
    }
  }

  async function handleSubmit() {
    const url = urlRef.current?.value.trim();
    if (!url) {
      setError("Please enter a CSV URL");
      return;
    }

    setError("");
    setProgress("");
    setStatus("fetching csv...");

    try {
      const csv = await fetchCsvFromUrl(url);

      setStatus("uploading...");
      const response = await axios.post(`${BACKEND_URL}/csv`, { csv });

      setStatus("queued");
      pollBackend(response.data.jobId);
    } catch (err) {
      setError("Failed to fetch or upload CSV. Check the URL and CORS settings.");
      setStatus("");
    }
  }

  return (
    <div className="flex">
      <div className="flex-6 min-h-screen bg-cyan-200">
        <div className="flex flex-col items-center justify-center h-screen overflow-scroll m-4">
          <Input
            ref={urlRef}
            type="url"
            placeholder="Enter csv url..."
            className="overflow-scroll p-4 border-2 border-green-100 rounded-2xl bg-amber-100"
          />
          <Button
            variant="outline"
            className="mt-4 p-4 border-2 rounded-2xl bg-amber-200"
            onClick={handleSubmit}
          >
            Submit
          </Button>
        </div>
      </div>

      <div className="flex-4 min-h-screen bg-indigo-300">
        <div className="whitespace-pre-wrap p-2 m-3 border-s-2 rounded-3xl border-accent-foreground">
          <div>Status: {status}</div>
          <div>{progress}</div>
          {error && <div className="text-red-600">{error}</div>}
        </div>
      </div>
    </div>
  );
}

export default App;