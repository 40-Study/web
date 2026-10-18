"use client";
import { useRef, useState } from "react";
import { Check, FileUp, ListChecks, Plus, Presentation, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { BUILTIN_SKILLS, teachingSkillSchema, type TeachingSkill } from "@/lib/open-design/skills";
export function SkillsDialog({
  open,
  onOpenChange,
  skills,
  selected,
  onSelect,
  onSave,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skills: TeachingSkill[];
  selected: string;
  onSelect: (skill: TeachingSkill) => void;
  onSave: (skill: TeachingSkill) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [output, setOutput] = useState<"slides" | "quiz">("slides");
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  function save() {
    const result = teachingSkillSchema.safeParse({
      id: crypto.randomUUID(),
      name,
      description: "Skill cá nhân",
      instructions,
      output,
    });
    if (!result.success) {
      setError("Nhập tên skill và hướng dẫn (tối đa 8.000 ký tự).");
      return;
    }
    onSave(result.data);
    setEditing(false);
    setName("");
    setInstructions("");
    setError("");
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        onOpenChange(value);
        if (!value) {
          setEditing(false);
          setError("");
        }
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogTitle>Skills</DialogTitle>
        <DialogDescription>
          Gắn một skill vào hội thoại để AI tạo đúng thứ bạn cần.
        </DialogDescription>
        {editing ? (
          <div className="mt-5 space-y-4">
            <label className="block text-sm">
              Tên skill
              <input
                aria-label="Tên skill"
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              Đầu ra
              <select
                aria-label="Đầu ra của skill"
                value={output}
                onChange={(e) => setOutput(e.target.value as "slides" | "quiz")}
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2"
              >
                <option value="slides">Slide</option>
                <option value="quiz">Trắc nghiệm</option>
              </select>
            </label>
            <label className="block text-sm">
              Hướng dẫn cho AI
              <textarea
                aria-label="Hướng dẫn skill"
                rows={7}
                maxLength={8000}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                placeholder="Mục tiêu, cách tạo nội dung, giọng văn, cấu trúc và các điều cần kiểm tra…"
              />
            </label>
            <input
              ref={input}
              type="file"
              accept=".md,.txt"
              aria-label="Nhập file skill"
              className="sr-only"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 32000 || !/\.(md|txt)$/i.test(file.name)) {
                  setError("Dùng file Markdown/TXT tối đa 32 KB.");
                  return;
                }
                const text = await file.text();
                if (text.length > 8000) {
                  setError("Hướng dẫn skill tối đa 8.000 ký tự.");
                  return;
                }
                setInstructions(text);
                if (!name) setName(file.name.replace(/\.(md|txt)$/i, ""));
                e.target.value = "";
              }}
            />
            {error && (
              <p role="alert" className="text-xs text-red-600">
                {error}
              </p>
            )}
            <div className="flex flex-wrap justify-between gap-2">
              <Button variant="outline" onClick={() => input.current?.click()}>
                <FileUp className="mr-2 h-4 w-4" />
                Nhập SKILL.md
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setEditing(false)}>
                  Quay lại
                </Button>
                <Button onClick={save}>Lưu skill</Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-2">
            {[...BUILTIN_SKILLS, ...skills].map((skill) => (
              <div key={skill.id} className="flex items-center rounded-xl border hover:bg-muted/50">
                <button
                  className="flex flex-1 items-start gap-3 p-4 text-left"
                  onClick={() => {
                    onSelect(skill);
                    onOpenChange(false);
                  }}
                >
                  <span className="rounded-lg bg-muted p-2">
                    {skill.output === "slides" ? (
                      <Presentation className="h-4 w-4" />
                    ) : (
                      <ListChecks className="h-4 w-4" />
                    )}
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">{skill.name}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {skill.description}
                    </span>
                  </span>
                  {selected === skill.id && <Check className="h-4 w-4 text-primary" />}
                </button>
                {!BUILTIN_SKILLS.some((s) => s.id === skill.id) && (
                  <button
                    aria-label={`Xóa skill ${skill.name}`}
                    className="mr-3 rounded-lg p-2 text-muted-foreground hover:text-red-600"
                    onClick={() => onDelete(skill.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              className="mt-4 w-full"
              disabled={skills.length >= 20}
              onClick={() => setEditing(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Thêm skill của bạn
            </Button>
            <p className="pt-2 text-[11px] leading-relaxed text-muted-foreground">
              Skill hướng dẫn cách AI viết nội dung. Được lưu riêng trên trình duyệt; không chạy mã
              hoặc cài công cụ bên ngoài.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
