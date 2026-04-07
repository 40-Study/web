"use client";

import { useState, useCallback } from "react";
import {
  Video,
  Calendar,
  FileText,
  GripVertical,
  MoreVertical,
  Trash2,
  Edit2,
  Eye,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { LiveSessionModal, type LiveSessionFormData } from "./live-session-modal";
import { ExerciseModal, type ExerciseFormData } from "./exercise-modal";
import { DocumentUpload } from "./document-upload";

// ─── Types ─────────────────────────────────────────────────────────────────

export type ContentItemType = "video" | "live" | "document" | "exercise";

export interface ContentItem {
  id: string;
  type: ContentItemType;
  title: string;
  data: unknown;
  position: number;
}

interface LessonContentEditorProps {
  lessonId: string;
  lessonTitle: string;
  initialContent?: ContentItem[];
  onSave?: (content: ContentItem[]) => void;
  onAddVideo?: () => void;
}

// ─── Helper ────────────────────────────────────────────────────────────────

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function getTypeIcon(type: ContentItemType) {
  switch (type) {
    case "video":
      return Video;
    case "live":
      return Calendar;
    case "document":
      return FileText;
    case "exercise":
      return FileText;
  }
}

function getTypeLabel(type: ContentItemType) {
  switch (type) {
    case "video":
      return "Video";
    case "live":
      return "Buoi Live";
    case "document":
      return "Tai lieu";
    case "exercise":
      return "Bai tap";
  }
}

// ─── Component ─────────────────────────────────────────────────────────────

export function LessonContentEditor({
  lessonId,
  lessonTitle,
  initialContent = [],
  onSave,
  onAddVideo,
}: LessonContentEditorProps) {
  const [content, setContent] = useState<ContentItem[]>(initialContent);
  const [activeTab, setActiveTab] = useState<"content" | "documents" | "quiz">("content");
  const [liveModalOpen, setLiveModalOpen] = useState(false);
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);

  // Add content handlers
  const handleAddLiveSession = useCallback((data: LiveSessionFormData) => {
    const newItem: ContentItem = {
      id: generateId(),
      type: "live",
      title: data.title,
      data,
      position: content.length,
    };
    setContent((prev) => [...prev, newItem]);
    setLiveModalOpen(false);
  }, [content.length]);

  const handleAddExercise = useCallback((data: ExerciseFormData) => {
    const newItem: ContentItem = {
      id: generateId(),
      type: "exercise",
      title: data.type === "quiz" ? data.title : data.type === "code" ? data.title : data.title,
      data,
      position: content.length,
    };
    setContent((prev) => [...prev, newItem]);
    setExerciseModalOpen(false);
  }, [content.length]);

  const handleAddDocuments = useCallback(async (files: File[]) => {
    const newItems: ContentItem[] = files.map((file, idx) => ({
      id: generateId(),
      type: "document" as const,
      title: file.name,
      data: { file },
      position: content.length + idx,
    }));
    setContent((prev) => [...prev, ...newItems]);
  }, [content.length]);

  const handleRemoveItem = useCallback((itemId: string) => {
    setContent((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const handleSave = useCallback(() => {
    onSave?.(content);
  }, [content, onSave]);

  // Filter content by type for tabs
  const documents = content.filter((c) => c.type === "document");
  const exercises = content.filter((c) => c.type === "exercise");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Video className="h-5 w-5 text-primary-600" />
          <div>
            <h3 className="font-semibold">{lessonTitle}</h3>
            <p className="text-sm text-muted-foreground">Quan ly noi dung bai hoc</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {}}>
            Huy
          </Button>
          <Button onClick={handleSave}>Luu bai hoc</Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="content">Noi dung bai hoc</TabsTrigger>
          <TabsTrigger value="documents">
            Tai lieu {documents.length > 0 && `(${documents.length})`}
          </TabsTrigger>
          <TabsTrigger value="quiz">
            Quiz {exercises.length > 0 && `(${exercises.length})`}
          </TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          {/* Content List */}
          {content.length > 0 && (
            <div className="space-y-2">
              {content.map((item) => (
                <ContentItemRow
                  key={item.id}
                  item={item}
                  onEdit={() => setEditingItem(item)}
                  onRemove={() => handleRemoveItem(item.id)}
                />
              ))}
            </div>
          )}

          {/* Add Content Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onAddVideo} className="gap-2">
              <Video className="h-4 w-4" />
              Them Video
            </Button>
            <Button
              variant="outline"
              onClick={() => setLiveModalOpen(true)}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              Len lich Live
            </Button>
            <Button
              variant="outline"
              onClick={() => setExerciseModalOpen(true)}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Bai tap
            </Button>
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <DocumentUpload
            onUpload={handleAddDocuments}
            onRemove={(id) => handleRemoveItem(id)}
          />
          {documents.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Tai lieu da them ({documents.length})
              </h4>
              {documents.map((doc) => (
                <ContentItemRow
                  key={doc.id}
                  item={doc}
                  onRemove={() => handleRemoveItem(doc.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Quiz Tab */}
        <TabsContent value="quiz" className="space-y-4">
          {exercises.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-xl">
              <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Chua co bai tap nao</p>
              <Button
                variant="outline"
                onClick={() => setExerciseModalOpen(true)}
                className="mt-3 gap-2"
              >
                <Plus className="h-4 w-4" />
                Them bai tap
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {exercises.map((ex) => (
                <ContentItemRow
                  key={ex.id}
                  item={ex}
                  onEdit={() => setEditingItem(ex)}
                  onRemove={() => handleRemoveItem(ex.id)}
                />
              ))}
              <Button
                variant="outline"
                onClick={() => setExerciseModalOpen(true)}
                className="w-full gap-2"
              >
                <Plus className="h-4 w-4" />
                Them bai tap moi
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <LiveSessionModal
        open={liveModalOpen}
        onOpenChange={setLiveModalOpen}
        onSubmit={handleAddLiveSession}
      />

      <ExerciseModal
        open={exerciseModalOpen}
        onOpenChange={setExerciseModalOpen}
        onSubmit={handleAddExercise}
        lessonId={lessonId}
      />
    </div>
  );
}

// ─── Content Item Row ──────────────────────────────────────────────────────

interface ContentItemRowProps {
  item: ContentItem;
  onEdit?: () => void;
  onRemove: () => void;
}

function ContentItemRow({ item, onEdit, onRemove }: ContentItemRowProps) {
  const [showMenu, setShowMenu] = useState(false);
  const Icon = getTypeIcon(item.type);

  return (
    <div className="flex items-center gap-3 p-3 border rounded-xl hover:bg-muted/50 transition-colors group">
      <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
      <div
        className={cn(
          "p-2 rounded-lg",
          item.type === "video" && "bg-blue-100 text-blue-600",
          item.type === "live" && "bg-purple-100 text-purple-600",
          item.type === "document" && "bg-orange-100 text-orange-600",
          item.type === "exercise" && "bg-green-100 text-green-600"
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{item.title}</p>
        <p className="text-xs text-muted-foreground">{getTypeLabel(item.type)}</p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon">
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onRemove}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

export default LessonContentEditor;
