"use client";

import { useState, useCallback, useRef } from "react";
import {
  Upload,
  File,
  FileText,
  Image,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface UploadedDocument {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  url?: string;
  error?: string;
}

interface DocumentUploadProps {
  onUpload?: (files: File[]) => Promise<void>;
  onRemove?: (documentId: string) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
  className?: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const DEFAULT_ACCEPTED_TYPES = [".pdf", ".doc", ".docx", ".md", ".png", ".jpg", ".jpeg"];
const DEFAULT_MAX_SIZE = 50 * 1024 * 1024; // 50MB
const DEFAULT_MAX_FILES = 10;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return Image;
  if (type === "application/pdf") return FileText;
  return File;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// ─── Component ─────────────────────────────────────────────────────────────

export function DocumentUpload({
  onUpload,
  onRemove,
  maxFiles = DEFAULT_MAX_FILES,
  maxSize = DEFAULT_MAX_SIZE,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  className,
}: DocumentUploadProps) {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file size
      if (file.size > maxSize) {
        return `File qua lon. Kich thuoc toi da ${formatFileSize(maxSize)}`;
      }

      // Check file type
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      const mimeMatch = acceptedTypes.some(
        (type) => type.startsWith(".") && ext === type.toLowerCase()
      );
      if (!mimeMatch) {
        return `Dinh dang khong duoc ho tro. Chi chap nhan: ${acceptedTypes.join(", ")}`;
      }

      return null;
    },
    [maxSize, acceptedTypes]
  );

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remainingSlots = maxFiles - documents.length;

      if (fileArray.length > remainingSlots) {
        alert(`Chi co the tai len toi da ${maxFiles} files`);
        return;
      }

      // Create document entries
      const newDocs: UploadedDocument[] = [];
      for (const file of fileArray) {
        const error = validateFile(file);
        newDocs.push({
          id: generateId(),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          status: error ? "error" : "pending",
          progress: 0,
          error: error || undefined,
        });
      }

      setDocuments((prev) => [...prev, ...newDocs]);

      // Upload valid files
      const validDocs = newDocs.filter((d) => d.status === "pending");
      if (validDocs.length > 0 && onUpload) {
        // Update status to uploading
        setDocuments((prev) =>
          prev.map((d) =>
            validDocs.some((v) => v.id === d.id) ? { ...d, status: "uploading" as const } : d
          )
        );

        try {
          await onUpload(validDocs.map((d) => d.file));
          // Mark as success
          setDocuments((prev) =>
            prev.map((d) =>
              validDocs.some((v) => v.id === d.id)
                ? { ...d, status: "success" as const, progress: 100 }
                : d
            )
          );
        } catch {
          // Mark as error
          setDocuments((prev) =>
            prev.map((d) =>
              validDocs.some((v) => v.id === d.id)
                ? { ...d, status: "error" as const, error: "Upload that bai" }
                : d
            )
          );
        }
      }
    },
    [documents.length, maxFiles, validateFile, onUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
      }
      e.target.value = "";
    },
    [handleFiles]
  );

  const handleRemove = useCallback(
    (docId: string) => {
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      onRemove?.(docId);
    },
    [onRemove]
  );

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
          isDragging
            ? "border-primary-500 bg-primary-50"
            : "border-input hover:border-primary-300 hover:bg-muted/50"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(",")}
          onChange={handleInputChange}
          className="hidden"
        />
        <Upload
          className={cn(
            "h-10 w-10 mx-auto mb-3",
            isDragging ? "text-primary-600" : "text-muted-foreground"
          )}
        />
        <p className="text-sm text-muted-foreground">
          Tai len hoac keo tha file vao day (Khuyen dung: .PDF, .MD, .PNG, .JPG)
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Toi da {maxFiles} files, moi file toi da {formatFileSize(maxSize)}
        </p>
      </div>

      {/* File List */}
      {documents.length > 0 && (
        <div className="space-y-2">
          {documents.map((doc) => {
            const FileIcon = getFileIcon(doc.type);
            return (
              <div
                key={doc.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border",
                  doc.status === "error"
                    ? "border-destructive bg-destructive/5"
                    : doc.status === "success"
                    ? "border-green-500 bg-green-50"
                    : "border-input"
                )}
              >
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    doc.status === "error"
                      ? "bg-destructive/10 text-destructive"
                      : doc.status === "success"
                      ? "bg-green-100 text-green-600"
                      : "bg-primary-100 text-primary-600"
                  )}
                >
                  <FileIcon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(doc.size)}
                    {doc.error && (
                      <span className="text-destructive ml-2">{doc.error}</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {doc.status === "uploading" && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
                  )}
                  {doc.status === "success" && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                  {doc.status === "error" && (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(doc.id);
                    }}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Compact variant for inline use ────────────────────────────────────────

interface DocumentUploadInlineProps {
  documents: { id: string; name: string }[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
}

export function DocumentUploadInline({
  documents,
  onAdd,
  onRemove,
}: DocumentUploadInlineProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center gap-2 bg-primary-50 text-primary-700 px-3 py-1.5 rounded-full text-sm"
          >
            <Paperclip className="h-3.5 w-3.5" />
            <span className="max-w-[150px] truncate">{doc.name}</span>
            <button
              type="button"
              onClick={() => onRemove(doc.id)}
              className="hover:text-primary-900"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <label className="flex items-center gap-1 px-3 py-1.5 text-sm text-primary-600 hover:underline cursor-pointer">
          <Paperclip className="h-3.5 w-3.5" />
          Dinh kem File
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.md,.png,.jpg,.jpeg"
            onChange={(e) => {
              if (e.target.files) {
                onAdd(Array.from(e.target.files));
              }
              e.target.value = "";
            }}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}

export default DocumentUpload;
