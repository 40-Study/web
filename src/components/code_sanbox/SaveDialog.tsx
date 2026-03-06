"use client";
import { memo } from "react";
import type { Theme, Language } from "./types";

interface Props {
  T: Theme;
  currentPath: string;
  saveFileName: string;
  setSaveFileName: (v: string) => void;
  saving: boolean;
  saveFile: () => void;
  setSaveDialog: (v: boolean) => void;
  lang: Language;
}

const SaveDialog = memo(
  ({ T, currentPath, saveFileName, setSaveFileName, saving, saveFile, setSaveDialog, lang }: Props) => (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) setSaveDialog(false); }}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.5)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      }}
    >
      <div
        style={{
          background: T.sidebar, border: `1px solid ${T.border}`,
          borderRadius: 3, padding: 20, width: 340,
          boxShadow: "0 8px 28px rgba(0,0,0,.4)",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 10, fontFamily: "var(--font-mono)" }}>
          Save to MinIO
        </div>
        <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8 }}>
          /{currentPath || "root"}/
        </div>
        <input
          value={saveFileName}
          onChange={(e) => setSaveFileName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && saveFile()}
          autoFocus
          style={{
            width: "100%", background: T.inputBg, border: `1px solid ${T.border}`,
            borderRadius: 2, padding: "5px 9px", color: T.text,
            fontFamily: "var(--font-mono)", fontSize: 12, marginBottom: 14,
          }}
          placeholder={`untitled${lang.ext}`}
        />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={() => setSaveDialog(false)}
            style={{
              background: T.inputBg, border: `1px solid ${T.border}`,
              color: T.textDim, borderRadius: 2, padding: "4px 13px",
              fontSize: 12, cursor: "pointer", fontFamily: "var(--font-mono)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={saveFile}
            disabled={saving}
            style={{
              background: T.runBtn, border: "none", color: "#fff",
              borderRadius: 2, padding: "4px 16px", fontSize: 12,
              fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "var(--font-mono)",
            }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  )
);
SaveDialog.displayName = "SaveDialog";
export default SaveDialog;
