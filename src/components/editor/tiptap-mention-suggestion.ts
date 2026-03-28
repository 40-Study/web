/**
 * TipTap mention suggestion configuration
 * Handles popup rendering and keyboard navigation for @mentions
 * Uses a portal div positioned via getBoundingClientRect — no tippy dependency needed
 */
import { ReactRenderer } from "@tiptap/react";
import { TiptapMentionList, type MentionItem, type MentionListRef } from "./tiptap-mention-list";

export interface MentionSuggestionOptions {
    /** Fetch matching users for a given query string */
    fetchUsers: (query: string) => Promise<MentionItem[]> | MentionItem[];
}

interface SuggestionProps {
    editor: unknown;
    items: MentionItem[];
    command: (item: MentionItem) => void;
    clientRect?: (() => DOMRect | null) | null;
    event?: KeyboardEvent;
}

export function buildMentionSuggestion(options: MentionSuggestionOptions) {
    return {
        items: async ({ query }: { query: string }) => {
            const results = await options.fetchUsers(query);
            return results.slice(0, 10);
        },

        render() {
            // ReactRenderer generic is intentionally loose to accept forwardRef components
            let component: ReactRenderer<MentionListRef> | null = null;
            let popupEl: HTMLDivElement | null = null;

            const positionPopup = (clientRect: (() => DOMRect | null) | null | undefined) => {
                if (!popupEl || !clientRect) return;
                const rect = clientRect();
                if (!rect) return;
                popupEl.style.top = `${rect.bottom + window.scrollY + 4}px`;
                popupEl.style.left = `${rect.left + window.scrollX}px`;
            };

            return {
                onStart(props: SuggestionProps) {
                    // Create a positioned portal container
                    popupEl = document.createElement("div");
                    popupEl.style.position = "absolute";
                    popupEl.style.zIndex = "9999";
                    document.body.appendChild(popupEl);

                    component = new ReactRenderer<MentionListRef>(
                        // @ts-expect-error — forwardRef component is compatible at runtime
                        TiptapMentionList,
                        { props, editor: props.editor }
                    );

                    popupEl.appendChild(component.element);
                    positionPopup(props.clientRect);
                },

                onUpdate(props: SuggestionProps) {
                    component?.updateProps(props);
                    positionPopup(props.clientRect);
                },

                onKeyDown(props: { event: KeyboardEvent }) {
                    if (props.event.key === "Escape") {
                        if (popupEl) popupEl.style.display = "none";
                        return true;
                    }
                    return component?.ref?.onKeyDown(props) ?? false;
                },

                onExit() {
                    if (popupEl) {
                        document.body.removeChild(popupEl);
                        popupEl = null;
                    }
                    component?.destroy();
                    component = null;
                },
            };
        },
    };
}
