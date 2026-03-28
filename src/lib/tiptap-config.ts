/**
 * TipTap editor extension configuration
 * Assembles all extensions used across editor instances
 */
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Mention from "@tiptap/extension-mention";
import { CodeBlockExtension } from "@/components/editor/extensions/code-block-extension";
import { TableExtensions } from "@/components/editor/extensions/table-extension";
import type { SuggestionOptions } from "@tiptap/suggestion";

export interface TiptapConfigOptions {
    placeholder?: string;
    /** Provide a suggestion config to enable @mentions */
    mentionSuggestion?: Omit<SuggestionOptions, "editor">;
}

export function buildExtensions(options: TiptapConfigOptions = {}) {
    const { placeholder = "Write something...", mentionSuggestion } = options;

    return [
        StarterKit.configure({
            // Disable built-in code block in favor of lowlight version
            codeBlock: false,
        }),
        Underline,
        CodeBlockExtension,
        Image.configure({
            allowBase64: true,
            HTMLAttributes: { class: "tiptap-image" },
        }),
        Link.configure({
            openOnClick: false,
            HTMLAttributes: {
                class: "tiptap-link",
                rel: "noopener noreferrer",
                target: "_blank",
            },
        }),
        Placeholder.configure({ placeholder }),
        TaskList,
        TaskItem.configure({ nested: true }),
        Mention.configure({
            HTMLAttributes: { class: "mention" },
            renderText({ node }) {
                return `@${node.attrs.label ?? node.attrs.id}`;
            },
            suggestion: mentionSuggestion ?? {},
        }),
        ...TableExtensions,
    ];
}
