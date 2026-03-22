const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

export interface User {
  id: string;
  email: string;
  username: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
}

interface LoginData {
  completed: boolean;
  session_token?: string;
  system_roles?: { id: string; name: string }[];
  requires_org_selection?: boolean;
  organizations?: { id: string; name: string }[];
  access_token?: string;
  refresh_token?: string;
  user?: User;
  active_role?: { id: string; name: string };
}

interface LoginResponse {
  message: string;
  data: LoginData;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message ?? error.error ?? `HTTP ${res.status}`);
  }

  return res.json();
}

export async function login(email: string, password: string): Promise<void> {
  // Step 1: Login
  const loginRes = await request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      device_info: {
        device_id: crypto.randomUUID(),
        device_name: navigator.userAgent.includes('Mobile') ? 'Mobile Browser' : 'Chrome Browser',
        os: navigator.platform ?? 'Unknown',
        app_version: '1.0.0',
        user_agent: navigator.userAgent,
      },
    }),
  });

  const data = loginRes.data;

  if (!data.completed) {
    // Step 2: Select first profile (role)
    if (!data.session_token || !data.system_roles?.length) {
      throw new Error('No session token or roles available');
    }

    const profileRes = await request<LoginResponse>('/auth/select-profile', {
      method: 'POST',
      body: JSON.stringify({
        session_token: data.session_token,
        system_role_id: data.system_roles[0].id,
      }),
    });

    const profileData = profileRes.data;

    if (!profileData.completed) {
      // Step 3: Select first org (or none)
      if (profileData.requires_org_selection && profileData.organizations?.length) {
        await request<LoginResponse>('/auth/select-org', {
          method: 'POST',
          body: JSON.stringify({
            session_token: profileData.session_token,
            organization_id: profileData.organizations[0].id,
          }),
        });
      } else if (profileData.session_token) {
        await request<LoginResponse>('/auth/select-org', {
          method: 'POST',
          body: JSON.stringify({
            session_token: profileData.session_token,
          }),
        });
      }
    }
  }

  // Cookies are set by the backend via Set-Cookie headers automatically
  // No need to store anything manually
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // Ignore errors on logout
  }
}

export async function getMe(): Promise<User> {
  const res = await fetch(`${API_URL}/auth/me`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Not authenticated');
  const data = await res.json();
  return data.data;
}
