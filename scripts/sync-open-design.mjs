import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = await readFile(path.join(root, "src/app/globals.css"), "utf8");
const block = (selector) => {
  const body = source.match(new RegExp(`${selector} \\{([\\s\\S]*?)\\n\\}`))?.[1];
  if (!body) throw new Error(`Missing token selector: ${selector}`);
  return Object.fromEntries(
    [...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()])
  );
};
const light = block(":root");
const dark = block("\\.dark");
const cssBlock = (selector, values) =>
  `${selector} {\n${Object.entries(values)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n")}\n}`;
const css = `/* Generated from web/src/app/globals.css. Run npm run design:sync. */\n${cssBlock(":root", light)}\n${cssBlock(".dark", dark)}\nbody { margin: 0; font-family: Inter, system-ui, sans-serif; background: hsl(var(--background)); color: hsl(var(--foreground)); line-height: 1.5; }\nh1,h2,h3 { font-family: 'Plus Jakarta Sans', Inter, system-ui, sans-serif; line-height: 1.25; }\n* { box-sizing: border-box; }\n`;
const toolStyles = source.slice(source.indexOf("/* Teaching tools:"));
const teachingDesign = `# ForteX teaching tools
\n## Brand\nPreserve ForteX's educational blue identity. Semantic tokens come from globals.css and Tailwind mappings from tailwind.config.ts.
\n## Typography\nInter/system-ui body, Plus Jakarta Sans/Inter headings. Support Vietnamese. Body line-height >= 1.5; headings >= 1.15. Slide text must be concise and legible on a projector.
\n## Surfaces\nBackground, card, foreground, muted, border, primary and ring support light and dark. Scoped --tool-* and --slide-* tokens add presentation surfaces and themes.
\n## Structure\nSlides use 16:9, thumbnails and speaker notes. Quizzes have exactly four options and one correct answer per question, plus an explanation. The application renders structured JSON. Do not generate HTML or executable scripts.
\n## Shape and spacing\nControls 10px, cards 16px, dialogs 24px. Spacing uses 4px steps and an 8px rhythm through --space-*.
\n## Accessibility\nUse semantic labels, keyboard focus, accessible contrast and responsive forms. Trial quizzes grade locally after submission.
\n## Workflow\nInspired by nexu-io/open-design (Apache-2.0): source documents + brief -> slides or quiz -> draft -> preview -> refine -> export. Verify correct answers against source documents. The teacher reviews before use. Never claim publication to a course.
`;
const result = {
  name: "ForteX",
  version: 2,
  light,
  dark,
  css: css + toolStyles,
  design: teachingDesign,
};
await writeFile(
  path.join(root, "src/lib/open-design/design-system.generated.json"),
  JSON.stringify(result, null, 2) + "\n"
);
for (const dir of [
  path.join(root, "public/open-design"),
  path.resolve(root, "../backend/internal/service/open_design_assets"),
]) {
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "tokens.css"), css + toolStyles);
  await writeFile(path.join(dir, "DESIGN.md"), teachingDesign);
}
console.log(
  `Exported ${Object.keys(light).length} light tokens + ${Object.keys(dark).length} dark overrides.`
);
