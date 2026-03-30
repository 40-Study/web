"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Heart,
  MessageSquare,
  Share2,
  Send,
  Image as ImageIcon,
  Link2,
  Code2,
  MoreHorizontal,
  Hash,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TiptapEditor } from "@/components/editor";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import {
  discussionPosts,
  DiscussionPost,
  DISCUSSION_POST_LIKED_STORAGE_KEY,
  loadDiscussionPosts,
  saveDiscussionPosts,
} from "./discussion-data";

/* ── Mock data for right sidebar ── */
const TRENDING_TOPICS = [
  { name: "Lập trình Web", count: "1.2k" },
  { name: "Robotics", count: "856" },
  { name: "UI/UX Design", count: "532" },
  { name: "Data Science", count: "420" },
  { name: "Mobile Dev", count: "310" },
];

const ACTIVE_MEMBERS = [
  { name: "Nguyễn Anh Tuấn", handle: "@tuan_dev", points: 150 },
  { name: "Hoàng Diệu Linh", handle: "@linh_robotics", points: 124 },
  { name: "Phạm Minh Đức", handle: "@duc_design", points: 110 },
];

/* ── Category colors ── */
const CATEGORY_COLORS: Record<string, string> = {
  "Lập trình": "bg-blue-50 text-blue-700 border-blue-200",
  "Thiết kế": "bg-pink-50 text-pink-700 border-pink-200",
  "Kinh nghiệm học": "bg-amber-50 text-amber-700 border-amber-200",
  "Dự án": "bg-emerald-50 text-emerald-700 border-emerald-200",
};

/* ── Role badge ── */
const AUTHOR_ROLES: Record<string, { label: string; cls: string }> = {
  "Nguyen Minh": { label: "HỌC VIÊN", cls: "bg-slate-100 text-slate-600" },
  "Tran Thu": { label: "HỌC VIÊN", cls: "bg-slate-100 text-slate-600" },
  "Le Quang": { label: "HỌC VIÊN", cls: "bg-slate-100 text-slate-600" },
  "Bạn": { label: "BẠN", cls: "bg-primary-50 text-primary-700" },
};

/* ── Relative time helper ── */
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "Vừa xong";
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return dateStr;
}

/* ── Avatar placeholder ── */
function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const colors = ["bg-primary-500", "bg-rose-500", "bg-emerald-500", "bg-amber-500", "bg-violet-500"];
  const color = colors[name.length % colors.length];
  const sz = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  return (
    <div className={cn("rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0", color, sz)}>
      {initials}
    </div>
  );
}

export default function DiscussionsPage() {
  const [posts, setPosts] = useState<DiscussionPost[]>(discussionPosts);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [showComposer, setShowComposer] = useState(false);
  const [newPost, setNewPost] = useState({
    title: "",
    category: "Lập trình" as DiscussionPost["category"],
    content: "",
  });

  useEffect(() => {
    setPosts(loadDiscussionPosts());
    try {
      const rawLiked = localStorage.getItem(DISCUSSION_POST_LIKED_STORAGE_KEY);
      if (rawLiked) setLikedPosts(JSON.parse(rawLiked));
    } catch {
      // ignore
    }
  }, []);

  const persistLikedPosts = (next: Record<string, boolean>) => {
    localStorage.setItem(DISCUSSION_POST_LIKED_STORAGE_KEY, JSON.stringify(next));
  };

  const handleToggleLike = (slug: string) => {
    const key = `post:${slug}`;
    const isLiked = likedPosts[key] === true;
    const nextLiked = { ...likedPosts, [key]: !isLiked };
    const nextPosts = posts.map((p) =>
      p.slug === slug ? { ...p, likes: isLiked ? Math.max(0, p.likes - 1) : p.likes + 1 } : p
    );
    setPosts(nextPosts);
    setLikedPosts(nextLiked);
    saveDiscussionPosts(nextPosts);
    persistLikedPosts(nextLiked);
  };

  const handleCreatePost = () => {
    const title = newPost.title.trim();
    const content = newPost.content.trim();
    if (!title || !content || content === "<p></p>") return;

    const plainText = content.replace(/<[^>]*>/g, "").trim();
    const summary = plainText.slice(0, 120) + (plainText.length > 120 ? "..." : "");
    const slugBase = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

    const created: DiscussionPost = {
      slug: `${slugBase}-${Date.now().toString().slice(-6)}`,
      title,
      summary,
      category: newPost.category,
      author: "Bạn",
      createdAt: new Date().toISOString(),
      replies: 0,
      likes: 0,
      content: [content],
      comments: [],
    };

    const nextPosts = [created, ...posts];
    setPosts(nextPosts);
    saveDiscussionPosts(nextPosts);
    setNewPost({ title: "", category: "Lập trình", content: "" });
    setShowComposer(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex gap-6">
        {/* ══════ MAIN FEED ══════ */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Composer trigger */}
          <ScrollReveal direction="fade">
            <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm">
              {!showComposer ? (
                <div className="flex items-center gap-3">
                  <Avatar name="Bạn" />
                  <button
                    onClick={() => setShowComposer(true)}
                    className="flex-1 text-left text-slate-400 bg-slate-50 hover:bg-slate-100 rounded-xl px-4 py-2.5 text-sm transition-colors"
                  >
                    Bạn muốn chia sẻ kiến thức gì hôm nay?
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar name="Bạn" />
                    <input
                      value={newPost.title}
                      onChange={(e) => setNewPost((p) => ({ ...p, title: e.target.value }))}
                      placeholder="Tiêu đề bài viết..."
                      className="flex-1 text-sm font-medium bg-transparent outline-none placeholder:text-slate-400"
                      autoFocus
                    />
                  </div>
                  <select
                    value={newPost.category}
                    onChange={(e) => setNewPost((p) => ({ ...p, category: e.target.value as DiscussionPost["category"] }))}
                    className="text-xs rounded-lg border border-slate-200 px-3 py-1.5 text-slate-600 outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Lập trình">Lập trình</option>
                    <option value="Thiết kế">Thiết kế</option>
                    <option value="Kinh nghiệm học">Kinh nghiệm học</option>
                    <option value="Dự án">Dự án</option>
                  </select>
                  <TiptapEditor
                    value={newPost.content}
                    onChange={(html) => setNewPost((p) => ({ ...p, content: html }))}
                    placeholder="Nội dung chia sẻ của bạn..."
                    minHeight={120}
                  />
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1">
                      <button className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
                        <ImageIcon className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
                        <Link2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
                        <Code2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowComposer(false)}
                        className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleCreatePost}
                        className="inline-flex items-center gap-2 px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Đăng bài
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollReveal>

          {/* Post Feed */}
          {posts.map((post, i) => (
            <ScrollReveal key={post.slug} delay={Math.min(i * 60, 300)} direction="up">
              <article className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                {/* Author header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={post.author} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900">{post.author}</span>
                        {AUTHOR_ROLES[post.author] && (
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded", AUTHOR_ROLES[post.author].cls)}>
                            {AUTHOR_ROLES[post.author].label}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">{timeAgo(post.createdAt)}</span>
                    </div>
                  </div>
                  <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <Link href={`/discussions/${post.slug}`} className="block group">
                  <h2 className="text-lg font-bold text-slate-900 group-hover:text-primary-600 transition-colors mb-2">
                    {post.title}
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed mb-3">{post.summary}</p>
                </Link>

                {/* Category tag */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full border", CATEGORY_COLORS[post.category] || "bg-slate-50 text-slate-600 border-slate-200")}>
                    #{post.category}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-5 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleToggleLike(post.slug)}
                    className={cn(
                      "inline-flex items-center gap-1.5 text-sm transition-colors",
                      likedPosts[`post:${post.slug}`]
                        ? "text-rose-500 font-medium"
                        : "text-slate-500 hover:text-rose-500"
                    )}
                  >
                    <Heart className={cn("w-4 h-4", likedPosts[`post:${post.slug}`] && "fill-current")} />
                    {post.likes}
                  </button>
                  <Link
                    href={`/discussions/${post.slug}`}
                    className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {post.replies}
                  </Link>
                  <button className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                    <Share2 className="w-4 h-4" />
                    Chia sẻ
                  </button>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>

        {/* ══════ RIGHT SIDEBAR ══════ */}
        <aside className="hidden lg:block w-72 flex-shrink-0 space-y-5">
          {/* Trending Topics */}
          <ScrollReveal delay={100} direction="right">
            <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
              <h3 className="font-bold text-sm text-slate-900 mb-4">Chủ đề nổi bật</h3>
              <div className="space-y-3">
                {TRENDING_TOPICS.map((topic) => (
                  <div key={topic.name} className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                        <Hash className="w-4 h-4" />
                      </div>
                      <span className="text-sm text-slate-700 group-hover:text-primary-600 transition-colors">
                        {topic.name}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                      {topic.count}
                    </span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
                Xem tất cả
              </button>
            </div>
          </ScrollReveal>

          {/* Active Members */}
          <ScrollReveal delay={200} direction="right">
            <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-slate-900">Thành viên tích cực</h3>
                <Trophy className="w-4 h-4 text-amber-500" />
              </div>
              <div className="space-y-4">
                {ACTIVE_MEMBERS.map((member) => (
                  <div key={member.handle} className="flex items-center gap-3">
                    <Avatar name={member.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{member.name}</p>
                      <p className="text-xs text-slate-400">{member.handle}</p>
                    </div>
                    <span className="text-xs font-bold text-primary-600">{member.points} điểm</span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </aside>
      </div>
    </div>
  );
}
