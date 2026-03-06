import { useState, useCallback, useRef, useEffect } from "react";
import { apiCreateFile, apiCreateFolder, apiRenameItem, apiDeleteItem } from "../api/filesApi";
import type { FileEntry } from "../types";

type MutateFn = (parentPath: string, fn: (ch: FileEntry[]) => FileEntry[]) => void;
type AddFolderFn = (path: string) => void;
type ExpandFn = (path: string) => void;
type RemoveBranchFn = (fullPath: string) => void;
type LoadFolderFn = (path: string, force?: boolean) => Promise<void>;

interface Options {
  mutateFolder: MutateFn;
  addFolderEntry: AddFolderFn;
  expandFolder: ExpandFn;
  removeFolderBranch: RemoveBranchFn;
  loadFolder: LoadFolderFn;
}

export function useFileCRUD({
  mutateFolder,
  addFolderEntry,
  expandFolder,
  removeFolderBranch,
  loadFolder,
}: Options) {
  const [creating,      setCreating]     = useState<{ parentPath: string; type: "file" | "folder" } | null>(null);
  const [createValue,   setCreateValue]  = useState("");
  const [renamingPath,  setRenamingPath] = useState<string | null>(null);
  const [renameValue,   setRenameValue]  = useState("");

  const createInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (creating)     setTimeout(() => createInputRef.current?.focus(), 30); }, [creating]);
  useEffect(() => { if (renamingPath) setTimeout(() => renameInputRef.current?.focus(), 30); }, [renamingPath]);

  // ── Start creating a file or folder ────────────────────────────────────────
  const startCreate = useCallback((parentPath: string, type: "file" | "folder") => {
    if (parentPath !== "") {
      expandFolder(parentPath);
      loadFolder(parentPath);
    }
    setCreating({ parentPath, type });
    setCreateValue("");
  }, [expandFolder, loadFolder]);

  // ── Commit the create action ───────────────────────────────────────────────
  const commitCreate = useCallback(() => {
    if (!creating) return;
    const name = createValue.trim();
    if (!name || name.includes("/")) { setCreating(null); setCreateValue(""); return; }
    const { parentPath, type } = creating;
    const fullPath = parentPath ? `${parentPath}/${name}` : name;
    const isFolder = type === "folder";

    mutateFolder(parentPath, (ch) => {
      if (ch.find((c) => c.name === name)) return ch;
      const entry: FileEntry = { name, isFolder, size: isFolder ? undefined : 0 };
      const folders = ch.filter((c) => c.isFolder);
      const files   = ch.filter((c) => !c.isFolder);
      return isFolder ? [...folders, entry, ...files] : [...folders, ...files, entry];
    });

    if (isFolder) {
      addFolderEntry(fullPath);
      expandFolder(fullPath);
      apiCreateFolder(fullPath).catch(() => {});
    } else {
      apiCreateFile(fullPath).catch(() => {});
    }
    setCreating(null);
    setCreateValue("");
  }, [creating, createValue, mutateFolder, addFolderEntry, expandFolder]);

  // ── Start renaming ─────────────────────────────────────────────────────────
  const startRename = useCallback((fullPath: string, currentName: string) => {
    setRenamingPath(fullPath);
    setRenameValue(currentName);
  }, []);

  // ── Commit rename ──────────────────────────────────────────────────────────
  const commitRename = useCallback(() => {
    if (!renamingPath) return;
    const newName = renameValue.trim();
    const parts = renamingPath.split("/");
    const oldName = parts[parts.length - 1];
    const parentPath = parts.slice(0, -1).join("/");
    if (!newName || newName === oldName || newName.includes("/")) { setRenamingPath(null); return; }
    const newPath = parentPath ? `${parentPath}/${newName}` : newName;
    mutateFolder(parentPath, (ch) => ch.map((c) => c.name === oldName ? { ...c, name: newName } : c));
    apiRenameItem(renamingPath, newPath).catch(() => {});
    setRenamingPath(null);
  }, [renamingPath, renameValue, mutateFolder]);

  // ── Delete file/folder ─────────────────────────────────────────────────────
  const handleDelete = useCallback((fullPath: string, name: string, isFolder: boolean) => {
    const what = isFolder ? `folder "${name}" and all its contents` : `file "${name}"`;
    if (!window.confirm(`Delete ${what}?`)) return;
    const parts = fullPath.split("/");
    const parentPath = parts.slice(0, -1).join("/");
    mutateFolder(parentPath, (ch) => ch.filter((c) => c.name !== name));
    if (isFolder) removeFolderBranch(fullPath);
    apiDeleteItem(fullPath).catch(() => {});
  }, [mutateFolder, removeFolderBranch]);

  return {
    creating,     setCreating,
    createValue,  setCreateValue,
    createInputRef,
    commitCreate,
    startCreate,
    renamingPath, setRenamingPath,
    renameValue,  setRenameValue,
    renameInputRef,
    commitRename,
    startRename,
    handleDelete,
  };
}
