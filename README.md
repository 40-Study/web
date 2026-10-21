# ForteX Web

Next.js frontend cho nền tảng ForteX.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS

## Structure

```
src/
├── app/           # App router pages
├── components/    # React components
├── hooks/         # Custom hooks
├── lib/           # Utilities
├── services/      # API services
└── types/         # TypeScript types
```

## Getting Started

```bash
cp .env.example .env.local   # backend dev chạy ở localhost:5001
npm install
npm run dev
```

Luôn khởi động bằng `npm run dev`, không gọi thẳng `npx next dev`: script `predev` chạy
`npm run monaco:sync` để chép Monaco vào `public/monaco/` (thư mục này bị gitignore). Thiếu bước đó thì
`/monaco/vs/loader.js` trả 404 và trình soạn code trong bài học kẹt ở "Đang tải Monaco…". Nếu buộc phải
chạy `next dev` trực tiếp, chạy `npm run monaco:sync` trước (chỉ cần lại khi đổi phiên bản `monaco-editor`).
