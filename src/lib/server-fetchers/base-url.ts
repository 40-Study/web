import { DEFAULT_API_BASE_URL } from "@/lib/default-backend-url";

export function getPublicApiBaseUrl(): string {
  const backendUrl = process.env.BACKEND_URL?.replace(/\/$/, "");
  if (backendUrl) {
    return backendUrl.endsWith("/api") ? backendUrl : `${backendUrl}/api`;
  }

  const publicApiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (publicApiUrl?.startsWith("http://") || publicApiUrl?.startsWith("https://")) {
    return publicApiUrl;
  }

  return DEFAULT_API_BASE_URL;
}
