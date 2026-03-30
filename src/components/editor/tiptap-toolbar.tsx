"use client";

/**
 * TipTap editor toolbar with formatting buttons
 * Grouped by: text style, headings, lists, blocks, media, table
 */
import React, { useEffect, useState, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import {
    Bold, Italic, Underline, Strikethrough,
    Heading1, Heading2, Heading3,
    List, ListOrdered, ListChecks,
    Code, CodeSquare,
    Link, Image, Table,
    Quote, Minus, Undo, Redo,
    Paperclip,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolbarButtonProps {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
}

function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
    return (
        <button
            type="button"
            onMouseDown={(e) => {
                e.preventDefault();
                onClick();
            }}
            disabled={disabled}
            className={cn(
                "group relative flex h-8 w-8 items-center justify-center rounded text-sm transition-colors",
                "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                "disabled:pointer-events-none disabled:opacity-40",
                active && "bg-primary/15 text-primary ring-1 ring-primary/30"
            )}
        >
            {children}
            {/* Custom tooltip */}
            <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-[11px] text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 z-50">
                {title}
            </span>
        </button>
    );
}

/** Hook to force re-render on editor state changes */
function useEditorState(editor: Editor | null) {
    const [, setTick] = useState(0);
    const forceUpdate = useCallback(() => setTick((t) => t + 1), []);

    useEffect(() => {
        if (!editor) return;
        editor.on("selectionUpdate", forceUpdate);
        editor.on("transaction", forceUpdate);
        return () => {
            editor.off("selectionUpdate", forceUpdate);
            editor.off("transaction", forceUpdate);
        };
    }, [editor, forceUpdate]);
}

function Divider() {
    return <div className="mx-1 h-6 w-px bg-border" />;
}

interface TiptapToolbarProps {
    editor: Editor;
    onImageUpload?: () => void;
    onFileUpload?: () => void;
}

export function TiptapToolbar({ editor, onImageUpload, onFileUpload }: TiptapToolbarProps) {
    // Subscribe to editor state changes to update active states
    useEditorState(editor);

    const setLink = () => {
        const url = window.prompt("Enter URL", editor.getAttributes("link").href ?? "");
        if (url === null) return;
        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    };

    const insertTable = () => {
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    };

    return (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 p-1.5">
            {/* Undo / Redo */}
            <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Hoàn tác">
                <Undo className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Làm lại">
                <Redo className="h-4 w-4" />
            </ToolbarButton>

            <Divider />

            {/* Text style */}
            <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="In đậm">
                <Bold className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="In nghiêng">
                <Italic className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Gạch chân">
                <Underline className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Gạch ngang">
                <Strikethrough className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Code inline">
                <Code className="h-4 w-4" />
            </ToolbarButton>

            <Divider />

            {/* Headings */}
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Tiêu đề 1">
                <Heading1 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Tiêu đề 2">
                <Heading2 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Tiêu đề 3">
                <Heading3 className="h-4 w-4" />
            </ToolbarButton>

            <Divider />

            {/* Lists */}
            <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Danh sách">
                <List className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Danh sách số">
                <ListOrdered className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive("taskList")} title="Checklist">
                <ListChecks className="h-4 w-4" />
            </ToolbarButton>

            <Divider />

            {/* Blocks */}
            <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Trích dẫn">
                <Quote className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Khối code">
                <CodeSquare className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Đường kẻ ngang">
                <Minus className="h-4 w-4" />
            </ToolbarButton>

            <Divider />

            {/* Media & links */}
            <ToolbarButton onClick={setLink} active={editor.isActive("link")} title="Chèn liên kết">
                <Link className="h-4 w-4" />
            </ToolbarButton>
            {onImageUpload && (
                <ToolbarButton onClick={onImageUpload} title="Tải ảnh lên">
                    <Image className="h-4 w-4" />
                </ToolbarButton>
            )}
            {onFileUpload && (
                <ToolbarButton onClick={onFileUpload} title="Đính kèm file">
                    <Paperclip className="h-4 w-4" />
                </ToolbarButton>
            )}
            <ToolbarButton onClick={insertTable} title="Chèn bảng">
                <Table className="h-4 w-4" />
            </ToolbarButton>
        </div>
    );
}
