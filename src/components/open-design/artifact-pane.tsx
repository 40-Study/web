"use client";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Download, Eye, FilePenLine, Maximize2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { DesignProject, SlideTheme, TeachingArtifact } from "@/lib/open-design/project";
import { cn } from "@/lib/utils";
import { SlideSheet } from "./slide-sheet";
import { ArtifactEditor } from "./artifact-editor";
import { QuizPreview } from "./quiz-preview";
export function ArtifactPane({
  project,
  draft,
  dirty,
  busy,
  exporting,
  valid,
  slideIndex,
  onSlideIndex,
  tab,
  onTab,
  onChange,
  onSave,
  onRestore,
  onTheme,
  onPowerPoint,
  onHTML,
  onJSON,
  quizKey,
}: {
  project: DesignProject;
  draft: TeachingArtifact;
  dirty: boolean;
  busy: boolean;
  exporting: boolean;
  valid: boolean;
  slideIndex: number;
  onSlideIndex: (n: number) => void;
  tab: "preview" | "edit";
  onTab: (tab: "preview" | "edit") => void;
  onChange: (a: TeachingArtifact) => void;
  onSave: () => void;
  onRestore: (id: string) => void;
  onTheme: (t: SlideTheme) => void;
  onPowerPoint: () => void;
  onHTML: () => void;
  onJSON: () => void;
  quizKey: number;
}) {
  const [presenting, setPresenting] = useState(false);
  const selected =
    draft.kind === "slides" ? draft.slides[Math.min(slideIndex, draft.slides.length - 1)] : null;
  return (
    <section
      className="od-artifact-pane"
      data-slide-theme={project.theme}
      aria-label="Preview và chỉnh sửa kết quả"
    >
      <div className="od-artifact-top">
        <span className="min-w-0 flex-1 truncate text-xs font-medium">{draft.title}</span>
        <Button
          size="sm"
          variant="ghost"
          disabled={!dirty || busy}
          onClick={onSave}
          title="Lưu phiên bản"
        >
          <Save className="mr-1.5 h-3.5 w-3.5" />
          Lưu
        </Button>
        <Button
          size="sm"
          disabled={!valid || exporting}
          onClick={draft.kind === "slides" ? onPowerPoint : onHTML}
        >
          <Download className="mr-1.5 h-3.5 w-3.5" />
          {exporting ? "Đang xuất…" : draft.kind === "slides" ? "PowerPoint" : "Tải form"}
        </Button>
      </div>
      <div className="od-artifact-toolbar">
        <div className="od-view-tabs">
          <button aria-pressed={tab === "preview"} onClick={() => onTab("preview")}>
            <Eye className="h-3.5 w-3.5" />
            Preview
          </button>
          <button aria-pressed={tab === "edit"} onClick={() => onTab("edit")}>
            <FilePenLine className="h-3.5 w-3.5" />
            Chỉnh sửa
          </button>
        </div>
        <select
          aria-label="Phiên bản"
          value={project.activeVersion ?? ""}
          disabled={busy}
          onChange={(e) => onRestore(e.target.value)}
        >
          {project.versions.map((v, i) => (
            <option value={v.id} key={v.id}>
              v{i + 1}
              {v.artifact.kind === "slides" ? " · Slide" : " · Quiz"}
            </option>
          ))}
        </select>
        <select
          aria-label="Phong cách"
          value={project.theme}
          disabled={busy}
          onChange={(e) => onTheme(e.target.value as SlideTheme)}
        >
          <option value="blue">ForteX</option>
          <option value="ink">Tối giản</option>
          <option value="forest">Học thuật</option>
        </select>
        {draft.kind === "slides" && (
          <button
            type="button"
            className="od-icon-button ml-auto"
            aria-label="Trình chiếu"
            onClick={() => setPresenting(true)}
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        )}
      </div>
      {dirty && (
        <p className="border-b px-4 py-2 text-[11px] text-amber-700 dark:text-amber-400">
          Có chỉnh sửa chưa lưu.
        </p>
      )}
      <div className="od-artifact-body">
        {tab === "edit" ? (
          <ArtifactEditor
            artifact={draft}
            onChange={onChange}
            slideIndex={slideIndex}
            onSlideIndexChange={onSlideIndex}
            disabled={busy}
          />
        ) : draft.kind === "quiz" ? (
          <QuizPreview key={quizKey} title={draft.title} questions={draft.questions} />
        ) : selected ? (
          <div className="od-deck-layout">
            <nav className="od-slide-rail" aria-label="Danh sách slide">
              {draft.slides.map((slide, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Chọn slide ${i + 1}`}
                  aria-current={slideIndex === i ? "true" : undefined}
                  onClick={() => onSlideIndex(i)}
                >
                  <span>{i + 1}</span>
                  <div className={cn("od-slide-mini", slideIndex === i && "od-slide-mini--active")}>
                    <span>{slide.title}</span>
                  </div>
                </button>
              ))}
            </nav>
            <div className="od-deck-stage">
              <div className="od-deck-sheet">
                <SlideSheet slide={selected} index={slideIndex} total={draft.slides.length} />
              </div>
              <div className="od-deck-controls">
                <button
                  aria-label="Slide trước"
                  disabled={slideIndex === 0}
                  onClick={() => onSlideIndex(slideIndex - 1)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <span>
                  {slideIndex + 1} / {draft.slides.length}
                </span>
                <button
                  aria-label="Slide tiếp"
                  disabled={slideIndex === draft.slides.length - 1}
                  onClick={() => onSlideIndex(slideIndex + 1)}
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <details className="od-speaker-notes">
                <summary>Ghi chú giảng viên</summary>
                <p>{selected.notes || "Chưa có ghi chú cho slide này."}</p>
              </details>
            </div>
          </div>
        ) : null}
      </div>
      <footer className="od-artifact-bottom">
        <span>Bản nháp · chưa xuất bản</span>
        <button disabled={!valid} onClick={draft.kind === "slides" ? onHTML : onJSON}>
          {draft.kind === "slides" ? "Xuất HTML" : "Câu hỏi & đáp án JSON"}
        </button>
      </footer>
      <Dialog open={presenting} onOpenChange={setPresenting}>
        <DialogContent className="teaching-tools w-[95vw] max-w-[1400px] bg-background p-4">
          <DialogTitle>Trình chiếu</DialogTitle>
          {draft.kind === "slides" && selected && (
            <div
              data-slide-theme={project.theme}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") {
                  e.preventDefault();
                  onSlideIndex(Math.min(draft.slides.length - 1, slideIndex + 1));
                }
                if (e.key === "ArrowLeft") {
                  e.preventDefault();
                  onSlideIndex(Math.max(0, slideIndex - 1));
                }
              }}
            >
              <SlideSheet slide={selected} index={slideIndex} total={draft.slides.length} />
              <div className="od-deck-controls">
                <Button
                  variant="outline"
                  disabled={slideIndex === 0}
                  onClick={() => onSlideIndex(slideIndex - 1)}
                >
                  Trước
                </Button>
                <span>
                  {slideIndex + 1}/{draft.slides.length}
                </span>
                <Button
                  disabled={slideIndex === draft.slides.length - 1}
                  onClick={() => onSlideIndex(slideIndex + 1)}
                >
                  Tiếp
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
