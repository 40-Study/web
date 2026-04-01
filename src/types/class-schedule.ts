/**
 * Class schedule type definitions
 */

export interface ClassSchedule {
  id: string;
  class_id: string;
  title?: string;
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  start_time: string;  // HH:mm
  end_time: string;    // HH:mm
  room?: string;
  teacher_id?: string;
  teacher_name?: string;
  start_date?: string; // ISO date
  end_date?: string;   // ISO date
  created_at: string;
  updated_at: string;
}

export interface CreateClassScheduleDTO {
  class_id: string;
  title?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room?: string;
  teacher_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface UpdateClassScheduleDTO extends Partial<Omit<CreateClassScheduleDTO, "class_id">> {}

export interface ClassScheduleFilters {
  class_id?: string;
  teacher_id?: string;
  start_date?: string;
  end_date?: string;
}
