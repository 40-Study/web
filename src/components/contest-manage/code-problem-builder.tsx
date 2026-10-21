"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ContestCodeProblemInput } from "@/types/contest";
export const emptyCodeProblem = (): ContestCodeProblemInput => ({
  title: "",
  description: "",
  difficulty: "EASY",
  points: 100,
  time_limit_seconds: 2,
  memory_limit_mb: 128,
  tests: [{ input: "", expected_output: "", hidden: false }],
});
export function CodeProblemBuilder({
  value,
  onChange,
}: {
  value: ContestCodeProblemInput[];
  onChange: (v: ContestCodeProblemInput[]) => void;
}) {
  const update = (index: number, change: Partial<ContestCodeProblemInput>) =>
    onChange(value.map((p, i) => (i === index ? { ...p, ...change } : p)));
  return (
    <div className="space-y-4">
      {value.map((p, i) => (
        <section key={i} className="space-y-3 rounded-xl border p-4">
          <div className="flex justify-between">
            <h3 className="font-semibold">Bài {i + 1}</h3>
            {value.length > 1 && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onChange(value.filter((_, n) => n !== i))}
              >
                Xoá bài {i + 1}
              </Button>
            )}
          </div>
          <Input
            label={`Tiêu đề bài ${i + 1}`}
            value={p.title}
            onChange={(e) => update(i, { title: e.target.value })}
          />
          <Textarea
            label={`Đề bài ${i + 1}`}
            value={p.description}
            rows={4}
            onChange={(e) => update(i, { description: e.target.value })}
            placeholder="Mô tả đề, định dạng đầu vào, đầu ra và ràng buộc."
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className="text-sm">
              Độ khó
              <select
                aria-label={`Độ khó bài ${i + 1}`}
                className="mt-1 h-10 w-full rounded-lg border bg-background p-2"
                value={p.difficulty}
                onChange={(e) =>
                  update(i, { difficulty: e.target.value as ContestCodeProblemInput["difficulty"] })
                }
              >
                <option value="EASY">Dễ</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="HARD">Khó</option>
              </select>
            </label>
            <Input
              label={`Điểm bài ${i + 1}`}
              type="number"
              min={1}
              max={1000}
              value={p.points}
              onChange={(e) => update(i, { points: Number(e.target.value) })}
            />
            <Input
              label={`CPU bài ${i + 1} (giây)`}
              type="number"
              min={1}
              max={10}
              value={p.time_limit_seconds}
              onChange={(e) => update(i, { time_limit_seconds: Number(e.target.value) })}
            />
            <Input
              label={`RAM bài ${i + 1} (MB)`}
              type="number"
              min={32}
              max={256}
              value={p.memory_limit_mb}
              onChange={(e) => update(i, { memory_limit_mb: Number(e.target.value) })}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Test mẫu hiển thị trong đề. Test ẩn chỉ dùng để chấm trên máy chủ.
          </p>
          {p.tests.map((t, j) => (
            <div key={j} className="space-y-2 rounded-lg border bg-muted/20 p-3">
              <div className="flex items-center justify-between text-sm">
                <span>Test {j + 1}</span>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={t.hidden}
                    onChange={(e) =>
                      update(i, {
                        tests: p.tests.map((test, n) =>
                          n === j ? { ...test, hidden: e.target.checked } : test
                        ),
                      })
                    }
                  />
                  Test ẩn
                </label>
                {p.tests.length > 1 && (
                  <button
                    type="button"
                    onClick={() => update(i, { tests: p.tests.filter((_, n) => n !== j) })}
                  >
                    Xoá test
                  </button>
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Textarea
                  label={`Input bài ${i + 1} test ${j + 1}`}
                  value={t.input}
                  onChange={(e) =>
                    update(i, {
                      tests: p.tests.map((test, n) =>
                        n === j ? { ...test, input: e.target.value } : test
                      ),
                    })
                  }
                  className="font-mono"
                />
                <Textarea
                  label={`Output bài ${i + 1} test ${j + 1}`}
                  value={t.expected_output}
                  onChange={(e) =>
                    update(i, {
                      tests: p.tests.map((test, n) =>
                        n === j ? { ...test, expected_output: e.target.value } : test
                      ),
                    })
                  }
                  className="font-mono"
                />
              </div>
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={p.tests.length >= 10}
            onClick={() =>
              update(i, { tests: [...p.tests, { input: "", expected_output: "", hidden: true }] })
            }
          >
            Thêm test case
          </Button>
        </section>
      ))}
      <Button
        type="button"
        variant="outline"
        disabled={value.length >= 10}
        onClick={() => onChange([...value, emptyCodeProblem()])}
      >
        Thêm bài code
      </Button>
    </div>
  );
}
