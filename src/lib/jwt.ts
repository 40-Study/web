/**
 * JWT utilities
 */

interface JWTPayload {
  user_id?: string;
  device_id?: string;
  active_role?: string;
  exp?: number;
  iat?: number;
}

/**
 * Decode JWT token payload (without verification)
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Get active role from JWT token
 */
export function getRoleFromToken(token: string): string | null {
  const payload = decodeJWT(token);
  return payload?.active_role || null;
}
