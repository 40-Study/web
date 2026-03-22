export interface LivestreamSession {
  id: string;
  title: string;
  description: string;
  host_id: string;
  room_name: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  started_at?: string;
  ended_at?: string;
  max_viewers: number;
  is_recorded: boolean;
  settings: string;
  created_at: string;
}

export interface LivestreamList {
  data: LivestreamSession[];
  total: number;
  page: number;
  page_size: number;
}

export interface JoinResponse {
  message: string;
  data: {
    id: string;
    session_id: string;
    user_id: string;
    role: string;
    joined_at: string;
    is_active: boolean;
    token: string;
    server_url: string;
    room_name: string;
  };
}

export interface CreateLivestream {
  title: string;
  description?: string;
  host_id: string;
  max_viewers?: number;
  is_recorded?: boolean;
}
