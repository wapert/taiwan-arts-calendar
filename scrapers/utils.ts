import axios, { AxiosRequestConfig } from 'axios';

const BASE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
  'Accept-Language': 'zh-TW,zh;q=0.9',
};

async function retry<T>(fn: (attempt: number) => Promise<T>, retries = 3): Promise<T> {
  for (let i = 1; i <= retries; i++) {
    try {
      return await fn(i);
    } catch (err) {
      if (i === retries) throw err;
      const wait = 2000 * i;
      console.warn(`  Attempt ${i} failed (${(err as Error).message}), retrying in ${wait}ms…`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw new Error('unreachable');
}

export function get(url: string, extra: AxiosRequestConfig = {}): Promise<string> {
  return retry((attempt) =>
    axios.get<string>(url, {
      ...extra,
      headers: { ...BASE_HEADERS, ...(extra.headers ?? {}) },
      timeout: 15000 * attempt,
    }).then((r) => r.data)
  );
}

export function post(url: string, body: string, extra: AxiosRequestConfig = {}): Promise<string> {
  return retry((attempt) =>
    axios.post<string>(url, body, {
      ...extra,
      headers: {
        ...BASE_HEADERS,
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(extra.headers ?? {}),
      },
      timeout: 15000 * attempt,
    }).then((r) => r.data)
  );
}

export function getJson<T = unknown>(url: string, extra: AxiosRequestConfig = {}): Promise<T> {
  return retry((attempt) =>
    axios.get<T>(url, {
      ...extra,
      headers: { ...BASE_HEADERS, ...(extra.headers ?? {}) },
      timeout: 15000 * attempt,
    }).then((r) => r.data)
  );
}

export function postJson<T = unknown>(url: string, body: unknown, extra: AxiosRequestConfig = {}): Promise<T> {
  return retry((attempt) =>
    axios.post<T>(url, body, {
      ...extra,
      headers: {
        ...BASE_HEADERS,
        'Content-Type': 'application/json',
        ...(extra.headers ?? {}),
      },
      timeout: 15000 * attempt,
    }).then((r) => r.data)
  );
}
