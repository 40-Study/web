import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
const require = createRequire(import.meta.url);
const root = dirname(require.resolve("monaco-editor/package.json"));
const { version } = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const target = new URL("../public/monaco/", import.meta.url);
let current = "";
try {
  current = await readFile(new URL("version", target), "utf8");
} catch {}
if (current !== version) {
  await mkdir(target, { recursive: true });
  await cp(resolve(root, "min/vs"), new URL("vs", target), { recursive: true });
  await writeFile(new URL("version", target), version);
}
