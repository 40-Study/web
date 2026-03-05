import type { Metadata } from "next";
import CodeEditor from "@/components/code_sanbox/CodeEditor";

export const metadata: Metadata = {
  title: "Code Editor",
  description: "Online code editor with Judge0",
};

export default function EditorPage() {
  return <CodeEditor />;
}
