# CODE SANDBOX MODULE

Self-contained browser IDE for code execution. Monaco editor + Judge0 API integration.

## STRUCTURE

```
code_sanbox/
├── api/
│   ├── filesApi.ts       # File CRUD operations
│   └── judgeApi.ts       # Code execution via Judge0
├── hooks/
│   ├── useCodeRunner.ts  # Execute code, manage output
│   ├── useFileCRUD.ts    # File create/read/update/delete
│   ├── useFileTree.ts    # File tree state management
│   └── useToast.ts       # Toast notifications
├── lib/
│   ├── editorHelpers.ts  # Monaco utilities
│   ├── fileIcons.ts      # File type icon mapping
│   └── syntaxHL.ts       # Syntax highlighting config
├── config/
│   ├── languages.ts      # Language definitions for Judge0
│   └── themes.ts         # Editor themes
├── CodeEditor.tsx        # Main Monaco wrapper
├── EditorPane.tsx        # Single editor tab
├── EditorGroup.tsx       # Tab group container
├── SplitView.tsx         # Resizable panes
├── Sidebar.tsx           # File tree sidebar
├── OutputPanel.tsx       # Execution output display
├── StatusBar.tsx         # Bottom status info
├── TitleBar.tsx          # Top bar with actions
├── CalcInput.tsx         # Calculator input widget
├── SaveDialog.tsx        # Save file dialog
├── Toast.tsx             # Toast component
└── types.ts              # Module-specific types
```

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Add language support | `config/languages.ts` |
| Modify editor behavior | `CodeEditor.tsx` + `lib/editorHelpers.ts` |
| Change code execution | `api/judgeApi.ts` + `hooks/useCodeRunner.ts` |
| Add file operations | `api/filesApi.ts` + `hooks/useFileCRUD.ts` |
| Modify themes | `config/themes.ts` |

## CONVENTIONS

- All hooks prefixed with `use*` (camelCase here, differs from parent)
- Components use PascalCase without file extension in imports
- Types centralized in `types.ts`
- Monaco editor accessed via `@monaco-editor/react`

## ANTI-PATTERNS

```
NEVER:
- Import Monaco directly from 'monaco-editor' (use @monaco-editor/react)
- Bypass useCodeRunner for execution (it handles state/errors)
- Hardcode language IDs (use config/languages.ts)
```

## INTEGRATION

Entry point: Used in `src/app/(ide)/editor/page.tsx`

Dependencies:
- `@monaco-editor/react` — Editor component
- `monaco-editor` — Types only
- External: Judge0 API for code execution
