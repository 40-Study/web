import { useState, useCallback, useEffect, useRef } from "react";
import { apiListFiles } from "../api/filesApi";
import type { FileEntry } from "../types";

interface FolderData {
  children: FileEntry[];
  loading: boolean;
  loaded: boolean;
}

// Demo data shown when API is unreachable
const DEMO: Record<string, FileEntry[]> = {
  "": [
    { name: "solutions", isFolder: true  },
    { name: "templates", isFolder: true  },
    { name: "main.py",   isFolder: false, size: 1024 },
    { name: "hello.js",  isFolder: false, size: 512  },
    { name: "sort.cpp",  isFolder: false, size: 2048 },
    { name: "query.sql", isFolder: false, size: 256  },
    { name: "index.html",isFolder: false, size: 768  },
  ],
  "solutions": [
    { name: "dp.py",      isFolder: false, size: 2048 },
    { name: "greedy.cpp", isFolder: false, size: 1536 },
    { name: "graph",      isFolder: true  },
  ],
  "templates": [
    { name: "starter.py",     isFolder: false, size: 512  },
    { name: "template.cpp",   isFolder: false, size: 1024 },
    { name: "boilerplate.js", isFolder: false, size: 768  },
  ],
  "solutions/graph": [
    { name: "bfs.py", isFolder: false, size: 1024 },
    { name: "dfs.c",  isFolder: false, size: 1024 },
  ],
};

export function useFileTree(refreshTrigger = 0, activeFilePath = "") {
  const [folderMap, setFolderMap] = useState<Record<string, FolderData>>({});
  const [expanded,  setExpanded]  = useState<Set<string>>(new Set());

  const folderMapRef = useRef(folderMap);
  folderMapRef.current = folderMap;

  // ── Load a folder from API ─────────────────────────────────────────────────
  const loadFolder = useCallback(async (path: string, force = false) => {
    const cur = folderMapRef.current[path];
    if (!force && (cur?.loaded || cur?.loading)) return;
    setFolderMap((p) => ({
      ...p,
      [path]: { children: p[path]?.children ?? [], loading: true, loaded: false },
    }));
    try {
      const list: FileEntry[] = await apiListFiles(path);
      setFolderMap((p) => ({ ...p, [path]: { children: list, loading: false, loaded: true } }));
    } catch {
      setFolderMap((p) => ({
        ...p,
        [path]: { children: DEMO[path] ?? [], loading: false, loaded: true },
      }));
    }
  }, []);

  // Initial load
  useEffect(() => { loadFolder(""); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-expand ancestor folders when active file changes
  useEffect(() => {
    if (!activeFilePath) return;
    const parts = activeFilePath.split("/");
    if (parts.length < 2) return;
    const ancestors: string[] = [];
    for (let i = 1; i < parts.length; i++) ancestors.push(parts.slice(0, i).join("/"));
    setExpanded((prev) => {
      const next = new Set(prev);
      let changed = false;
      for (const p of ancestors) {
        if (!next.has(p)) { next.add(p); changed = true; loadFolder(p); }
      }
      return changed ? next : prev;
    });
  }, [activeFilePath, loadFolder]);

  // Refresh tree when refreshTrigger increments
  const prevTrigger = useRef(0);
  useEffect(() => {
    if (refreshTrigger > 0 && refreshTrigger !== prevTrigger.current) {
      prevTrigger.current = refreshTrigger;
      setFolderMap((prev) => {
        const next: Record<string, FolderData> = {};
        for (const k of Object.keys(prev)) next[k] = { ...prev[k], loaded: false, loading: false };
        return next;
      });
      loadFolder("", true);
    }
  }, [refreshTrigger, loadFolder]);

  // ── Toggle expand/collapse ─────────────────────────────────────────────────
  const toggleFolder = useCallback((fullPath: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(fullPath)) next.delete(fullPath);
      else { next.add(fullPath); loadFolder(fullPath); }
      return next;
    });
  }, [loadFolder]);

  // ── Optimistic folder mutations (used by useFileCRUD) ─────────────────────
  const mutateFolder = useCallback((parentPath: string, fn: (ch: FileEntry[]) => FileEntry[]) => {
    setFolderMap((prev) => {
      const data = prev[parentPath];
      if (!data) return prev;
      return { ...prev, [parentPath]: { ...data, children: fn(data.children) } };
    });
  }, []);

  const addFolderEntry = useCallback((path: string) => {
    setFolderMap((p) => ({ ...p, [path]: { children: [], loading: false, loaded: true } }));
  }, []);

  const expandFolder = useCallback((path: string) => {
    setExpanded((p) => { const n = new Set(p); n.add(path); return n; });
  }, []);

  const removeFolderBranch = useCallback((fullPath: string) => {
    setFolderMap((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        if (k === fullPath || k.startsWith(fullPath + "/")) delete next[k];
      }
      return next;
    });
    setExpanded((prev) => {
      const n = new Set(prev);
      Array.from(n).forEach((k) => { if (k === fullPath || k.startsWith(fullPath + "/")) n.delete(k); });
      return n;
    });
  }, []);

  return {
    folderMap,
    expanded,
    loadFolder,
    toggleFolder,
    mutateFolder,
    addFolderEntry,
    expandFolder,
    removeFolderBranch,
  };
}
