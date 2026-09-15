"use client";

import { useState, useCallback, useRef } from "react";
import {
  Play,
  Radio,
  FileText,
  Plus,
  Upload,
  Sparkles,
  Trash2,
  File,
  Image,
  X,
  Clock,
  Calendar,
  Settings,
  Link2,
  Video,
  FileQuestion,
  Code2,
  Check,
  ChevronLeft,
  Paperclip,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { requiresClassSelection } from "@/lib/livestream";
import type { Class } from "@/services/class.service";

// ─── Types ─────────────────────────────────────────────────────────────────

export type ContentType = "video" | "livestream" | "exercise";
export type ExerciseType = "quiz" | "code" | "essay";

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  type: string;
  status: "pending" | "uploading" | "done" | "error";
}

interface QuizQuestion {
  id: string;
  question: string;
  options: { id: string; text: string }[];
  correctId: string;
}

interface TestCase {
  id: string;
  input: string;
  output: string;
  hidden: boolean;
}

// Final data structures
export interface VideoContentData {
  type: "video";
  title: string;
  description: string;
  videoFile?: File;
  videoUrl?: string;
  documents: File[];
  quizQuestions: QuizQuestion[];
}

export interface LivestreamContentData {
  type: "livestream";
  title: string;
  description: string;
  date: string;
  startTime: string;
  /**
   * Lớp mà buổi live sẽ gắn vào (`class_id` của `CreateLivestreamDTO`).
   *
   * `null` khi khoá chưa có lớp nào — trang giáo viên chặn trước khi tới đây.
   * Khoá có 1 lớp thì modal tự chọn; có ≥2 lớp thì giáo viên phải chọn, nút gửi
   * bị vô hiệu hoá cho tới khi chọn xong.
   */
  classId: string | null;
  enableRecording: boolean;
  documents: File[];
  quizQuestions: QuizQuestion[];
}

export interface ExerciseContentData {
  type: "exercise";
  exerciseType: ExerciseType;
  title: string;
  description: string;
  // Quiz specific
  quizQuestions?: QuizQuestion[];
  timeLimit?: number;
  // Code specific
  language?: string;
  testCases?: TestCase[];
  solutionCode?: string;
  // Essay specific
  minWords?: number;
  maxWords?: number;
}

export type ContentData = VideoContentData | LivestreamContentData | ExerciseContentData;

interface AddContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ContentData) => void;
  isLoading?: boolean;
  lessonId: string;
  /** Danh sách lớp của khoá — nguồn cho ô chọn lớp của buổi live. */
  courseClasses?: Class[];
  /** `useClasses` đang tải lần đầu (chưa có cache) — hiện skeleton thay vì ô chọn. */
  classesLoading?: boolean;
  /** `useClasses` lỗi — hiện thông báo + nút thử lại thay vì ô chọn. */
  classesError?: boolean;
  /** Gọi `refetch()` của `useClasses` khi giáo viên bấm thử lại. */
  onRetryClasses?: () => void;
  uploadProgress?: number; // 0-100, undefined = not uploading
  uploadStatus?: string; // status message
  onVideoFileSelect?: (file: File) => void; // Called immediately when video file is selected
  uploadedVideoUrl?: string; // URL of uploaded video (set by parent after upload completes)
}

// ─── Constants ─────────────────────────────────────────────────────────────

const CONTENT_TYPES = [
  { type: "video" as const, label: "Video bài giảng", icon: Play, color: "text-blue-600", bg: "bg-blue-50" },
  { type: "livestream" as const, label: "Buổi học trực tiếp", icon: Radio, color: "text-rose-600", bg: "bg-rose-50" },
  { type: "exercise" as const, label: "Bài tập", icon: FileText, color: "text-amber-600", bg: "bg-amber-50" },
];

const EXERCISE_TYPES = [
  { type: "quiz" as const, label: "Trắc nghiệm", icon: FileQuestion },
  { type: "code" as const, label: "Thực hành Code", icon: Code2 },
  { type: "essay" as const, label: "Tự luận", icon: FileText },
];

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "go", label: "Go" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
];

// ─── Helpers ───────────────────────────────────────────────────────────────

const genId = () => Math.random().toString(36).slice(2, 9);

const emptyQuestion = (): QuizQuestion => ({
  id: genId(),
  question: "",
  options: [
    { id: genId(), text: "" },
    { id: genId(), text: "" },
    { id: genId(), text: "" },
    { id: genId(), text: "" },
  ],
  correctId: "",
});

const emptyTestCase = (): TestCase => ({ id: genId(), input: "", output: "", hidden: false });

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// ─── Component ─────────────────────────────────────────────────────────────

export function AddContentModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
  lessonId,
  courseClasses = [],
  classesLoading = false,
  classesError = false,
  onRetryClasses,
  uploadProgress,
  uploadStatus,
  onVideoFileSelect,
  uploadedVideoUrl,
}: AddContentModalProps) {
  // Step: null = choose type, otherwise editing that type
  const [contentType, setContentType] = useState<ContentType | null>(null);
  const [activeTab, setActiveTab] = useState("content");

  // Video state
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDesc, setVideoDesc] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoDocs, setVideoDocs] = useState<File[]>([]);
  const [videoQuiz, setVideoQuiz] = useState<QuizQuestion[]>([]);

  // Livestream state
  const [liveTitle, setLiveTitle] = useState("");
  const [liveDesc, setLiveDesc] = useState("");
  const [liveDate, setLiveDate] = useState("");
  const [liveTime, setLiveTime] = useState("20:00");
  const [liveClassId, setLiveClassId] = useState("");
  const [liveRecording, setLiveRecording] = useState(true);
  const [liveDocs, setLiveDocs] = useState<File[]>([]);
  const [liveQuiz, setLiveQuiz] = useState<QuizQuestion[]>([]);

  const hasMultipleClasses = requiresClassSelection(courseClasses.length);
  // Khoá 1 lớp: không cần hỏi, backend vẫn phải nhận đúng class_id đó.
  const effectiveClassId = hasMultipleClasses ? liveClassId : (courseClasses[0]?.id ?? "");

  /**
   * Cache còn lớp hay không — ranh giới quyết định giữa "lỗi chặn" và "lỗi hạ cấp".
   *
   * M-7: `staleTime` 30 s nên mở lại modal là refetch; refetch hỏng đặt
   * `classesError` **trong khi `courseClasses` vẫn còn nguyên**. Lấy `classesError`
   * làm chân lý sẽ xoá ô chọn lớp và nói sai rằng "chưa xác định được lớp" —
   * cùng khuôn lỗi đã sửa cho cart/messages ở vòng 1 (finding #5).
   */
  const hasCachedClasses = courseClasses.length > 0;

  /**
   * Lý do chưa xác định được lớp cho buổi live — `null` khi đã xác định xong.
   *
   * M-2: ba trạng thái trước đây đều cho ra `[]` nên nút gửi xám **im lặng**,
   * không chữ nào giải thích. Mỗi trạng thái giờ có một câu riêng, và trạng thái
   * lỗi còn có nút thử lại (không có nó thì đóng/mở lại modal chỉ đọc cache lỗi).
   *
   * M-7: câu "chưa xác định được lớp" chỉ được nói khi **cache rỗng thật** —
   * còn lớp trong cache thì lớp đó vẫn dùng được, nói ngược lại là banner nói sai
   * sự thật (khoá 1 lớp: nút gửi bật, banner lại bảo chưa có lớp).
   */
  const classBlockReason: string | null = hasCachedClasses
    ? hasMultipleClasses && !liveClassId
      ? "Chọn lớp cho buổi live ở trên để tiếp tục."
      : null
    : classesError
      ? "Không tải được danh sách lớp của khoá học."
      : classesLoading
        ? "Đang tải danh sách lớp…"
        : "Khoá học chưa có lớp nào — tạo lớp trước khi lên lịch buổi live.";

  // Exercise state
  const [exerciseType, setExerciseType] = useState<ExerciseType | null>(null);
  const [exTitle, setExTitle] = useState("");
  const [exDesc, setExDesc] = useState("");
  const [exQuiz, setExQuiz] = useState<QuizQuestion[]>([emptyQuestion()]);
  const [exTimeLimit, setExTimeLimit] = useState(300);
  const [exLanguage, setExLanguage] = useState("javascript");
  const [exTestCases, setExTestCases] = useState<TestCase[]>([emptyTestCase()]);
  const [exSolution, setExSolution] = useState("");
  const [exMinWords, setExMinWords] = useState(50);
  const [exMaxWords, setExMaxWords] = useState(500);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Reset all state
  const resetAll = useCallback(() => {
    setContentType(null);
    setActiveTab("content");
    setVideoTitle(""); setVideoDesc(""); setVideoFile(null); setVideoUrl("");
    setVideoDocs([]); setVideoQuiz([]);
    setLiveTitle(""); setLiveDesc(""); setLiveDate(""); setLiveTime("20:00");
    setLiveClassId(""); setLiveRecording(true); setLiveDocs([]); setLiveQuiz([]);
    setExerciseType(null); setExTitle(""); setExDesc("");
    setExQuiz([emptyQuestion()]); setExTimeLimit(300);
    setExLanguage("javascript"); setExTestCases([emptyTestCase()]); setExSolution("");
    setExMinWords(50); setExMaxWords(500);
  }, []);

  const handleClose = useCallback(() => {
    resetAll();
    onOpenChange(false);
  }, [resetAll, onOpenChange]);

  const handleBack = useCallback(() => {
    if (contentType === "exercise" && exerciseType) {
      setExerciseType(null);
    } else {
      setContentType(null);
      setActiveTab("content");
    }
  }, [contentType, exerciseType]);

  // Sinh quiz bằng AI: backend CHƯA có endpoint nào (không có tích hợp Qwen trong repo).
  // Bản trước đây chờ setTimeout 2 giây rồi chèn 2 câu hỏi cứng và tự chọn đáp án đúng là
  // phương án A — giáo viên tưởng đang dùng AI thật và có thể lưu quiz rác vào khóa học.
  // Đã bỏ hẳn; nút được vô hiệu hóa cho tới khi có API thật.
  // Submit
  const handleSubmit = useCallback(() => {
    if (contentType === "video") {
      // Use uploadedVideoUrl if file was uploaded, otherwise use manual videoUrl
      const finalVideoUrl = uploadedVideoUrl || videoUrl || undefined;
      onSubmit({
        type: "video",
        title: videoTitle,
        description: videoDesc,
        videoFile: undefined, // File already uploaded, URL is in finalVideoUrl
        videoUrl: finalVideoUrl,
        documents: videoDocs,
        quizQuestions: videoQuiz,
      });
    } else if (contentType === "livestream") {
      if (!effectiveClassId) return; // chưa xác định được lớp — nút gửi đã bị vô hiệu hoá kèm lý do
      onSubmit({
        type: "livestream",
        title: liveTitle,
        description: liveDesc,
        date: liveDate,
        startTime: liveTime,
        classId: effectiveClassId,
        enableRecording: liveRecording,
        documents: liveDocs,
        quizQuestions: liveQuiz,
      });
    } else if (contentType === "exercise" && exerciseType) {
      onSubmit({
        type: "exercise",
        exerciseType,
        title: exTitle,
        description: exDesc,
        quizQuestions: exerciseType === "quiz" ? exQuiz : undefined,
        timeLimit: exerciseType === "quiz" ? exTimeLimit : undefined,
        language: exerciseType === "code" ? exLanguage : undefined,
        testCases: exerciseType === "code" ? exTestCases : undefined,
        solutionCode: exerciseType === "code" ? exSolution : undefined,
        minWords: exerciseType === "essay" ? exMinWords : undefined,
        maxWords: exerciseType === "essay" ? exMaxWords : undefined,
      });
    }
    handleClose();
  }, [contentType, exerciseType, videoTitle, videoDesc, videoUrl, uploadedVideoUrl, videoDocs, videoQuiz, liveTitle, liveDesc, liveDate, liveTime, effectiveClassId, liveRecording, liveDocs, liveQuiz, exTitle, exDesc, exQuiz, exTimeLimit, exLanguage, exTestCases, exSolution, exMinWords, exMaxWords, onSubmit, handleClose]);

  // Document handlers
  const addDocs = useCallback((files: FileList, target: "video" | "live") => {
    const arr = Array.from(files);
    if (target === "video") setVideoDocs((p) => [...p, ...arr]);
    else setLiveDocs((p) => [...p, ...arr]);
  }, []);

  const removeDocs = useCallback((idx: number, target: "video" | "live") => {
    if (target === "video") setVideoDocs((p) => p.filter((_, i) => i !== idx));
    else setLiveDocs((p) => p.filter((_, i) => i !== idx));
  }, []);

  // Quiz question handlers
  const updateQuestion = useCallback((
    qId: string,
    field: "question" | "correctId",
    value: string,
    target: "video" | "live" | "exercise"
  ) => {
    const updater = (qs: QuizQuestion[]) =>
      qs.map((q) => (q.id === qId ? { ...q, [field]: value } : q));
    if (target === "video") setVideoQuiz(updater);
    else if (target === "live") setLiveQuiz(updater);
    else setExQuiz(updater);
  }, []);

  const updateOption = useCallback((
    qId: string,
    optId: string,
    text: string,
    target: "video" | "live" | "exercise"
  ) => {
    const updater = (qs: QuizQuestion[]) =>
      qs.map((q) =>
        q.id === qId
          ? { ...q, options: q.options.map((o) => (o.id === optId ? { ...o, text } : o)) }
          : q
      );
    if (target === "video") setVideoQuiz(updater);
    else if (target === "live") setLiveQuiz(updater);
    else setExQuiz(updater);
  }, []);

  const addQuestion = useCallback((target: "video" | "live" | "exercise") => {
    if (target === "video") setVideoQuiz((p) => [...p, emptyQuestion()]);
    else if (target === "live") setLiveQuiz((p) => [...p, emptyQuestion()]);
    else setExQuiz((p) => [...p, emptyQuestion()]);
  }, []);

  const removeQuestion = useCallback((qId: string, target: "video" | "live" | "exercise") => {
    const updater = (qs: QuizQuestion[]) => qs.filter((q) => q.id !== qId);
    if (target === "video") setVideoQuiz(updater);
    else if (target === "live") setLiveQuiz(updater);
    else setExQuiz(updater);
  }, []);

  // Test case handlers
  const updateTestCase = useCallback((id: string, field: keyof TestCase, value: string | boolean) => {
    setExTestCases((p) => p.map((tc) => (tc.id === id ? { ...tc, [field]: value } : tc)));
  }, []);

  const addTestCase = useCallback(() => setExTestCases((p) => [...p, emptyTestCase()]), []);
  const removeTestCase = useCallback((id: string) => setExTestCases((p) => p.filter((tc) => tc.id !== id)), []);

  // ─── Render ──────────────────────────────────────────────────────────────

  const currentDocs = contentType === "video" ? videoDocs : liveDocs;
  const currentQuiz = contentType === "video" ? videoQuiz : liveQuiz;
  const quizTarget = contentType === "video" ? "video" : contentType === "livestream" ? "live" : "exercise";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          {contentType && (
            <button onClick={handleBack} className="absolute left-4 top-4 p-1 rounded hover:bg-muted">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <DialogTitle className="text-center">
            {!contentType
              ? "Thêm nội dung bài học"
              : contentType === "video"
              ? "Thêm Video bài giảng"
              : contentType === "livestream"
              ? "Lên lịch buổi học trực tiếp"
              : !exerciseType
              ? "Chọn loại bài tập"
              : exerciseType === "quiz"
              ? "Tạo bài trắc nghiệm"
              : exerciseType === "code"
              ? "Tạo bài thực hành Code"
              : "Tạo bài tự luận"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-1">
          {/* ════ Step 1: Choose content type ════ */}
          {!contentType && (
            <div className="grid grid-cols-3 gap-4 py-6">
              {CONTENT_TYPES.map((ct) => {
                const Icon = ct.icon;
                return (
                  <button
                    key={ct.type}
                    onClick={() => setContentType(ct.type)}
                    className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-input hover:border-primary-400 hover:shadow-md transition-all"
                  >
                    <div className={cn("p-4 rounded-xl", ct.bg, ct.color)}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <span className="font-medium">{ct.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* ════ Video Form ════ */}
          {contentType === "video" && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="content">Nội dung</TabsTrigger>
                <TabsTrigger value="docs">Tài liệu</TabsTrigger>
                <TabsTrigger value="quiz">Quiz</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4 mt-4">
                <Input
                  label="Tiêu đề video"
                  placeholder="VD: Bài 1 - Giới thiệu Go"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                />
                <Textarea
                  label="Mô tả"
                  placeholder="Mô tả nội dung video..."
                  value={videoDesc}
                  onChange={(e) => setVideoDesc(e.target.value)}
                  rows={3}
                />

                {/* Video upload */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Video</label>
                  {videoFile ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-3 border rounded-xl bg-blue-50">
                        <Video className="w-8 h-8 text-blue-600" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{videoFile.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(videoFile.size)}</p>
                        </div>
                        {!isLoading && (
                          <Button variant="ghost" size="icon" onClick={() => setVideoFile(null)}>
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      {/* Upload Progress Bar */}
                      {uploadProgress !== undefined && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{uploadStatus || "Đang upload..."}</span>
                            <span className="font-medium text-primary-600">{uploadProgress}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-600 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      onClick={() => videoInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add("border-primary-400", "bg-primary-50");
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove("border-primary-400", "bg-primary-50");
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove("border-primary-400", "bg-primary-50");
                        const file = e.dataTransfer.files?.[0];
                        if (file && file.type.startsWith("video/")) {
                          setVideoFile(file);
                          onVideoFileSelect?.(file);
                        }
                      }}
                      className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-colors"
                    >
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Kéo thả hoặc click để upload video</p>
                      <p className="text-xs text-muted-foreground mt-1">MP4, WebM, tối đa 500MB</p>
                    </div>
                  )}
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setVideoFile(file);
                        // Start upload immediately
                        onVideoFileSelect?.(file);
                      }
                    }}
                  />
                </div>

                <div className="text-center text-sm text-muted-foreground">hoặc</div>

                <Input
                  label="URL Video (YouTube, Vimeo...)"
                  placeholder="https://..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
              </TabsContent>

              <TabsContent value="docs" className="space-y-4 mt-4">
                <DocumentsPanel
                  documents={videoDocs}
                  onAdd={(files) => addDocs(files, "video")}
                  onRemove={(idx) => removeDocs(idx, "video")}
                />
              </TabsContent>

              <TabsContent value="quiz" className="space-y-4 mt-4">
                <QuizPanel
                  questions={videoQuiz}
                  onUpdateQuestion={(qId, field, val) => updateQuestion(qId, field, val, "video")}
                  onUpdateOption={(qId, optId, text) => updateOption(qId, optId, text, "video")}
                  onAddQuestion={() => addQuestion("video")}
                  onRemoveQuestion={(qId) => removeQuestion(qId, "video")}
                />
              </TabsContent>
            </Tabs>
          )}

          {/* ════ Livestream Form ════ */}
          {contentType === "livestream" && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="content">Thông tin</TabsTrigger>
                <TabsTrigger value="schedule">Lịch trình</TabsTrigger>
                <TabsTrigger value="docs">Tài liệu</TabsTrigger>
                <TabsTrigger value="quiz">Quiz</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4 mt-4">
                <Input
                  label="Tiêu đề buổi live"
                  placeholder="VD: Q&A - Giải đáp thắc mắc"
                  value={liveTitle}
                  onChange={(e) => setLiveTitle(e.target.value)}
                />
                <Textarea
                  label="Mô tả & chuẩn bị"
                  placeholder="Nội dung buổi live..."
                  value={liveDesc}
                  onChange={(e) => setLiveDesc(e.target.value)}
                  rows={4}
                />
              </TabsContent>

              <TabsContent value="schedule" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Ngày phát sóng</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="date"
                        value={liveDate}
                        onChange={(e) => setLiveDate(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Giờ bắt đầu</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="time"
                        value={liveTime}
                        onChange={(e) => setLiveTime(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                {/*
                  Ô chọn lớp: bắt buộc khi khoá có từ 2 lớp trở lên.
                  Backend gắn buổi live vào MỘT lớp (`CreateLivestreamDTO.ClassID`)
                  — tự lấy lớp đầu tiên sẽ khiến học viên các lớp khác không bao
                  giờ thấy buổi live, và lỗi này im lặng (finding #1).

                  Ba trạng thái "chưa có lớp để chọn" được tách bạch (M-2): đang
                  tải → skeleton, tải lỗi → thông báo + thử lại, khoá chưa có lớp
                  → câu hướng dẫn. Trước đây cả ba đều im lặng.

                  M-7: cả ba trạng thái đó chỉ đúng khi cache RỖNG. Refetch hỏng
                  mà cache còn lớp thì hạ xuống banner nhỏ phía trên, giữ nguyên ô
                  chọn lớp — không xoá thứ đang dùng được.
                */}
                {contentType === "livestream" && classesLoading && !hasCachedClasses && (
                  // Skeleton thuần thị giác — lý do ("Đang tải danh sách lớp…") nằm ở
                  // footer cạnh nút gửi và đã có `role="status"` để trình đọc màn
                  // hình đọc; không lặp lại lần hai trong cùng một dialog.
                  <div className="space-y-2" aria-hidden="true">
                    <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                    <div className="h-10 w-full animate-pulse rounded-xl bg-muted" />
                  </div>
                )}

                {contentType === "livestream" &&
                  !classesLoading &&
                  classesError &&
                  !hasCachedClasses && (
                    <div
                      role="alert"
                      className="flex items-start justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5"
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                        <div>
                          <p className="text-sm font-medium">Không tải được danh sách lớp</p>
                          <p className="text-xs text-muted-foreground">
                            Chưa xác định được lớp để gắn buổi live vào.
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => onRetryClasses?.()}>
                        <RefreshCw className="mr-1 h-3.5 w-3.5" />
                        Thử lại
                      </Button>
                    </div>
                  )}

                {contentType === "livestream" && classesError && hasCachedClasses && (
                  // M-7: refetch hỏng nhưng cache còn lớp → hạ cấp, KHÔNG chặn.
                  // Câu chữ nói đúng chuyện đang xảy ra: danh sách đang hiển thị là
                  // bản cũ, không phải "chưa xác định được lớp".
                  <div
                    role="alert"
                    className="flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-amber-800"
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <p className="text-xs">
                        Không làm mới được danh sách lớp — đang hiển thị dữ liệu lần trước.
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => onRetryClasses?.()}>
                      <RefreshCw className="mr-1 h-3.5 w-3.5" />
                      Thử lại
                    </Button>
                  </div>
                )}

                {contentType === "livestream" &&
                  !classesLoading &&
                  !classesError &&
                  !hasCachedClasses && (
                    <div
                      role="alert"
                      className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-amber-800"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Khoá học chưa có lớp nào</p>
                        <p className="text-xs">
                          Tạo lớp cho khoá học trước khi lên lịch buổi live.
                        </p>
                      </div>
                    </div>
                  )}

                {hasMultipleClasses && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Lớp học <span className="text-destructive">*</span>
                    </label>
                    <Select value={liveClassId} onValueChange={setLiveClassId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn lớp cho buổi live" />
                      </SelectTrigger>
                      <SelectContent>
                        {courseClasses.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-2">
                      Buổi live chỉ hiển thị cho học viên thuộc lớp được chọn.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 border rounded-xl">
                  <div>
                    <p className="font-medium text-sm">Tự động ghi lại</p>
                    <p className="text-xs text-muted-foreground">Lưu bản ghi sau khi kết thúc</p>
                  </div>
                  <Switch checked={liveRecording} onCheckedChange={setLiveRecording} />
                </div>
              </TabsContent>

              <TabsContent value="docs" className="space-y-4 mt-4">
                <DocumentsPanel
                  documents={liveDocs}
                  onAdd={(files) => addDocs(files, "live")}
                  onRemove={(idx) => removeDocs(idx, "live")}
                />
              </TabsContent>

              <TabsContent value="quiz" className="space-y-4 mt-4">
                <QuizPanel
                  questions={liveQuiz}
                  onUpdateQuestion={(qId, field, val) => updateQuestion(qId, field, val, "live")}
                  onUpdateOption={(qId, optId, text) => updateOption(qId, optId, text, "live")}
                  onAddQuestion={() => addQuestion("live")}
                  onRemoveQuestion={(qId) => removeQuestion(qId, "live")}
                />
              </TabsContent>
            </Tabs>
          )}

          {/* ════ Exercise: Choose type ════ */}
          {contentType === "exercise" && !exerciseType && (
            <div className="grid grid-cols-3 gap-4 py-6">
              {EXERCISE_TYPES.map((et) => {
                const Icon = et.icon;
                return (
                  <button
                    key={et.type}
                    onClick={() => setExerciseType(et.type)}
                    className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-input hover:border-primary-400 hover:shadow-md transition-all"
                  >
                    <div className="p-4 rounded-xl bg-amber-50 text-amber-600">
                      <Icon className="w-8 h-8" />
                    </div>
                    <span className="font-medium">{et.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* ════ Exercise: Quiz ════ */}
          {contentType === "exercise" && exerciseType === "quiz" && (
            <div className="space-y-4 mt-4">
              <Input
                label="Tiêu đề bài kiểm tra"
                placeholder="VD: Kiểm tra kiến thức Go"
                value={exTitle}
                onChange={(e) => setExTitle(e.target.value)}
              />
              <div>
                <label className="text-sm font-medium mb-2 block">Thời gian làm bài (phút)</label>
                <Input
                  type="number"
                  value={Math.floor(exTimeLimit / 60)}
                  onChange={(e) => setExTimeLimit(Number(e.target.value) * 60)}
                  className="w-32"
                />
              </div>
              <QuizQuestionsEditor
                questions={exQuiz}
                onUpdate={(qId, field, val) => updateQuestion(qId, field, val, "exercise")}
                onUpdateOption={(qId, optId, text) => updateOption(qId, optId, text, "exercise")}
                onAdd={() => addQuestion("exercise")}
                onRemove={(qId) => removeQuestion(qId, "exercise")}
              />
            </div>
          )}

          {/* ════ Exercise: Code ════ */}
          {contentType === "exercise" && exerciseType === "code" && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    label="Tiêu đề bài tập"
                    placeholder="VD: Tính tổng số chẵn"
                    value={exTitle}
                    onChange={(e) => setExTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Ngôn ngữ</label>
                  <Select value={exLanguage} onValueChange={setExLanguage}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Textarea
                label="Đề bài"
                placeholder="Hãy viết function tính tổng các số chẵn..."
                value={exDesc}
                onChange={(e) => setExDesc(e.target.value)}
                rows={4}
              />

              {/* Test Cases */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Bộ kiểm thử</label>
                {exTestCases.map((tc, idx) => (
                  <div key={tc.id} className="border rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-primary-600">Test #{idx + 1}</span>
                      {exTestCases.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => removeTestCase(tc.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Textarea
                        placeholder="Đầu vào"
                        value={tc.input}
                        onChange={(e) => updateTestCase(tc.id, "input", e.target.value)}
                        rows={2}
                      />
                      <Textarea
                        placeholder="Đầu ra mong đợi"
                        value={tc.output}
                        onChange={(e) => updateTestCase(tc.id, "output", e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={addTestCase} className="w-full">
                  <Plus className="w-4 h-4 mr-1" /> Thêm test case
                </Button>
              </div>

              <Textarea
                label="Giải pháp (Solution)"
                placeholder="function solve() { ... }"
                value={exSolution}
                onChange={(e) => setExSolution(e.target.value)}
                rows={6}
                className="font-mono text-sm"
              />
            </div>
          )}

          {/* ════ Exercise: Essay ════ */}
          {contentType === "exercise" && exerciseType === "essay" && (
            <div className="space-y-4 mt-4">
              <Input
                label="Tiêu đề bài tự luận"
                placeholder="VD: Phân tích ưu điểm của Go"
                value={exTitle}
                onChange={(e) => setExTitle(e.target.value)}
              />
              <Textarea
                label="Đề bài"
                placeholder="Hãy trình bày..."
                value={exDesc}
                onChange={(e) => setExDesc(e.target.value)}
                rows={4}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  label="Số từ tối thiểu"
                  value={exMinWords}
                  onChange={(e) => setExMinWords(Number(e.target.value))}
                />
                <Input
                  type="number"
                  label="Số từ tối đa"
                  value={exMaxWords}
                  onChange={(e) => setExMaxWords(Number(e.target.value))}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {(contentType === "video" || contentType === "livestream" || (contentType === "exercise" && exerciseType)) && (
          <DialogFooter className="border-t pt-4 mt-4 sm:items-center sm:justify-between">
            {/*
              M-2: nút "Tạo buổi live" từng bị vô hiệu hoá không một lời giải thích
              (đang tải / tải lỗi / khoá chưa có lớp đều ra `[]`). Lý do giờ nằm
              ngay cạnh nút, để trạng thái xám luôn đọc được.
            */}
            {contentType === "livestream" && !effectiveClassId && classBlockReason && (
              <p role="status" className="text-xs text-muted-foreground sm:mr-auto sm:text-left">
                {classBlockReason}
              </p>
            )}
            <div className="flex flex-col-reverse gap-2 sm:ml-auto sm:flex-row">
              <Button variant="outline" onClick={handleClose}>Hủy</Button>
              <Button
                onClick={handleSubmit}
                isLoading={isLoading}
                disabled={contentType === "livestream" && !effectiveClassId}
              >
                {contentType === "video" ? "Thêm video" : contentType === "livestream" ? "Tạo buổi live" : "Lưu bài tập"}
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Documents Panel ───────────────────────────────────────────────────────

function DocumentsPanel({
  documents,
  onAdd,
  onRemove,
}: {
  documents: File[];
  onAdd: (files: FileList) => void;
  onRemove: (idx: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-3">
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-colors"
      >
        <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Upload tài liệu (PDF, DOC, PPT, hình ảnh...)</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
        className="hidden"
        onChange={(e) => e.target.files && onAdd(e.target.files)}
      />

      {documents.length > 0 && (
        <div className="space-y-2">
          {documents.map((f, idx) => (
            <div key={idx} className="flex items-center gap-3 p-2 border rounded-lg">
              <File className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{f.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(f.size)}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => onRemove(idx)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Quiz Panel (with AI generation) ───────────────────────────────────────

function QuizPanel({
  questions,
  onUpdateQuestion,
  onUpdateOption,
  onAddQuestion,
  onRemoveQuestion,
}: {
  questions: QuizQuestion[];
  onUpdateQuestion: (qId: string, field: "question" | "correctId", value: string) => void;
  onUpdateOption: (qId: string, optId: string, text: string) => void;
  onAddQuestion: () => void;
  onRemoveQuestion: (qId: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Tạo Quiz bằng AI — chưa có backend, xem ghi chú ở handleGenerateQuiz cũ */}
      <div className="p-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-gray-400 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-gray-700 dark:text-gray-300">Tạo Quiz bằng AI</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Tính năng đang được phát triển. Hiện tại hãy soạn câu hỏi thủ công bên dưới.
            </p>
          </div>
          <Button size="sm" variant="outline" disabled>
            Sắp có
          </Button>
        </div>
      </div>

      <div className="relative flex items-center">
        <div className="flex-1 border-t" />
        <span className="px-3 text-sm text-muted-foreground">soạn thủ công</span>
        <div className="flex-1 border-t" />
      </div>

      <QuizQuestionsEditor
        questions={questions}
        onUpdate={onUpdateQuestion}
        onUpdateOption={onUpdateOption}
        onAdd={onAddQuestion}
        onRemove={onRemoveQuestion}
      />
    </div>
  );
}

// ─── Quiz Questions Editor ─────────────────────────────────────────────────

function QuizQuestionsEditor({
  questions,
  onUpdate,
  onUpdateOption,
  onAdd,
  onRemove,
}: {
  questions: QuizQuestion[];
  onUpdate: (qId: string, field: "question" | "correctId", value: string) => void;
  onUpdateOption: (qId: string, optId: string, text: string) => void;
  onAdd: () => void;
  onRemove: (qId: string) => void;
}) {
  return (
    <div className="space-y-4">
      {questions.map((q, idx) => (
        <div key={q.id} className="border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Câu hỏi {idx + 1}</span>
            {questions.length > 1 && (
              <Button variant="ghost" size="sm" onClick={() => onRemove(q.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            )}
          </div>
          <Input
            placeholder="Nhập câu hỏi..."
            value={q.question}
            onChange={(e) => onUpdate(q.id, "question", e.target.value)}
          />
          <div className="space-y-2">
            {q.options.map((opt) => (
              <div key={opt.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onUpdate(q.id, "correctId", opt.id)}
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0",
                    q.correctId === opt.id
                      ? "border-primary-600 bg-primary-600 text-white"
                      : "border-input hover:border-primary-400"
                  )}
                >
                  {q.correctId === opt.id && <Check className="w-3 h-3" />}
                </button>
                <Input
                  placeholder="Phương án..."
                  value={opt.text}
                  onChange={(e) => onUpdateOption(q.id, opt.id, e.target.value)}
                  className="flex-1"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      <Button variant="outline" onClick={onAdd} className="w-full">
        <Plus className="w-4 h-4 mr-1" /> Thêm câu hỏi
      </Button>
    </div>
  );
}

export default AddContentModal;
