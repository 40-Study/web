const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:5000/api';

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
  roles?: { id: string; type: string; role_name: string; display_name: string }[];
  access_token?: string;
  refresh_token?: string;
  user?: User;
  active_role?: { id: string; type: string; role_name: string; display_name: string };
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
    // Step 2: Select first role.
    //
    // `select-role` LUÔN trả `completed: true` (`completeLoginUnified` phía
    // backend), nên đăng nhập kết thúc ở đây.
    //
    // Vòng 4: bước gọi `select-org` đã bị XOÁ — nó là code chết (điều kiện
    // `!profileData.completed` không bao giờ đúng), gửi `session_token` mà
    // backend đã bỏ khỏi DTO, và nhánh `else if` gọi `select-org` KHÔNG kèm
    // `organization_id` — tức yêu cầu chuyển về "Độc lập". Chỉ cần một thay đổi
    // khiến `completed` có lúc bằng `false` là nhánh đó âm thầm xoá `active_org`
    // của người vừa đăng nhập. Đổi tổ chức, nếu cần, phải là một hành động SAU
    // đăng nhập (gọi khi đã có cookie, kèm `organization_id`), không phải một
    // bước trong luồng login.
    if (!data.session_token || !data.roles?.length) {
      throw new Error('No session token or roles available');
    }

    const firstRole = data.roles[0];
    await request<LoginResponse>('/auth/select-role', {
      method: 'POST',
      body: JSON.stringify({
        session_token: data.session_token,
        role_id: firstRole.id,
        role_type: firstRole.type,
      }),
    });
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
