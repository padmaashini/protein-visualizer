export type AuthUser = {
  id: number;
  email: string;
  name: string | null;
  picture: string | null;
  created_at: string | null;
};

const TOKEN_KEY = "naturefold_token";
const ANON_ID_KEY = "naturefold_anon_id";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

/** Stable per-browser identifier used to scope anonymous (signed-out) jobs. */
export function getAnonId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(ANON_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(ANON_ID_KEY, id);
  }
  return id;
}

export function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const anonId = getAnonId();
  if (anonId) headers["X-Anonymous-Id"] = anonId;
  return headers;
}

async function parseError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (body && typeof body.error === "string") return body.error;
  } catch {
    // fall through to status text
  }
  return response.statusText || "Request failed";
}

export async function googleSignIn(
  credential: string,
): Promise<{ token: string; user: AuthUser }> {
  const response = await fetch("/api/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json();
}

export async function fetchMe(): Promise<AuthUser> {
  const response = await fetch("/api/auth/me", {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json();
}
