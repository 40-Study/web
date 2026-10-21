"use client";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TeachingArtifact, TeachingSlide } from "@/lib/open-design/project";
const input = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm";
export function ArtifactEditor({
  artifact,
  onChange,
  slideIndex,
  onSlideIndexChange,
  disabled = false,
}: {
  artifact: TeachingArtifact;
  onChange: (a: TeachingArtifact) => void;
  slideIndex: number;
  onSlideIndexChange: (i: number) => void;
  disabled?: boolean;
}) {
  function updateSlide(patch: Partial<TeachingSlide>) {
    if (artifact.kind === "slides")
      onChange({
        ...artifact,
        slides: artifact.slides.map((s, i) => (i === slideIndex ? { ...s, ...patch } : s)),
      });
  }
  return (
    <fieldset disabled={disabled} className="space-y-5 p-4 sm:p-6">
      <div>
        <label className="mb-2 block text-sm font-semibold" htmlFor="artifact-title">
          Tên {artifact.kind === "slides" ? "bộ slide" : "bài trắc nghiệm"}
        </label>
        <input
          id="artifact-title"
          maxLength={160}
          value={artifact.title}
          onChange={(e) => onChange({ ...artifact, title: e.target.value })}
          className={input}
        />
      </div>
      {artifact.kind === "slides" ? (
        (() => {
          const slide = artifact.slides[slideIndex];
          if (!slide) return null;
          return (
            <div className="space-y-4 rounded-card border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold">Chỉnh sửa slide {slideIndex + 1}</h3>
                <Button
                  type="button"
                  variant="destructiveGhost"
                  size="sm"
                  disabled={artifact.slides.length === 1}
                  onClick={() => {
                    onChange({
                      ...artifact,
                      slides: artifact.slides.filter((_, i) => i !== slideIndex),
                    });
                    onSlideIndexChange(Math.max(0, slideIndex - 1));
                  }}
                >
                  Xoá slide
                </Button>
              </div>
              <label className="block text-sm">
                Tiêu đề slide
                <input
                  aria-label="Tiêu đề slide"
                  maxLength={140}
                  value={slide.title}
                  onChange={(e) => updateSlide({ title: e.target.value })}
                  className={`${input} mt-2`}
                />
              </label>
              <label className="block text-sm">
                Mô tả ngắn
                <textarea
                  aria-label="Mô tả ngắn"
                  maxLength={320}
                  value={slide.subtitle}
                  onChange={(e) => updateSlide({ subtitle: e.target.value })}
                  className={`${input} mt-2`}
                  rows={2}
                />
              </label>
              <label className="block text-sm">
                Bố cục
                <select
                  aria-label="Bố cục slide"
                  value={slide.layout}
                  onChange={(e) =>
                    updateSlide({ layout: e.target.value as TeachingSlide["layout"] })
                  }
                  className={`${input} mt-2`}
                >
                  <option value="cover">Trang bìa</option>
                  <option value="content">Nội dung</option>
                  <option value="split">Hai cột</option>
                  <option value="summary">Tổng kết</option>
                </select>
              </label>
              <div>
                <p className="mb-2 text-sm">Ý chính (tối đa 6)</p>
                {slide.bullets.map((b, i) => (
                  <div key={i} className="mb-2 flex items-center gap-2">
                    <input
                      aria-label={`Ý chính ${i + 1}`}
                      maxLength={240}
                      value={b}
                      onChange={(e) =>
                        updateSlide({
                          bullets: slide.bullets.map((v, j) => (j === i ? e.target.value : v)),
                        })
                      }
                      className={input}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label={`Xoá ý ${i + 1}`}
                      onClick={() =>
                        updateSlide({ bullets: slide.bullets.filter((_, j) => j !== i) })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={slide.bullets.length >= 6}
                  onClick={() => updateSlide({ bullets: [...slide.bullets, "Ý chính mới"] })}
                >
                  Thêm ý chính
                </Button>
              </div>
              <label className="block text-sm">
                Ghi chú giảng viên
                <textarea
                  aria-label="Ghi chú giảng viên"
                  maxLength={3000}
                  value={slide.notes}
                  onChange={(e) => updateSlide({ notes: e.target.value })}
                  className={`${input} mt-2`}
                  rows={4}
                />
              </label>
              <Button
                type="button"
                variant="outline"
                disabled={artifact.slides.length >= 20}
                onClick={() => {
                  onChange({
                    ...artifact,
                    slides: [
                      ...artifact.slides,
                      {
                        title: "Slide mới",
                        subtitle: "",
                        bullets: ["Nội dung mới"],
                        notes: "",
                        layout: "content",
                      },
                    ],
                  });
                  onSlideIndexChange(artifact.slides.length);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Thêm slide
              </Button>
            </div>
          );
        })()
      ) : (
        <div className="space-y-5">
          {artifact.questions.map((q, index) => (
            <section key={index} className="space-y-4 rounded-card border bg-card p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Câu {index + 1}</h3>
                <Button
                  type="button"
                  variant="destructiveGhost"
                  size="sm"
                  aria-label={`Xoá câu ${index + 1}`}
                  disabled={artifact.questions.length === 1}
                  onClick={() =>
                    onChange({
                      ...artifact,
                      questions: artifact.questions.filter((_, i) => i !== index),
                    })
                  }
                >
                  Xoá câu
                </Button>
              </div>
              <label className="block text-sm">
                Câu hỏi
                <textarea
                  aria-label={`Câu hỏi ${index + 1}`}
                  maxLength={1000}
                  rows={2}
                  value={q.question}
                  onChange={(e) =>
                    onChange({
                      ...artifact,
                      questions: artifact.questions.map((item, i) =>
                        i === index ? { ...item, question: e.target.value } : item
                      ),
                    })
                  }
                  className={`${input} mt-2`}
                />
              </label>
              <fieldset className="space-y-2">
                <legend className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Chọn một đáp án đúng
                </legend>
                {q.options.map((option, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${index}`}
                      aria-label={`Câu ${index + 1}: đáp án ${String.fromCharCode(65 + j)} đúng`}
                      checked={q.correct_answer === j}
                      onChange={() =>
                        onChange({
                          ...artifact,
                          questions: artifact.questions.map((item, i) =>
                            i === index ? { ...item, correct_answer: j } : item
                          ),
                        })
                      }
                      className="accent-green-600"
                    />
                    <span className="text-xs font-semibold">{String.fromCharCode(65 + j)}</span>
                    <input
                      aria-label={`Câu ${index + 1}, lựa chọn ${String.fromCharCode(65 + j)}`}
                      maxLength={500}
                      value={option}
                      onChange={(e) =>
                        onChange({
                          ...artifact,
                          questions: artifact.questions.map((item, i) =>
                            i === index
                              ? {
                                  ...item,
                                  options: item.options.map((o, k) =>
                                    k === j ? e.target.value : o
                                  ),
                                }
                              : item
                          ),
                        })
                      }
                      className={input}
                    />
                  </div>
                ))}
              </fieldset>
              <label className="block text-sm">
                Giải thích đáp án
                <textarea
                  aria-label={`Giải thích câu ${index + 1}`}
                  maxLength={1600}
                  value={q.explanation}
                  rows={3}
                  onChange={(e) =>
                    onChange({
                      ...artifact,
                      questions: artifact.questions.map((item, i) =>
                        i === index ? { ...item, explanation: e.target.value } : item
                      ),
                    })
                  }
                  className={`${input} mt-2`}
                />
              </label>
            </section>
          ))}
          <Button
            type="button"
            variant="outline"
            disabled={artifact.questions.length >= 30}
            onClick={() =>
              onChange({
                ...artifact,
                questions: [
                  ...artifact.questions,
                  {
                    question: "Câu hỏi mới",
                    options: ["Lựa chọn A", "Lựa chọn B", "Lựa chọn C", "Lựa chọn D"],
                    correct_answer: 0,
                    explanation: "Giải thích đáp án đúng.",
                  },
                ],
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm câu hỏi
          </Button>
        </div>
      )}
    </fieldset>
  );
}
