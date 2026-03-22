'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useState, useCallback, useRef } from 'react';

const COLORS = {
  bg: '#141414',
  surface: '#1a1a1a',
  surfaceHigh: '#262626',
  primary: '#ff8e80',
  primaryDim: '#ff7162',
  text: '#ffffff',
  textMuted: '#adaaaa',
  textDim: '#767575',
  border: '#3a3a3a',
  borderDim: 'rgba(72,72,71,0.3)',
};

interface RichTextEditorProps {
  content?: string;
  onChange?: (html: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
  placeholder?: string;
  editable?: boolean;
  minHeight?: string;
  height?: string;
}

export default function RichTextEditor({
  content = '',
  onChange,
  onImageUpload,
  placeholder = 'Nhập nội dung...',
  editable = true,
  minHeight = '200px',
  height,
}: RichTextEditorProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-link',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editable,
    immediatelyRender: false, // Avoid SSR hydration mismatch
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        style: `min-height: ${minHeight}; outline: none;`,
      },
      // Handle paste image from clipboard
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (const item of items) {
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file && onImageUpload) {
              setUploading(true);
              onImageUpload(file)
                .then((url) => {
                  view.dispatch(
                    view.state.tr.replaceSelectionWith(
                      view.state.schema.nodes.image.create({ src: url })
                    )
                  );
                })
                .catch((err) => {
                  console.error('Paste image upload failed:', err);
                  alert('Tải ảnh thất bại');
                })
                .finally(() => setUploading(false));
            }
            return true;
          }
        }
        return false;
      },
      // Handle drop image
      handleDrop: (view, event, slice, moved) => {
        if (moved || !event.dataTransfer?.files?.length) return false;

        const file = event.dataTransfer.files[0];
        if (!file?.type.startsWith('image/')) return false;

        event.preventDefault();
        if (onImageUpload) {
          setUploading(true);
          const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });

          onImageUpload(file)
            .then((url) => {
              const node = view.state.schema.nodes.image.create({ src: url });
              const transaction = view.state.tr.insert(coordinates?.pos ?? view.state.selection.head, node);
              view.dispatch(transaction);
            })
            .catch((err) => {
              console.error('Drop image upload failed:', err);
              alert('Tải ảnh thất bại');
            })
            .finally(() => setUploading(false));
        }
        return true;
      },
    },
  });

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor || !onImageUpload) return;

    setUploading(true);
    try {
      const url = await onImageUpload(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch (err) {
      console.error('Image upload failed:', err);
      alert('Tải ảnh thất bại');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [editor, onImageUpload]);

  const addLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('Nhập URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  const ToolbarButton = ({
    onClick,
    active,
    disabled,
    children,
    title
  }: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        background: active ? COLORS.primary : 'transparent',
        color: active ? '#000' : COLORS.textMuted,
        border: 'none',
        borderRadius: '6px',
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  );

  return (
    <div style={{
      border: `1px solid ${COLORS.border}`,
      borderRadius: '12px',
      overflow: 'hidden',
      background: COLORS.bg,
      display: 'flex',
      flexDirection: 'column',
      height: height,
    }}>
      {/* Toolbar */}
      {editable && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          padding: '8px 12px',
          borderBottom: `1px solid ${COLORS.border}`,
          background: COLORS.surface,
          flexWrap: 'wrap',
        }}>
          {/* Text formatting */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="Bold (Ctrl+B)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
              <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
            </svg>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="Italic (Ctrl+I)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="4" x2="10" y2="4"/>
              <line x1="14" y1="20" x2="5" y2="20"/>
              <line x1="15" y1="4" x2="9" y2="20"/>
            </svg>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')}
            title="Strikethrough"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17.3 4.9c-2.3-.6-4.4-1-6.2-.9-2.7 0-5.3.7-5.3 3.6 0 1.5 1.1 2.4 3.5 3"/>
              <path d="M3 12h18"/>
              <path d="M8.9 16.7c0 1 .7 1.9 1.7 2.4 1.4.8 3.2 1.1 4.9.8 1.5-.2 3.2-.8 4.5-1.7"/>
            </svg>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive('code')}
            title="Code"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6"/>
              <polyline points="8 6 2 12 8 18"/>
            </svg>
          </ToolbarButton>

          <div style={{ width: '1px', height: '20px', background: COLORS.border, margin: '0 6px' }} />

          {/* Headings */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <span style={{ fontSize: '12px', fontWeight: 700 }}>H1</span>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <span style={{ fontSize: '12px', fontWeight: 700 }}>H2</span>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            <span style={{ fontSize: '12px', fontWeight: 700 }}>H3</span>
          </ToolbarButton>

          <div style={{ width: '1px', height: '20px', background: COLORS.border, margin: '0 6px' }} />

          {/* Lists */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="9" y1="6" x2="20" y2="6"/>
              <line x1="9" y1="12" x2="20" y2="12"/>
              <line x1="9" y1="18" x2="20" y2="18"/>
              <circle cx="4" cy="6" r="1.5" fill="currentColor"/>
              <circle cx="4" cy="12" r="1.5" fill="currentColor"/>
              <circle cx="4" cy="18" r="1.5" fill="currentColor"/>
            </svg>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="10" y1="6" x2="21" y2="6"/>
              <line x1="10" y1="12" x2="21" y2="12"/>
              <line x1="10" y1="18" x2="21" y2="18"/>
              <text x="2" y="8" fill="currentColor" fontSize="8" fontWeight="600">1</text>
              <text x="2" y="14" fill="currentColor" fontSize="8" fontWeight="600">2</text>
              <text x="2" y="20" fill="currentColor" fontSize="8" fontWeight="600">3</text>
            </svg>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive('codeBlock')}
            title="Code Block"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M8 10l-2 2 2 2"/>
              <path d="M16 10l2 2-2 2"/>
            </svg>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
            title="Quote"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
            </svg>
          </ToolbarButton>

          <div style={{ width: '1px', height: '20px', background: COLORS.border, margin: '0 6px' }} />

          {/* Link */}
          <ToolbarButton
            onClick={addLink}
            active={editor.isActive('link')}
            title="Add Link"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          </ToolbarButton>

          {/* Image upload */}
          {onImageUpload && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <ToolbarButton
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                title="Upload Image"
              >
                {uploading ? (
                  <div style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid rgba(255,255,255,0.2)',
                    borderTopColor: COLORS.primary,
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21"/>
                  </svg>
                )}
              </ToolbarButton>
            </>
          )}

          <div style={{ flex: 1 }} />

          {/* Undo/Redo */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7v6h6"/>
              <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
            </svg>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 7v6h-6"/>
              <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/>
            </svg>
          </ToolbarButton>
        </div>
      )}

      {/* Editor content */}
      <div style={{
        padding: '16px',
        position: 'relative',
        flex: height ? 1 : undefined,
        overflow: height ? 'auto' : undefined,
        minHeight: height ? 0 : undefined,
      }}>
        <EditorContent
          editor={editor}
          style={{
            fontFamily: "var(--font-plus-jakarta), 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
          }}
        />
        {/* Upload indicator overlay */}
        {uploading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
          }}>
            <div style={{
              background: COLORS.surface,
              padding: '16px 24px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                border: `2px solid ${COLORS.border}`,
                borderTopColor: COLORS.primary,
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              <span style={{ color: COLORS.text, fontSize: '14px', fontWeight: 500 }}>
                Đang tải ảnh...
              </span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .ProseMirror {
          color: ${COLORS.text};
          font-size: 14px;
          line-height: 1.7;
        }

        .ProseMirror p {
          margin: 0 0 0.75em 0;
        }

        .ProseMirror h1 {
          font-size: 1.75em;
          font-weight: 700;
          margin: 1em 0 0.5em 0;
          color: ${COLORS.text};
        }

        .ProseMirror h2 {
          font-size: 1.4em;
          font-weight: 600;
          margin: 0.8em 0 0.4em 0;
          color: ${COLORS.text};
        }

        .ProseMirror h3 {
          font-size: 1.15em;
          font-weight: 600;
          margin: 0.6em 0 0.3em 0;
          color: ${COLORS.text};
        }

        .ProseMirror ul, .ProseMirror ol {
          padding-left: 1.5em;
          margin: 0.5em 0;
        }

        .ProseMirror li {
          margin: 0.25em 0;
        }

        .ProseMirror code {
          background: ${COLORS.surfaceHigh};
          padding: 0.15em 0.4em;
          border-radius: 4px;
          font-family: 'Fira Code', 'Consolas', monospace;
          font-size: 0.9em;
          color: ${COLORS.primary};
        }

        .ProseMirror pre {
          background: ${COLORS.surfaceHigh};
          padding: 1em;
          border-radius: 8px;
          overflow-x: auto;
          margin: 0.75em 0;
        }

        .ProseMirror pre code {
          background: none;
          padding: 0;
          color: ${COLORS.text};
        }

        .ProseMirror blockquote {
          border-left: 3px solid ${COLORS.primary};
          padding-left: 1em;
          margin: 0.75em 0;
          color: ${COLORS.textMuted};
          font-style: italic;
        }

        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 0.75em 0;
        }

        .ProseMirror .text-link {
          color: ${COLORS.primary};
          text-decoration: underline;
          cursor: pointer;
        }

        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: ${COLORS.textDim};
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  );
}

// Read-only viewer component
export function RichTextViewer({ content }: { content: string }) {
  return (
    <>
      <div
        className="rich-text-viewer"
        dangerouslySetInnerHTML={{ __html: content }}
        style={{
          fontFamily: "var(--font-plus-jakarta), 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
          color: COLORS.text,
          fontSize: '14px',
          lineHeight: 1.7,
        }}
      />
      <style>{`
        .rich-text-viewer p {
          margin: 0 0 0.75em 0;
        }

        .rich-text-viewer h1 {
          font-size: 1.75em;
          font-weight: 700;
          margin: 1em 0 0.5em 0;
          color: ${COLORS.text};
        }

        .rich-text-viewer h2 {
          font-size: 1.4em;
          font-weight: 600;
          margin: 0.8em 0 0.4em 0;
          color: ${COLORS.text};
        }

        .rich-text-viewer h3 {
          font-size: 1.15em;
          font-weight: 600;
          margin: 0.6em 0 0.3em 0;
          color: ${COLORS.text};
        }

        .rich-text-viewer ul, .rich-text-viewer ol {
          padding-left: 1.5em;
          margin: 0.5em 0;
        }

        .rich-text-viewer li {
          margin: 0.25em 0;
        }

        .rich-text-viewer code {
          background: ${COLORS.surfaceHigh};
          padding: 0.15em 0.4em;
          border-radius: 4px;
          font-family: 'Fira Code', 'Consolas', monospace;
          font-size: 0.9em;
          color: ${COLORS.primary};
        }

        .rich-text-viewer pre {
          background: ${COLORS.surfaceHigh};
          padding: 1em;
          border-radius: 8px;
          overflow-x: auto;
          margin: 0.75em 0;
        }

        .rich-text-viewer pre code {
          background: none;
          padding: 0;
          color: ${COLORS.text};
        }

        .rich-text-viewer blockquote {
          border-left: 3px solid ${COLORS.primary};
          padding-left: 1em;
          margin: 0.75em 0;
          color: ${COLORS.textMuted};
          font-style: italic;
        }

        .rich-text-viewer img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 0.75em 0;
        }

        .rich-text-viewer a {
          color: ${COLORS.primary};
          text-decoration: underline;
        }

        .rich-text-viewer strong {
          font-weight: 600;
        }
      `}</style>
    </>
  );
}
