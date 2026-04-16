import { api } from "@/lib/api-client";

export interface PersonalEvent {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  color?: string;
  location?: string;
  is_all_day: boolean;
  reminder_minutes?: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePersonalEventDTO {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  color?: string;
  location?: string;
  is_all_day?: boolean;
  reminder_minutes?: number;
}

type R<T> = { message: string; data: T };

export const personalEventService = {
  create: (data: CreatePersonalEventDTO) =>
    api.post<R<PersonalEvent>>("/me/events", data).then((r) => r.data.data),

  list: (start: string, end: string) =>
    api.get<R<PersonalEvent[]>>("/me/events", { params: { start, end } }).then((r) => r.data.data),

  update: (id: string, data: Partial<CreatePersonalEventDTO>) =>
    api.put<R<PersonalEvent>>(`/me/events/${id}`, data).then((r) => r.data.data),

  delete: (id: string) =>
    api.delete(`/me/events/${id}`).then((r) => r.data),
};
