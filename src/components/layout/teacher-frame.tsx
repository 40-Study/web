import { BottomNav } from "./bottom-nav";
import { Header } from "./header";
import { TeacherSidebar } from "./teacher-sidebar";

/**
 * Khung giao diện giảng viên: header, sidebar giảng viên, BottomNav giảng viên. Dùng cho mọi trang /teacher/** và
 * (Q4-T19) cho trang dùng chung (/notifications, /messages, /profile) khi vai đang dùng là giảng viên, để giảng viên
 * không bị đổi sang sidebar thu gọn và footer của trang học viên khi bấm chuông hay tin nhắn.
 */
export function TeacherFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex flex-1 pt-16">
        <TeacherSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/*
            P2 QA 260927 teacher: pb-20 (80px) không đủ khoảng đệm cho BottomNav thật
            (nav cao ~90px + bottom-4 16px cách đáy màn hình ≈ 106px, đo trực tiếp trên
            /teacher/courses/create ở 390px — nút "Tiếp tục" cuối form chỉ còn cách nav 6px,
            và dropdown "Danh mục" mở ra còn cao hơn nữa nên bị đè). Tăng lên pb-32 (128px)
            để có khoảng dư an toàn trên mọi trang teacher dùng layout này.
          */}
          <main id="main-content" className="p-4 md:p-6 pb-32 md:pb-6 w-full flex-1">
            {children}
          </main>
          <BottomNav role="teacher" />
        </div>
      </div>
    </div>
  );
}
