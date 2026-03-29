"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MessageSquare, ThumbsUp, Clock3, Send } from "lucide-react";
import { TiptapEditor } from "@/components/editor";
import {
  discussionPosts,
  DiscussionPost,
  DISCUSSION_POST_LIKED_STORAGE_KEY,
  loadDiscussionPosts,
  saveDiscussionPosts,
} from "./discussion-data";

export default function DiscussionsPage() {
  const [posts, setPosts] = useState<DiscussionPost[]>(discussionPosts);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
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
      // ignore parse errors
    }
  }, []);

  const persistLikedPosts = (nextLikedPosts: Record<string, boolean>) => {
    localStorage.setItem(DISCUSSION_POST_LIKED_STORAGE_KEY, JSON.stringify(nextLikedPosts));
  };

  const handleToggleLike = (slug: string) => {
    const likeKey = `post:${slug}`;
    const isLiked = likedPosts[likeKey] === true;
    const nextLikedPosts = { ...likedPosts, [likeKey]: !isLiked };

    const nextPosts = posts.map((post) =>
      post.slug === slug
        ? {
            ...post,
            likes: isLiked ? Math.max(0, post.likes - 1) : post.likes + 1,
          }
        : post
    );

    setPosts(nextPosts);
    setLikedPosts(nextLikedPosts);
    saveDiscussionPosts(nextPosts);
    persistLikedPosts(nextLikedPosts);
  };

  const handleCreatePost = () => {
    const title = newPost.title.trim();
    const content = newPost.content.trim();
    if (!title || !content || content === "<p></p>") return;

    // Strip HTML tags for summary
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
      createdAt: new Date().toISOString().slice(0, 10),
      replies: 0,
      likes: 0,
      content: [content], // Store HTML as single entry
      comments: [],
    };

    const nextPosts = [created, ...posts];
    setPosts(nextPosts);
    saveDiscussionPosts(nextPosts);
    setNewPost({ title: "", category: "Lập trình", content: "" });
  };

  const postCount = useMemo(() => posts.length, [posts]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Thảo luận cộng đồng</h1>
        <p className="text-muted-foreground">Không gian trao đổi kiến thức, kinh nghiệm học và góp ý dự án.</p>
      </div>

      <section className="rounded-2xl border border-gray-100 bg-white p-4 md:p-5 space-y-3 shadow-sm">
        <h2 className="text-base font-semibold">Tạo bài viết mới</h2>
        <input
          value={newPost.title}
          onChange={(e) => setNewPost((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="Tiêu đề bài viết"
          className="w-full rounded-xl border border-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
        />
        <select
          value={newPost.category}
          onChange={(e) =>
            setNewPost((prev) => ({ ...prev, category: e.target.value as DiscussionPost["category"] }))
          }
          className="rounded-xl border border-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 md:w-56"
        >
          <option value="Lập trình">Lập trình</option>
          <option value="Thiết kế">Thiết kế</option>
          <option value="Kinh nghiệm học">Kinh nghiệm học</option>
          <option value="Dự án">Dự án</option>
        </select>
        <TiptapEditor
          value={newPost.content}
          onChange={(html) => setNewPost((prev) => ({ ...prev, content: html }))}
          placeholder="Nội dung chia sẻ của bạn..."
          minHeight={150}
        />
        <button
          onClick={handleCreatePost}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 self-start"
        >
          <Send className="h-4 w-4" />
          Đăng bài
        </button>
      </section>

      <p className="text-sm text-muted-foreground">{postCount} bài viết</p>

      <div className="grid gap-4">
        {posts.map((post) => (
          <article key={post.slug} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-4">
              <span className="inline-flex rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                {post.category}
              </span>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="h-3.5 w-3.5" />
                  {post.createdAt}
                </span>
              </div>
            </div>

            <Link href={`/discussions/${post.slug}`} className="block">
              <h2 className="mb-2 text-xl font-semibold text-slate-900 hover:text-primary-700">{post.title}</h2>
              <p className="mb-4 text-sm text-muted-foreground">{post.summary}</p>
            </Link>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span>Tác giả: {post.author}</span>
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                {post.replies}
              </span>
              <button
                onClick={() => handleToggleLike(post.slug)}
                className={`inline-flex items-center gap-1 ${likedPosts[`post:${post.slug}`] ? "text-primary-600" : "text-muted-foreground"}`}
              >
                <ThumbsUp className="h-4 w-4" />
                {post.likes}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
