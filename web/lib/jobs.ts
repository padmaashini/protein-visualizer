import { authHeaders } from "@/lib/auth";

export type JobStatus = "pending" | "running" | "completed" | "failed";

export type VisualizationJob = {
  id: number;
  name: string;
  model: string;
  sequence: string;
  status: JobStatus;
  pdb_data: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateJobInput = {
  name: string;
  model: string;
  sequence: string;
};

async function parseError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (body && typeof body.error === "string") return body.error;
  } catch {
    // fall through to status text
  }
  return response.statusText || "Request failed";
}

export async function listJobs(): Promise<VisualizationJob[]> {
  const response = await fetch("/api/visualization_jobs", {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json();
}

export async function createJob(
  input: CreateJobInput,
): Promise<VisualizationJob> {
  const response = await fetch("/api/visualization_job", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json();
}

export async function deleteJob(id: number): Promise<void> {
  const response = await fetch(`/api/visualization_job/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(await parseError(response));
}
