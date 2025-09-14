export type HttpOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
};

async function parseJsonSafe<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    // fallback if empty or not json
    return text as unknown as T;
  }
}

export async function http<T = any>(url: string, options: HttpOptions = {}): Promise<T> {
  const { method = 'GET', headers, body } = options;
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  if (!res.ok) {
    const err = await parseJsonSafe<any>(res).catch(() => undefined);
    const message = (err && (err.error || err.message)) || `HTTP ${res.status}`;
    throw new Error(message);
  }
  return parseJsonSafe<T>(res);
}

export const api = {
  get: <T>(url: string) => http<T>(url, { method: 'GET' }),
  post: <T>(url: string, body: any) => http<T>(url, { method: 'POST', body }),
  put: <T>(url: string, body: any) => http<T>(url, { method: 'PUT', body }),
  delete: <T>(url: string) => http<T>(url, { method: 'DELETE' }),
};
