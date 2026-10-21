"use client";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  FileText,
  ListChecks,
  Loader2,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Presentation,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/lib/utils";
import {
  activeArtifact,
  artifactSchema,
  loadProjects,
  newProject,
  saveProjects,
  type DesignProject,
  type OutputKind,
  type SourceDocument,
  type TeachingArtifact,
} from "@/lib/open-design/project";
import {
  BUILTIN_SKILLS,
  loadCustomSkills,
  saveCustomSkills,
  type TeachingSkill,
} from "@/lib/open-design/skills";
import { buildTeachingHTML, downloadFile, exportPowerPoint } from "@/lib/open-design/preview";
import { openDesignService } from "@/services/open-design.service";
import { StudioComposer } from "./studio-composer";
import { SkillsDialog } from "./skills-dialog";
import { StudioChatMessage } from "./chat-message";
import { ArtifactPane } from "./artifact-pane";
import "./studio.css";

type Run = { id: string; controller: AbortController; cancelled: boolean };
type Confirmation =
  | { type: "new"; kind: OutputKind }
  | { type: "switch"; id: string }
  | { type: "restore"; id: string }
  | { type: "delete" }
  | null;
const field = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm";

export function OpenDesignWorkspace() {
  const { user, activeRole, sessionStatus } = useAuthStore();
  const userID = user?.id;
  const [projects, setProjects] = useState<DesignProject[]>([]);
  const projectsRef = useRef<DesignProject[]>([]);
  const [selectedID, setSelectedID] = useState<string | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [draft, setDraft] = useState<TeachingArtifact | null>(null);
  const [dirty, setDirty] = useState(false);
  const [docs, setDocs] = useState<SourceDocument[]>([]);
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(8);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [storageWarning, setStorageWarning] = useState("");
  const [tab, setTab] = useState<"preview" | "edit">("preview");
  const [slideIndex, setSlideIndex] = useState(0);
  const [quizKey, setQuizKey] = useState(0);
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const runRef = useRef<Run | null>(null);
  const uploadRef = useRef<AbortController | null>(null);
  const [customSkills, setCustomSkills] = useState<TeachingSkill[]>([]);
  const [selectedSkillID, setSelectedSkillID] = useState("slides");
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileView, setMobileView] = useState<"chat" | "result">("chat");
  const messageEnd = useRef<HTMLDivElement>(null);
  const project = loadedFor === userID ? (projects.find((p) => p.id === selectedID) ?? null) : null;
  const kind = project?.kind ?? "slides";
  const theme = project?.theme ?? "blue";
  const locked = busy || uploading;
  const selectedSkill =
    [...BUILTIN_SKILLS, ...customSkills].find((skill) => skill.id === selectedSkillID) ??
    BUILTIN_SKILLS.find((skill) => skill.output === kind) ??
    BUILTIN_SKILLS[0];
  const validDraft = draft ? artifactSchema.safeParse(draft).success : false;
  const status = useQuery({
    queryKey: ["teaching-tools-status", userID],
    queryFn: ({ signal }) => openDesignService.status(signal),
    enabled: !!userID && activeRole === "TEACHER" && sessionStatus === "authenticated",
    staleTime: Infinity,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    if (!userID) return;
    let initial: DesignProject[] = [];
    try {
      initial = loadProjects(userID);
    } catch {
      setStorageWarning(
        "Không đọc được bản lưu cũ. Bạn vẫn có thể tạo và tải kết quả; dữ liệu cũ chưa bị thay đổi."
      );
    }
    if (!initial.length) initial = [newProject()];
    projectsRef.current = initial;
    setProjects(initial);
    setSelectedID(initial[0].id);
    setDraft(activeArtifact(initial[0]));
    setLoadedFor(userID);
    setSelectedSkillID(initial[0].skillID ?? initial[0].kind);
    setCount(initial[0].kind === "quiz" ? 5 : 8);
    setDirty(false);
    setDocs(initial[0].documents);
    setBusy(false);
    try {
      setCustomSkills(loadCustomSkills(userID));
    } catch {
      setStorageWarning("Không đọc được skills cá nhân đã lưu.");
    }
    return () => {
      uploadRef.current?.abort();
      const run = runRef.current;
      if (run) {
        run.cancelled = true;
        void fetch("/api/open-design/cancel", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ request_id: run.id }),
          keepalive: true,
        }).catch(() => {});
        run.controller.abort();
        runRef.current = null;
      }
    };
  }, [userID]);

  function persist(next: DesignProject[]) {
    if (!userID) return;
    try {
      saveProjects(userID, next);
      setStorageWarning("");
    } catch {
      setStorageWarning("Chưa lưu được trên trình duyệt. Hãy tải kết quả trước khi đóng trang.");
    }
    projectsRef.current = next;
    setProjects(next);
  }
  function selectProject(next: DesignProject) {
    setSelectedID(next.id);
    setDraft(activeArtifact(next));
    setDirty(false);
    setDocs(next.documents);
    setPrompt("");
    setError("");
    setNotice("");
    setSlideIndex(0);
    setQuizKey((k) => k + 1);
    setTab("preview");
    setCount(next.kind === "quiz" ? 5 : 8);
    setSelectedSkillID(next.skillID ?? next.kind);
    setSidebarOpen(false);
    setMobileView("chat");
  }
  function create(kind: OutputKind) {
    if (locked) return;
    if (projectsRef.current.length >= 8) {
      setError("Đã có 8 bản lưu. Hãy xuất rồi xoá một bản lưu trước khi tạo thêm.");
      return;
    }
    const next = newProject(kind);
    persist([next, ...projectsRef.current]);
    selectProject(next);
  }
  function chooseSkill(skill: TeachingSkill) {
    if (locked || !project) return;
    const current = projectsRef.current.find((p) => p.id === project.id) ?? project;
    persist(
      projectsRef.current.map((p) =>
        p.id === project.id ? { ...current, kind: skill.output, skillID: skill.id } : p
      )
    );
    setSelectedSkillID(skill.id);
    setCount(skill.output === "quiz" ? 5 : 8);
    setSkillsOpen(false);
  }
  function saveSkill(skill: TeachingSkill) {
    if (!userID) return;
    const next = [...customSkills, skill];
    try {
      saveCustomSkills(userID, next);
      setCustomSkills(next);
      chooseSkill(skill);
    } catch {
      setError("Không lưu được skill. Kiểm tra bộ nhớ trình duyệt.");
    }
  }
  function deleteSkill(id: string) {
    if (!userID) return;
    const next = customSkills.filter((s) => s.id !== id);
    try {
      saveCustomSkills(userID, next);
      setCustomSkills(next);
      if (selectedSkillID === id) setSelectedSkillID(kind);
    } catch {
      setError("Không xoá được skill trên trình duyệt.");
    }
  }
  function saveVersion(artifact: TeachingArtifact, label: string, reply?: string) {
    if (!project) return;
    const parsed = artifactSchema.parse(artifact);
    const version = {
      id: crypto.randomUUID(),
      artifact: parsed,
      prompt: label.slice(0, 6000),
      createdAt: new Date().toISOString(),
    };
    const current = projectsRef.current.find((p) => p.id === project.id) ?? project;
    const next = {
      ...current,
      messages: reply
        ? [
            ...current.messages,
            {
              id: crypto.randomUUID(),
              role: "assistant" as const,
              text: reply,
              files: [],
              skills: [],
            },
          ].slice(-80)
        : current.messages,
      title: parsed.title,
      kind: parsed.kind,
      versions: [...current.versions, version].slice(-10),
      activeVersion: version.id,
    };
    persist(projectsRef.current.map((p) => (p.id === next.id ? next : p)));
    setDraft(parsed);
    setDirty(false);
    setQuizKey((k) => k + 1);
  }
  function saveEdits() {
    if (!draft) return;
    const parsed = artifactSchema.safeParse(draft);
    if (!parsed.success) {
      setError(
        "Kiểm tra lại: tiêu đề/nội dung không được rỗng; mỗi câu cần 4 lựa chọn khác nhau, một đáp án đúng và giải thích."
      );
      return;
    }
    saveVersion(parsed.data, "Chỉnh sửa của giáo viên");
    setError("");
    setNotice("Đã lưu phiên bản chỉnh sửa.");
  }

  async function upload(files: File[]) {
    if (locked || uploadRef.current || !files.length) return;
    setError("");
    setNotice("");
    if (docs.length + files.length > 3) {
      setError("Tối đa 3 tài liệu cho mỗi yêu cầu.");
      return;
    }
    const unique = files.filter(
      (f, i) => files.findIndex((v) => v.name === f.name && v.size === f.size) === i
    );
    if (
      unique.some(
        (f) => f.size > 3 * 1024 * 1024 || !f.size || !/^.+\.(pdf|docx|pptx|txt|md)$/i.test(f.name)
      )
    ) {
      setError("Chọn PDF, DOCX, PPTX, TXT hoặc MD, mỗi file tối đa 3 MB.");
      return;
    }
    if (unique.some((f) => docs.some((d) => d.name === f.name))) {
      setError("Tài liệu này đã được đính kèm. Hãy gỡ bản cũ nếu muốn thay thế.");
      return;
    }
    const controller = new AbortController();
    uploadRef.current = controller;
    setUploading(true);
    let next = [...docs];
    try {
      for (const file of unique) {
        const parsed = await openDesignService.document(file, controller.signal);
        if (controller.signal.aborted) return;
        if (next.reduce((n, d) => n + d.text.length, 0) + parsed.text.length > 60000)
          throw new Error("Tổng nội dung tài liệu vượt 60.000 ký tự. Hãy chia nhỏ tài liệu.");
        next = [...next, { ...parsed, id: crypto.randomUUID() }];
        setDocs(next);
        persist(
          projectsRef.current.map((p) => (p.id === selectedID ? { ...p, documents: next } : p))
        );
      }
      setNotice("Đã đọc tài liệu. Nội dung sẽ được gửi tới Viettel AI khi bạn bấm tạo.");
    } catch (failure) {
      if (!controller.signal.aborted)
        setError(failure instanceof Error ? failure.message : "Không đọc được tài liệu.");
    } finally {
      if (uploadRef.current === controller) {
        uploadRef.current = null;
        setUploading(false);
      }
    }
  }
  async function generate() {
    if (!project || locked || runRef.current || !prompt.trim() || !status.data?.configured) return;
    if (draft && !validDraft) {
      setError("Hãy hoàn thiện các nội dung đang sửa trước khi gửi AI.");
      return;
    }
    const requested = prompt.match(
      selectedSkill.output === "slides"
        ? /(\d+)\s*slides?(?!\p{L})/iu
        : /(\d+)\s*câu(?:\s*hỏi)?(?!\p{L})/iu
    );
    const requestedCount = requested ? Number(requested[1]) : count;
    if (
      !Number.isInteger(requestedCount) ||
      requestedCount < 1 ||
      requestedCount > (selectedSkill.output === "slides" ? 20 : 30)
    ) {
      setError("Mỗi lượt tạo tối đa 20 slide hoặc 30 câu hỏi. Hãy giảm số lượng trong yêu cầu.");
      return;
    }
    setCount(requestedCount);
    const run: Run = {
      id: crypto.randomUUID(),
      controller: new AbortController(),
      cancelled: false,
    };
    runRef.current = run;
    setBusy(true);
    setError("");
    setNotice("");
    const currentProject = projectsRef.current.find((p) => p.id === project.id) ?? project;
    const submitted = prompt.trim();
    const previousMessage = currentProject.messages.at(-1);
    const retryingSamePrompt =
      previousMessage?.role === "user" &&
      previousMessage.text === submitted &&
      JSON.stringify(previousMessage.files) === JSON.stringify(docs.map((d) => d.name)) &&
      JSON.stringify(previousMessage.skills) === JSON.stringify([selectedSkill.name]);
    const history = retryingSamePrompt
      ? currentProject.messages.slice(0, -1)
      : currentProject.messages;
    persist(
      projectsRef.current.map((p) =>
        p.id === project.id
          ? {
              ...p,
              messages: retryingSamePrompt
                ? p.messages
                : [
                    ...p.messages,
                    {
                      id: crypto.randomUUID(),
                      role: "user" as const,
                      text: submitted,
                      files: docs.map((d) => d.name),
                      skills: [selectedSkill.name],
                    },
                  ].slice(-80),
            }
          : p
      )
    );
    setMobileView("chat");
    try {
      const result = await openDesignService.generate(
        {
          request_id: run.id,
          output: selectedSkill.output,
          skills: [{ name: selectedSkill.name, instructions: selectedSkill.instructions }],
          history: history.slice(-10).map((m) => ({ role: m.role, content: m.text })),
          prompt: prompt.trim(),
          count: requestedCount,
          documents: docs.map(({ name, text }) => ({ name, text })),
          ...(draft ? { current: draft } : {}),
        },
        run.controller.signal
      );
      if (run.cancelled || runRef.current !== run) return;
      saveVersion(
        result.artifact,
        submitted,
        `${result.message}\n\n${result.artifact.kind === "slides" ? `Đã tạo ${result.artifact.slides.length} slide. Bạn có thể trình chiếu, chỉnh sửa hoặc tải PowerPoint.` : `Đã tạo ${result.artifact.questions.length} câu hỏi, kèm đáp án đúng và giải thích. Mở Preview để làm thử hoặc Chỉnh sửa để đổi đáp án.`}`
      );
      setMobileView("result");
      setPrompt("");
      setSlideIndex(0);
      setTab("preview");
      setNotice("");
    } catch (failure) {
      if (!run.cancelled && runRef.current === run)
        setError(
          failure instanceof Error
            ? failure.message
            : "Không thể tạo nội dung. Bản trước được giữ nguyên."
        );
    } finally {
      if (runRef.current === run && !run.cancelled) {
        runRef.current = null;
        setBusy(false);
      }
    }
  }
  async function cancel() {
    const run = runRef.current;
    if (!run || run.cancelled) return;
    run.cancelled = true;
    run.controller.abort();
    setNotice("Đang huỷ yêu cầu…");
    try {
      const result = await openDesignService.cancel(run.id);
      setNotice(
        result.cancelled
          ? "Đã huỷ. Bản nháp trước được giữ nguyên."
          : "Đã dừng chờ kết quả. Yêu cầu chưa bắt đầu hoặc đã kết thúc trên máy chủ."
      );
    } catch {
      setError("Đã dừng chờ nhưng chưa xác nhận huỷ trên máy chủ. Vui lòng đợi trước khi thử lại.");
    } finally {
      if (runRef.current === run) {
        runRef.current = null;
        setBusy(false);
      }
    }
  }
  function confirm() {
    if (!confirmation || !project) return;
    const action = confirmation;
    setConfirmation(null);
    if (action.type === "new") create(action.kind);
    else if (action.type === "switch") {
      const target = projects.find((p) => p.id === action.id);
      if (target) selectProject(target);
    } else if (action.type === "delete") {
      const remaining = projectsRef.current.filter((p) => p.id !== project.id);
      const next = remaining.length ? remaining : [newProject(kind)];
      persist(next);
      selectProject(next[0]);
      setNotice("Đã xoá bản lưu trên trình duyệt.");
    } else {
      const restored = project.versions.find((v) => v.id === action.id)?.artifact;
      const next = { ...project, activeVersion: action.id, kind: restored?.kind ?? project.kind };
      persist(projectsRef.current.map((p) => (p.id === next.id ? next : p)));
      setDraft(activeArtifact(next));
      setDirty(false);
      setSlideIndex(0);
      setQuizKey((k) => k + 1);
      setNotice("Đã khôi phục phiên bản đã chọn.");
      setSelectedSkillID(next.kind);
    }
  }
  async function downloadPptx() {
    if (!draft || draft.kind !== "slides" || !validDraft || exporting) return;
    setExporting(true);
    try {
      await exportPowerPoint(draft, theme);
    } catch {
      setError("Không xuất được PowerPoint. Bạn có thể tải HTML hoặc thử lại.");
    } finally {
      setExporting(false);
    }
  }
  useEffect(() => {
    messageEnd.current?.scrollIntoView({ block: "end" });
  }, [project?.messages.length, busy]);
  function htmlDownload() {
    if (draft)
      downloadFile(
        draft.kind === "slides" ? "fortex-slides.html" : "fortex-quiz.html",
        buildTeachingHTML(draft, theme),
        "text/html;charset=utf-8"
      );
  }
  const hasChat = !!project?.messages.length || !!draft || busy;
  const composer = (
    <StudioComposer
      prompt={prompt}
      onPrompt={setPrompt}
      documents={docs}
      onRemove={(id) => {
        const next = docs.filter((d) => d.id !== id);
        setDocs(next);
        persist(
          projectsRef.current.map((p) => (p.id === selectedID ? { ...p, documents: next } : p))
        );
      }}
      onUpload={(files) => void upload(files)}
      skill={selectedSkill}
      onSkills={() => setSkillsOpen(true)}
      count={count}
      onCount={setCount}
      busy={busy}
      uploading={uploading}
      configured={!!status.data?.configured}
      onSend={() => void generate()}
      onCancel={() => void cancel()}
      error={error}
      compact={hasChat}
    />
  );
  return (
    <div className={cn("od-shell teaching-tools", sidebarOpen && "od-shell--history-open")}>
      {sidebarOpen && (
        <button
          className="od-mobile-backdrop"
          aria-label="Đóng thanh hội thoại"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn("od-history", sidebarOpen && "od-history--open")}
        aria-label="Hội thoại AI"
      >
        <div className="od-wordmark">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wand2 className="h-4 w-4" />
          </span>
          Hội thoại<small>AI</small>
        </div>
        <button
          className="od-new-chat"
          disabled={locked || !project}
          onClick={() => (dirty ? setConfirmation({ type: "new", kind }) : create(kind))}
        >
          <Plus className="h-4 w-4" />
          Cuộc trò chuyện mới
        </button>
        <button className="od-side-link" disabled={locked} onClick={() => setSkillsOpen(true)}>
          <Sparkles className="h-4 w-4" />
          Skills
        </button>
        <div className="od-recents">
          <p className="od-recents-label">Hội thoại gần đây</p>
          {loadedFor === userID &&
            projects.map((item) => (
              <div
                key={item.id}
                className="od-recent"
                aria-current={item.id === selectedID ? "true" : undefined}
              >
                <button
                  disabled={locked}
                  onClick={() => {
                    if (item.id === selectedID) {
                      setSidebarOpen(false);
                      return;
                    }
                    if (dirty) setConfirmation({ type: "switch", id: item.id });
                    else selectProject(item);
                  }}
                  title={item.title}
                >
                  {item.title}
                </button>
                {item.id === selectedID && (
                  <button
                    className="od-delete-chat"
                    disabled={locked}
                    aria-label="Xoá hội thoại"
                    onClick={() => setConfirmation({ type: "delete" })}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
        </div>
      </aside>
      <section className="od-main">
        <header className="od-topbar">
          <button
            type="button"
            className="od-mobile-toggle od-icon-button"
            aria-label="Lịch sử hội thoại"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
          <span className="od-topbar-title">
            AI Studio
            {hasChat && (
              <>
                {" "}
                <ChevronRight className="mx-1 inline h-3 w-3" /> {project?.title}
              </>
            )}
          </span>
          <button
            className="od-topbar-action"
            disabled={locked || !project}
            onClick={() => (dirty ? setConfirmation({ type: "new", kind }) : create(kind))}
          >
            <Plus className="h-3.5 w-3.5" /> Tạo mới
          </button>
          <button
            className="od-topbar-action"
            disabled={locked}
            onClick={() => setSkillsOpen(true)}
          >
            <Sparkles className="h-3.5 w-3.5" /> Skills
          </button>
          <span className="od-status">
            <span
              className={cn(
                "od-status-dot",
                status.data?.configured ? "bg-green-500" : "bg-amber-500"
              )}
            />
            {status.data?.configured ? "Viettel AI" : "Chưa cấu hình AI"}
          </span>
          {hasChat && (
            <div className="od-mobile-tabs">
              <button aria-pressed={mobileView === "chat"} onClick={() => setMobileView("chat")}>
                Hội thoại
              </button>
              <button
                aria-pressed={mobileView === "result"}
                onClick={() => setMobileView("result")}
              >
                Kết quả
              </button>
            </div>
          )}
        </header>
        {storageWarning && (
          <p
            role="alert"
            className="mx-4 mb-2 rounded-lg bg-amber-50 p-2 text-[11px] text-amber-900"
          >
            {storageWarning}
          </p>
        )}
        {!hasChat ? (
          <div className="od-home">
            <div className="od-home-inner">
              <div className="od-home-eyebrow">
                <span /> KHÔNG GIAN SÁNG TẠO CỦA GIÁO VIÊN
              </div>
              <div className="od-home-brand">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-foreground text-background">
                  <Wand2 className="h-6 w-6" />
                </span>
                ForteX AI
              </div>
              <h1>
                Từ ý tưởng đến <em>bài giảng.</em>
              </h1>
              <p className="od-home-subtitle">
                Đưa tài liệu vào, nói điều bạn cần. Cùng AI tạo slide và bài kiểm tra cho lớp học.
              </p>
              {composer}
              {!status.data?.configured && (
                <p className="od-config-warning">
                  {status.isPending
                    ? "Đang kiểm tra kết nối…"
                    : status.isError
                      ? "Chưa kết nối được máy chủ AI."
                      : "Cấu hình API key, base URL và model Viettel AI trong env backend để bắt đầu."}
                  <button disabled={status.isFetching} onClick={() => void status.refetch()}>
                    Kiểm tra lại
                  </button>
                </p>
              )}
              <div className="od-output-pills">
                {BUILTIN_SKILLS.map((skill) => (
                  <button
                    key={skill.id}
                    aria-pressed={selectedSkill.id === skill.id}
                    disabled={locked}
                    onClick={() => chooseSkill(skill)}
                  >
                    {skill.output === "slides" ? (
                      <Presentation className="h-4 w-4" />
                    ) : (
                      <ListChecks className="h-4 w-4" />
                    )}
                    {skill.output === "slides" ? "Slide bài giảng" : "Trắc nghiệm"}
                  </button>
                ))}
                <button disabled={locked} onClick={() => setSkillsOpen(true)}>
                  <Sparkles className="h-4 w-4" />
                  Skills
                </button>
              </div>
              <div className="od-starter-grid">
                <button
                  className="od-starter-card"
                  disabled={locked}
                  onClick={() => {
                    chooseSkill(BUILTIN_SKILLS[0]);
                    setPrompt(
                      "Tạo slide từ tài liệu đính kèm, trình bày theo từng ý chính, có ví dụ và câu hỏi thảo luận."
                    );
                  }}
                >
                  <div className="od-starter-visual od-starter-visual--slides">
                    <span className="od-demo-slide">
                      <small>BÀI GIẢNG / 01</small>
                      <b>
                        Kiến thức.
                        <br />
                        Thật dễ hiểu.
                      </b>
                      <i />
                      <i />
                    </span>
                    <Presentation className="od-starter-type" />
                  </div>
                  <strong>
                    Tài liệu thành bài giảng <ChevronRight className="h-3.5 w-3.5" />
                  </strong>
                  <small>Slide rõ ý, có ví dụ và ghi chú giảng dạy</small>
                </button>
                <button
                  className="od-starter-card"
                  disabled={locked}
                  onClick={() => {
                    chooseSkill(BUILTIN_SKILLS[1]);
                    setPrompt(
                      "Tạo bài trắc nghiệm từ tài liệu đính kèm. Mỗi câu có 4 lựa chọn, 1 đáp án đúng và giải thích rõ ràng."
                    );
                  }}
                >
                  <div className="od-starter-visual od-starter-visual--quiz">
                    <span className="od-demo-quiz">
                      <small>CÂU HỎI / 01</small>
                      <b>Cùng kiểm tra kiến thức</b>
                      <i>
                        <span />
                        Đáp án A
                      </i>
                      <i className="od-demo-correct">
                        <span />
                        Đáp án B <span>✓</span>
                      </i>
                      <i>
                        <span />
                        Đáp án C
                      </i>
                    </span>
                    <ListChecks className="od-starter-type" />
                  </div>
                  <strong>
                    Tạo bài trắc nghiệm <ChevronRight className="h-3.5 w-3.5" />
                  </strong>
                  <small>Có đáp án, giải thích và preview làm thử</small>
                </button>
                <button
                  className="od-starter-card"
                  disabled={locked}
                  onClick={() => setSkillsOpen(true)}
                >
                  <div className="od-starter-visual od-starter-visual--skills">
                    <span className="od-demo-skill">
                      <Sparkles className="h-6 w-6" />
                      <b>Phong cách của bạn.</b>
                      <small>SKILL.md</small>
                      <i />
                      <i />
                    </span>
                  </div>
                  <strong>
                    Gắn skill cho AI <ChevronRight className="h-3.5 w-3.5" />
                  </strong>
                  <small>Dạy AI cách soạn bài theo yêu cầu riêng</small>
                </button>
              </div>
              <p className="od-home-foot">
                PDF · Word · PowerPoint · TXT &nbsp;·&nbsp; Tối đa 3 file, 3 MB/file
              </p>
            </div>
          </div>
        ) : (
          <div className="od-studio" data-mobile-view={mobileView}>
            <section className="od-conversation" aria-label="Hội thoại với AI">
              <div className="od-chat-title">
                <MessageSquare className="h-3.5 w-3.5" />
                Hội thoại
                <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-normal text-muted-foreground">
                  <Sparkles className="h-3 w-3" />
                  {selectedSkill.name}
                </span>
              </div>
              <div className="od-messages">
                {project?.messages.map((message, index) => (
                  <StudioChatMessage
                    key={message.id}
                    message={message}
                    artifact={
                      message.role === "assistant" &&
                      !project.messages.slice(index + 1).some((next) => next.role === "assistant")
                        ? draft
                        : undefined
                    }
                    onOpen={() => {
                      setMobileView("result");
                      setTab("preview");
                    }}
                  />
                ))}
                {busy && (
                  <div role="status" className="od-run-card">
                    <div>
                      <span className="od-running-orb" />
                      <strong>
                        Đang tạo{" "}
                        {selectedSkill.output === "slides" ? "bài giảng" : "bài trắc nghiệm"}
                      </strong>
                      <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin" />
                    </div>
                    <p>
                      Đang chờ AI tạo nội dung từ yêu cầu
                      {docs.length ? ` và ${docs.length} tài liệu` : ""} của bạn.
                    </p>
                    <span>
                      <Sparkles className="h-3 w-3" />
                      {selectedSkill.name} · {count}{" "}
                      {selectedSkill.output === "slides" ? "slide" : "câu hỏi"}
                    </span>
                  </div>
                )}
                {notice && !busy && (
                  <p role="status" className="text-[10px] leading-relaxed text-muted-foreground">
                    {notice}
                  </p>
                )}
                <div ref={messageEnd} />
              </div>
              <div className="od-chat-composer">
                {composer}
                <p className="px-1 pt-2 text-center text-[9px] text-muted-foreground">
                  AI có thể mắc lỗi. Hãy kiểm tra nội dung trước khi sử dụng.
                </p>
              </div>
            </section>
            {draft && project ? (
              <ArtifactPane
                project={project}
                draft={draft}
                dirty={dirty}
                busy={locked}
                exporting={exporting}
                valid={validDraft}
                slideIndex={slideIndex}
                onSlideIndex={setSlideIndex}
                tab={tab}
                onTab={setTab}
                onChange={(artifact) => {
                  setDraft(artifact);
                  setDirty(true);
                  setQuizKey((k) => k + 1);
                }}
                onSave={saveEdits}
                onRestore={(id) => setConfirmation({ type: "restore", id })}
                onTheme={(theme) =>
                  persist(
                    projectsRef.current.map((p) => (p.id === project.id ? { ...p, theme } : p))
                  )
                }
                onPowerPoint={() => void downloadPptx()}
                onHTML={htmlDownload}
                onJSON={() =>
                  downloadFile(
                    "fortex-quiz.json",
                    JSON.stringify(draft, null, 2),
                    "application/json"
                  )
                }
                quizKey={quizKey}
              />
            ) : (
              <div className="od-result-pending">
                <Wand2 className="h-8 w-8 opacity-40" />
                <p>
                  {busy ? "Đang chuẩn bị bản nháp…" : "Slide và trắc nghiệm sẽ xuất hiện ở đây"}
                </p>
                <small>Preview · Chỉnh sửa · Xuất tài liệu</small>
              </div>
            )}
          </div>
        )}
      </section>
      <SkillsDialog
        open={skillsOpen}
        onOpenChange={setSkillsOpen}
        skills={customSkills}
        selected={selectedSkill.id}
        onSelect={chooseSkill}
        onSave={saveSkill}
        onDelete={deleteSkill}
      />
      <Dialog
        open={!!confirmation}
        onOpenChange={(open) => {
          if (!open) setConfirmation(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogTitle>
            {confirmation?.type === "delete"
              ? "Xoá hội thoại?"
              : confirmation?.type === "restore"
                ? "Khôi phục phiên bản?"
                : "Rời bản đang chỉnh sửa?"}
          </DialogTitle>
          <DialogDescription>
            {confirmation?.type === "delete"
              ? "Hội thoại và kết quả đã lưu sẽ bị xoá trên trình duyệt này. Hãy tải kết quả trước nếu bạn cần giữ lại."
              : "Chỉnh sửa chưa lưu sẽ bị bỏ. Các phiên bản đã lưu vẫn được giữ để quay lại."}
          </DialogDescription>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmation(null)}>
              Huỷ
            </Button>
            <Button
              variant={confirmation?.type === "delete" ? "destructive" : "default"}
              onClick={confirm}
            >
              {confirmation?.type === "delete"
                ? "Xoá hội thoại"
                : confirmation?.type === "restore"
                  ? "Khôi phục"
                  : "Tiếp tục"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
