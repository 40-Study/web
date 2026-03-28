"use client";

/**
 * Mention suggestion dropdown component
 * Renders a popup list of user suggestions when typing @
 */
import React, { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { cn } from "@/lib/utils";

export interface MentionItem {
    id: string;
    label: string;
    avatar?: string;
}

interface MentionListProps {
    items: MentionItem[];
    command: (item: MentionItem) => void;
}

export interface MentionListRef {
    onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

const TiptapMentionList = forwardRef<MentionListRef, MentionListProps>(
    ({ items, command }, ref) => {
        const [selectedIndex, setSelectedIndex] = useState(0);

        // Reset selection when items change
        useEffect(() => setSelectedIndex(0), [items]);

        const selectItem = (index: number) => {
            const item = items[index];
            if (item) command(item);
        };

        useImperativeHandle(ref, () => ({
            onKeyDown({ event }) {
                if (event.key === "ArrowUp") {
                    setSelectedIndex((i) => (i + items.length - 1) % items.length);
                    return true;
                }
                if (event.key === "ArrowDown") {
                    setSelectedIndex((i) => (i + 1) % items.length);
                    return true;
                }
                if (event.key === "Enter") {
                    selectItem(selectedIndex);
                    return true;
                }
                return false;
            },
        }));

        if (!items.length) {
            return (
                <div className="rounded-lg border border-border bg-background p-2 text-sm text-muted-foreground shadow-md">
                    No results
                </div>
            );
        }

        return (
            <div className="z-50 max-h-48 w-56 overflow-y-auto rounded-lg border border-border bg-background shadow-md">
                {items.map((item, index) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => selectItem(index)}
                        className={cn(
                            "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-accent",
                            index === selectedIndex && "bg-accent"
                        )}
                    >
                        {item.avatar && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={item.avatar}
                                alt={item.label}
                                className="h-6 w-6 rounded-full object-cover"
                            />
                        )}
                        <span className="truncate font-medium">{item.label}</span>
                    </button>
                ))}
            </div>
        );
    }
);

TiptapMentionList.displayName = "TiptapMentionList";

export { TiptapMentionList };
