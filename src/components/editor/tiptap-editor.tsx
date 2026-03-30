"use client";

/**
 * TipTap rich text editor component
 * Supports: formatting, headings, lists, code blocks, tables, mentions, image upload
 */
import React, { useCallback, useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { cn } from "@/lib/utils";
import { buildExtensions } from "@/lib/tiptap-config";
import { TiptapToolbar } from "./tiptap-toolbar";
import { buildMentionSuggestion } from "./tiptap-mention-suggestion";
import type { MentionItem } from "./tiptap-mention-list";

export interface TiptapEditorProps {
    /** HTML string value */
    value?: string;
    onChange?: (html: string) => void;
    placeholder?: string;
    /** Provide to enable @mentions — called with current query, returns matching users */
    fetchMentionUsers?: (query: string) => Promise<MentionItem[]> | MentionItem[];
    /** Called with File when user triggers image upload; should resolve to public URL */
    onImageUpload?: (file: File) => Promise<string>;
    /** Called with File when user triggers file upload; should resolve to { url, name } */
    onFileUpload?: (file: File) => Promise<{ url: string; name: string }>;
    className?: string;
    editorClassName?: string;
    readOnly?: boolean;
    minHeight?: number;
}

export function TiptapEditor({
    value,
    onChange,
    placeholder = "Write something...",
    fetchMentionUsers,
    onImageUpload,
    onFileUpload,
    className,
    editorClassName,
    readOnly = false,
    minHeight = 200,
}: TiptapEditorProps) {
    const [isMounted, setIsMounted] = useState(false);

    const mentionSuggestion = fetchMentionUsers
        ? buildMentionSuggestion({ fetchUsers: fetchMentionUsers })
        : undefined;

    const extensions = buildExtensions({ placeholder, mentionSuggestion });

    const editor = useEditor({
        extensions,
        content: value ?? "",
        editable: !readOnly,
        onUpdate({ editor }) {
            onChange?.(editor.getHTML());
        },
        immediatelyRender: false, // Prevents SSR hydration mismatch
    });

    // Wait for client-side mount
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Sync external value changes (e.g. form reset)
    useEffect(() => {
        if (!editor || !isMounted) return;
        const current = editor.getHTML();
        if (value !== undefined && value !== current) {
            editor.commands.setContent(value, { emitUpdate: false });
        }
    }, [value, editor, isMounted]);

    // Convert file to base64 data URL
    const toBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

    const handleImageUpload = useCallback(async () => {
        if (!editor) return;
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            try {
                // Use custom handler or fallback to base64
                const url = onImageUpload ? await onImageUpload(file) : await toBase64(file);
                editor.chain().focus().setImage({ src: url }).run();
            } catch (err) {
                console.error("Image upload failed:", err);
            }
        };
        input.click();
    }, [editor, onImageUpload]);

    const handleFileUpload = useCallback(async () => {
        if (!editor) return;
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "*/*";
        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            try {
                // Use custom handler or fallback to base64
                const result = onFileUpload
                    ? await onFileUpload(file)
                    : { url: await toBase64(file), name: file.name };
                editor
                    .chain()
                    .focus()
                    .insertContent(`<a href="${result.url}" target="_blank" rel="noopener noreferrer">📎 ${result.name}</a> `)
                    .run();
            } catch (err) {
                console.error("File upload failed:", err);
            }
        };
        input.click();
    }, [editor, onFileUpload]);

    if (!editor || !isMounted) {
        // Placeholder to prevent layout shift
        return (
            <div
                className={cn(
                    "overflow-hidden rounded-xl border border-border bg-background",
                    className
                )}
                style={{ minHeight }}
            />
        );
    }

    return (
        <div
            className={cn(
                "overflow-hidden rounded-xl border border-border bg-background",
                className
            )}
        >
            {!readOnly && (
                <TiptapToolbar
                    editor={editor}
                    onImageUpload={handleImageUpload}
                    onFileUpload={handleFileUpload}
                />
            )}
            <EditorContent
                editor={editor}
                className={cn(
                    "prose prose-sm max-w-none px-4 py-3",
                    "focus-within:outline-none",
                    "[&_.tiptap]:outline-none [&_.tiptap]:min-h-[var(--editor-min-height)]",
                    // Mention chip styling
                    "[&_.mention]:rounded-md [&_.mention]:bg-primary-100 [&_.mention]:px-1 [&_.mention]:py-0.5",
                    "[&_.mention]:text-primary-700 [&_.mention]:font-medium",
                    // Code block styling
                    "[&_.code-block]:rounded-lg [&_.code-block]:bg-muted [&_.code-block]:p-4",
                    // Table styling
                    "[&_.tiptap-table]:w-full [&_.tiptap-table]:border-collapse",
                    "[&_.tiptap-table_td,[&_.tiptap-table_th]]:border [&_.tiptap-table_td]:border-border",
                    "[&_.tiptap-table_th]:border [&_.tiptap-table_th]:border-border [&_.tiptap-table_th]:bg-muted",
                    "[&_.tiptap-table_td]:p-2 [&_.tiptap-table_th]:p-2",
                    // Link styling
                    "[&_.tiptap-link]:text-primary-600 [&_.tiptap-link]:underline",
                    // Image styling
                    "[&_.tiptap-image]:max-w-full [&_.tiptap-image]:rounded-lg",
                    // Task list
                    "[&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]]:pl-0",
                    "[&_ul[data-type=taskList]_li]:flex [&_ul[data-type=taskList]_li]:items-start [&_ul[data-type=taskList]_li]:gap-2",
                    // Placeholder
                    "[&_.is-editor-empty:first-child::before]:pointer-events-none",
                    "[&_.is-editor-empty:first-child::before]:float-left",
                    "[&_.is-editor-empty:first-child::before]:text-muted-foreground",
                    "[&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
                    editorClassName
                )}
                style={
                    {
                        minHeight,
                        "--editor-min-height": `${minHeight}px`,
                    } as React.CSSProperties
                }
            />
        </div>
    );
}
