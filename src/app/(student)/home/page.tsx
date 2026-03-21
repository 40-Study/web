import {
  ResumeBanner,
  TaskGrid,
  CourseCarousel,
} from "@/components/student";
import {
  mockCurrentCourse,
  mockDeadlineTask,
  mockLiveClass,
  mockRecommendedCourses,
} from "@/lib/mock-data/student-dashboard";

export default function StudentHomePage() {
  return (
    <div className="p-8 space-y-6">
      {/* Resume Banner */}
      <ResumeBanner course={mockCurrentCourse} />

      {/* Task Grid */}
      <TaskGrid deadline={mockDeadlineTask} liveClass={mockLiveClass} />

      {/* Course Recommendations */}
      <CourseCarousel
        title="Khóa học gợi ý (Dành cho bạn)"
        subtitle="Dựa trên lịch sử học tập và mục tiêu Fullstack"
        courses={mockRecommendedCourses}
      />
    </div>
  );
}
