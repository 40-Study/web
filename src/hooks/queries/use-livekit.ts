/**
 * React Query hooks for LiveKit token and room management
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { livekitService } from "@/services/livekit.service";
import type { CreateLiveKitRoomDTO } from "@/services/livekit.service";

export const livekitKeys = {
  all: ["livekit"] as const,
  token: (roomName: string, participantName: string) =>
    [...livekitKeys.all, "token", roomName, participantName] as const,
  room: (name: string) => [...livekitKeys.all, "room", name] as const,
};

export function useLiveKitToken(roomName: string, participantName: string) {
  return useQuery({
    queryKey: livekitKeys.token(roomName, participantName),
    queryFn: () => livekitService.getToken(roomName, participantName),
    enabled: !!roomName && !!participantName,
    staleTime: 5 * 60 * 1000, // tokens valid 5 minutes
  });
}

export function useLiveKitRoomInfo(name: string) {
  return useQuery({
    queryKey: livekitKeys.room(name),
    queryFn: () => livekitService.getRoomInfo(name),
    enabled: !!name,
  });
}

export function useCreateLiveKitRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLiveKitRoomDTO) => livekitService.createRoom(data),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: livekitKeys.room(result.name) });
      toast.success("Tạo phòng thành công");
    },
    onError: () => toast.error("Không thể tạo phòng"),
  });
}
