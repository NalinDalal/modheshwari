// Centralized API fetch helper — attaches Authorization header from localStorage at call time
export type ApiFetchOptions = RequestInit & { retryOn401?: boolean };

const getToken = () => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("token");
  } catch (_e) {
    return null;
  }
};

async function parseJsonSafe(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch (_e) {
    return text;
  }
}

export async function apiFetch(input: RequestInfo, init?: ApiFetchOptions) {
  const headers = new Headers(init?.headers as HeadersInit || {});

  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  // If body looks like JSON and no content-type set, set it
  if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(input, { ...init, headers });
  const data = await parseJsonSafe(res);

  if (!res.ok) {
    const err: any = new Error((data && data.message) || res.statusText || "Request failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const apiGet = (url: string, opts?: ApiFetchOptions) => apiFetch(url, { ...opts, method: "GET" });
export const apiPost = (url: string, body?: any, opts?: ApiFetchOptions) => apiFetch(url, { ...opts, method: "POST", body: body && typeof body === "string" ? body : JSON.stringify(body), });
export const apiPut = (url: string, body?: any, opts?: ApiFetchOptions) => apiFetch(url, { ...opts, method: "PUT", body: body && typeof body === "string" ? body : JSON.stringify(body), });
export const apiDelete = (url: string, opts?: ApiFetchOptions) => apiFetch(url, { ...opts, method: "DELETE" });

export default apiFetch;
