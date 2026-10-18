import type { Metadata } from "next";
import { OpenDesignWorkspace } from "@/components/open-design/workspace";

export const metadata: Metadata = { title: "AI Studio", robots: { index: false, follow: false } };
export default function AIStudioPage() {
  return <OpenDesignWorkspace />;
}
