import { useRef, useState } from "react";
import axios from "axios";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Database,
  FileUp,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
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
      setError("The job could not be completed. Please try again.");
    } else {
      setStatus(job.status);
      setProgress(job.totalRows ? `${job.processedRows} / ${job.totalRows} rows processed` : "Preparing your data...");
      setTimeout(() => pollBackend(jobId), 1000);
    }
  }

  async function handleSubmit() {
    const url = urlRef.current?.value.trim();
    if (!url) {
      setError("Please enter a CSV URL to continue.");
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
    } catch {
      setError("We couldn’t fetch or upload that CSV. Check the URL and try again.");
      setStatus("");
    }
  }

  const isWorking = Boolean(status) && status !== "done" && status !== "failed";
  const isDone = status === "done";

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm"><Database className="size-[18px]" /></div>
            <span className="text-[15px] font-semibold tracking-tight">CSV Redis</span>
          </div>
          <div className="hidden items-center gap-2 text-xs font-medium text-slate-500 sm:flex"><ShieldCheck className="size-4 text-emerald-600" /> Fast, reliable processing</div>
        </header>

        <section className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-24 lg:py-20">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm"><span className="size-1.5 rounded-full bg-emerald-500" /> CSV processing, simplified</div>
            <h1 className="max-w-xl text-4xl font-semibold leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-5xl">Turn a CSV link into clean, usable data.</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-500">Paste a public CSV URL and we’ll take care of fetching, processing, and storing it for you.</p>

            <div className="mt-9 max-w-xl rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_14px_40px_-24px_rgba(15,23,42,0.35)]">
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <ArrowUpRight className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input ref={urlRef} type="url" placeholder="https://example.com/data.csv" aria-label="CSV URL" className="h-12 rounded-xl border-0 bg-slate-50 pl-10 text-sm shadow-none focus-visible:ring-2 focus-visible:ring-slate-200" onKeyDown={(event) => { if (event.key === "Enter") handleSubmit(); }} />
                </div>
                <Button className="h-12 rounded-xl bg-slate-950 px-5 text-sm hover:bg-slate-800" onClick={handleSubmit} disabled={isWorking}><FileUp className="size-4" />{isWorking ? "Processing" : "Process CSV"}</Button>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">The URL must be publicly accessible and point to a CSV file.</p>
            {error && <p className="mt-4 flex items-center gap-2 text-sm font-medium text-red-600" role="alert"><AlertCircle className="size-4" />{error}</p>}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.4)] sm:p-8">
            <div className="flex items-start justify-between">
              <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Job status</p><h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">Your latest import</h2></div>
              <div className={`flex size-10 items-center justify-center rounded-xl ${isDone ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>{isDone ? <CheckCircle2 className="size-5" /> : <Database className="size-5" />}</div>
            </div>

            <div className="mt-8 rounded-2xl bg-slate-50 p-5">
              {!status ? <div className="py-5 text-center"><div className="mx-auto flex size-11 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm"><FileUp className="size-5" /></div><p className="mt-3 text-sm font-medium text-slate-700">Nothing processed yet</p><p className="mt-1 text-xs text-slate-400">Your import progress will appear here.</p></div> : <div><div className="flex items-center gap-3">{isWorking ? <Loader2 className="size-5 animate-spin text-slate-600" /> : isDone ? <CheckCircle2 className="size-5 text-emerald-600" /> : <AlertCircle className="size-5 text-red-500" />}<span className="text-sm font-semibold capitalize text-slate-800">{status.replace(" csv", " CSV")}</span></div><p className="mt-4 text-sm leading-6 text-slate-500">{progress || (isDone ? "Your CSV is ready." : "Working on your import...")}</p>{isWorking && <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full w-2/5 animate-pulse rounded-full bg-slate-800" /></div>}</div>}
            </div>
            <p className="mt-5 text-center text-xs text-slate-400">Processing happens securely in the background.</p>
          </div>
        </section>

        <footer className="flex items-center justify-between border-t border-slate-200 pt-5 text-xs text-slate-400"><span>CSV Redis</span><span>Simple data infrastructure</span></footer>
      </div>
    </main>
  );
}

export default App;
