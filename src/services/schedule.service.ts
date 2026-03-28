import { apiClient } from "@/lib/api-client";
import { BaseService } from "./base.service";

/** Schedule event as returned by the backend */
export interface ScheduleEventDTO {
  id: string;
  title: string;
  courseId?: string;
  startTime: string;
  endTime: string;
  type: "video" | "livestream" | "hybrid";
  status: "completed" | "ongoing" | "upcoming";
  meetingUrl?: string;
  teacher?: string;
  location?: string;
  description?: string;
  tag?: string;
  participants?: number;
  /** RRULE string e.g. "FREQ=WEEKLY;BYDAY=MO,WE" */
  recurrenceRule?: string;
}

export interface CreateScheduleEventDTO {
  title: string;
  courseId?: string;
  startTime: string;
  endTime: string;
  type: "video" | "livestream" | "hybrid";
  location?: string;
  meetingUrl?: string;
  description?: string;
  recurrenceRule?: string;
}

export interface UpdateScheduleEventDTO extends Partial<CreateScheduleEventDTO> {
  /** Whether to update only this occurrence or all recurring events */
  updateMode?: "single" | "all";
}

class ScheduleService extends BaseService<ScheduleEventDTO> {
  constructor() {
    super("/schedule/events");
  }

  /** Fetch events within a date range */
  async getByRange(startDate: string, endDate: string): Promise<ScheduleEventDTO[]> {
    return apiClient.get<ScheduleEventDTO[]>(this.endpoint, {
      params: { startDate, endDate } as Record<string, string>,
    });
  }

  /** Move event to new time slot (drag & drop) */
  async reschedule(
    id: string,
    startTime: string,
    endTime: string
  ): Promise<ScheduleEventDTO> {
    return apiClient.patch<ScheduleEventDTO>(`${this.endpoint}/${id}/reschedule`, {
      startTime,
      endTime,
    });
  }
}

export const scheduleService = new ScheduleService();
