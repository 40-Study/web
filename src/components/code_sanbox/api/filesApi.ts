// ─── MinIO file-storage API ───────────────────────────────────────────────────
const BASE_URL   = process.env.NEXT_PUBLIC_MINIO_API_URL ?? "https://your-minio-api.example.com";
const AUTH_TOKEN = `Bearer ${process.env.NEXT_PUBLIC_MINIO_TOKEN ?? "YOUR_TOKEN_HERE"}`;

function headers(extra: Record<string, string> = {}): Record<string, string> {
  return { Authorization: AUTH_TOKEN, ...extra };
}

export async function apiListFiles(prefix = ""): Promise<any[]> {
  const res = await fetch(
    `${BASE_URL}/files?prefix=${encodeURIComponent(prefix)}`,
    { headers: headers() },
  );
  if (!res.ok) throw new Error("Failed to list files");
  return res.json();
}

export async function apiGetFile(path: string): Promise<string> {
  const res = await fetch(
    `${BASE_URL}/files/${encodeURIComponent(path)}`,
    { headers: headers() },
  );
  if (!res.ok) throw new Error("Failed to get file");
  return res.text();
}

export async function apiSaveFile(path: string, content: string): Promise<void> {
  const res = await fetch(
    `${BASE_URL}/files/${encodeURIComponent(path)}`,
    {
      method: "PUT",
      headers: headers({ "Content-Type": "text/plain" }),
      body: content,
    },
  );
  if (!res.ok) throw new Error("Failed to save file");
}

export async function apiCreateFile(path: string, content = ""): Promise<void> {
  const res = await fetch(
    `${BASE_URL}/files/${encodeURIComponent(path)}`,
    {
      method: "PUT",
      headers: headers({ "Content-Type": "text/plain" }),
      body: content,
    },
  );
  if (!res.ok) throw new Error("Failed to create file");
}

export async function apiCreateFolder(path: string): Promise<void> {
  const res = await fetch(
    `${BASE_URL}/folders/${encodeURIComponent(path)}`,
    { method: "POST", headers: headers() },
  );
  if (!res.ok) throw new Error("Failed to create folder");
}

export async function apiRenameItem(oldPath: string, newPath: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/files/rename`, {
    method: "POST",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({ from: oldPath, to: newPath }),
  });
  if (!res.ok) throw new Error("Failed to rename");
}

export async function apiDeleteItem(path: string): Promise<void> {
  const res = await fetch(
    `${BASE_URL}/files/${encodeURIComponent(path)}`,
    { method: "DELETE", headers: headers() },
  );
  if (!res.ok) throw new Error("Failed to delete");
}
