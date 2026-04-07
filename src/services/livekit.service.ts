/**
 * LiveKit service — token generation and room management
 * Endpoints: /livekit/token, /livekit/rooms
 */

import { api } from "@/lib/api-client";

export interface LiveKitToken {
  token: string;
  room_name: string;
  participant_name: string;
}

export interface LiveKitRoom {
  name: string;
  sid: string;
  num_participants: number;
  max_participants?: number;
  creation_time: number;
  active_recording: boolean;
  metadata?: string;
}

export interface CreateLiveKitRoomDTO {
  name: string;
  max_participants?: number;
  empty_timeout?: number;
  metadata?: string;
}

export const livekitService = {
  /** GET /livekit/token?room=...&participant=... */
  getToken: (roomName: string, participantName: string) =>
    api
      .get<{ data: LiveKitToken }>("/livekit/token", {
        params: { room: roomName, participant: participantName },
      })
      .then((r) => r.data.data),

  /** POST /livekit/rooms */
  createRoom: (data: CreateLiveKitRoomDTO) =>
    api
      .post<{ data: LiveKitRoom }>("/livekit/rooms", data)
      .then((r) => r.data.data),

  /** GET /livekit/rooms/:name */
  getRoomInfo: (name: string) =>
    api
      .get<{ data: LiveKitRoom }>(`/livekit/rooms/${name}`)
      .then((r) => r.data.data),
};
