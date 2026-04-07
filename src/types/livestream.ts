/**
 * Livestream type definitions
 */

export interface Livestream {
  id: string;
  title: string;
  description?: string;
  class_id: string;
  host_id: string;
  room_name: string;
  status: "scheduled" | "live" | "ended";
  scheduled_at?: string;
  started_at?: string;
  ended_at?: string;
  participant_count: number;
  created_at: string;
  updated_at: string;
}

export interface LivestreamToken {
  token: string;
  room_name: string;
  participant_name: string;
  expires_at: string;
}

export interface CreateLivestreamDTO {
  title: string;
  description?: string;
  class_id: string;
  scheduled_at?: string;
}

export interface UpdateLivestreamDTO {
  title?: string;
  description?: string;
  scheduled_at?: string;
}
