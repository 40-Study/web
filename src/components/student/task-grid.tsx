"use client";

import { DeadlineCard } from "./deadline-card";
import { LiveClassCard } from "./live-class-card";
import type { DeadlineTask, LiveClass } from "@/lib/mock-data/student-dashboard";

interface TaskGridProps {
  deadline: DeadlineTask;
  liveClass: LiveClass;
}

export function TaskGrid({ deadline, liveClass }: TaskGridProps) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <DeadlineCard task={deadline} />
      <LiveClassCard liveClass={liveClass} />
    </div>
  );
}
