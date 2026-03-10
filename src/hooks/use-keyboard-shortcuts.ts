"use client";

import { useEffect, useCallback } from "react";

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description?: string;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
  preventDefault?: boolean;
}

/**
 * Hook for handling keyboard shortcuts
 * Automatically ignores shortcuts when user is typing in input/textarea
 */
export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
  preventDefault = true,
}: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const keyMatch =
          event.code === shortcut.key || event.key === shortcut.key;
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const metaMatch = shortcut.meta ? event.metaKey : !event.metaKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
          if (preventDefault) {
            event.preventDefault();
          }
          shortcut.action();
          return;
        }
      }
    },
    [shortcuts, enabled, preventDefault]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Video player specific shortcuts
 */
export function useVideoKeyboardShortcuts({
  onPlayPause,
  onSkipBack,
  onSkipForward,
  onVolumeUp,
  onVolumeDown,
  onMute,
  onFullscreen,
  onToggleCaptions,
  onNextLesson,
  onPrevLesson,
  enabled = true,
}: {
  onPlayPause?: () => void;
  onSkipBack?: () => void;
  onSkipForward?: () => void;
  onVolumeUp?: () => void;
  onVolumeDown?: () => void;
  onMute?: () => void;
  onFullscreen?: () => void;
  onToggleCaptions?: () => void;
  onNextLesson?: () => void;
  onPrevLesson?: () => void;
  enabled?: boolean;
}) {
  const shortcuts: KeyboardShortcut[] = [
    ...(onPlayPause
      ? [{ key: "Space", action: onPlayPause, description: "Play/Pause" }]
      : []),
    ...(onSkipBack
      ? [{ key: "ArrowLeft", action: onSkipBack, description: "Rewind 10s" }]
      : []),
    ...(onSkipForward
      ? [
          {
            key: "ArrowRight",
            action: onSkipForward,
            description: "Forward 10s",
          },
        ]
      : []),
    ...(onVolumeUp
      ? [{ key: "ArrowUp", action: onVolumeUp, description: "Volume up" }]
      : []),
    ...(onVolumeDown
      ? [{ key: "ArrowDown", action: onVolumeDown, description: "Volume down" }]
      : []),
    ...(onMute
      ? [{ key: "KeyM", action: onMute, description: "Mute/Unmute" }]
      : []),
    ...(onFullscreen
      ? [{ key: "KeyF", action: onFullscreen, description: "Fullscreen" }]
      : []),
    ...(onToggleCaptions
      ? [
          {
            key: "KeyC",
            action: onToggleCaptions,
            description: "Toggle captions",
          },
        ]
      : []),
    ...(onNextLesson
      ? [{ key: "KeyN", action: onNextLesson, description: "Next lesson" }]
      : []),
    ...(onPrevLesson
      ? [{ key: "KeyP", action: onPrevLesson, description: "Previous lesson" }]
      : []),
  ];

  useKeyboardShortcuts({ shortcuts, enabled });

  return shortcuts;
}
