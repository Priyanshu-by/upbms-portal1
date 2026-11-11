export function authHeaders(session) {
  const headers = {};
  if (session?.adminPin) headers["X-Admin-Pin"] = session.adminPin;
  else if (session?.memberId && session?.memberPass) {
    headers["X-Member-Id"] = session.memberId;
    headers["X-Member-Pass"] = encodeURIComponent(session.memberPass);
  }
  return headers;
}

export async function api(path, { method = "GET", body, session, raw } = {}) {
  const headers = { ...authHeaders(session) };
  const opts = { method, headers };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(path, opts);
  if (raw) return res;
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export async function uploadFile(file, session) {
  const dataUrl = await fileToDataUrl(file);
  const data = await api("/api/upload", { method: "POST", session, body: { filename: file.name, dataUrl } });
  return data.url;
}
