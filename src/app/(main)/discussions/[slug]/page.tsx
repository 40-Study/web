"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { notFound, useParams } from "next/navigation";
import { ChevronLeft, MessageSquare, Reply, Send, ThumbsUp } from "lucide-react";
import { TiptapEditor } from "@/components/editor";
import {
  discussionPosts,
  DiscussionComment,
  DiscussionPost,
  DISCUSSION_COMMENT_LIKED_STORAGE_KEY,
  DISCUSSION_POST_LIKED_STORAGE_KEY,
  loadDiscussionPosts,
  saveDiscussionPosts,
} from "../discussion-data";

type LikedMap = Record<string, boolean>;

function countComments(comments: DiscussionComment[]): number {
  return comments.reduce((total, comment) => total + 1 + countComments(comment.replies), 0);
}

function updateCommentTree(
  comments: DiscussionComment[],
  commentId: string,
  updater: (comment: DiscussionComment) => DiscussionComment
): DiscussionComment[] {
  return comments.map((comment) => {
    if (comment.id === commentId) return updater(comment);
    if (comment.replies.length === 0) return comment;

    return {
      ...comment,
      replies: updateCommentTree(comment.replies, commentId, updater),
    };
  });
}

function addReplyToComment(
  comments: DiscussionComment[],
  parentId: string,
  nextReply: DiscussionComment
): DiscussionComment[] {
  return comments.map((comment) => {
    if (comment.id === parentId) {
      return {
        ...comment,
        replies: [...comment.replies, nextReply],
      };
    }

    if (comment.replies.length === 0) return comment;

    return {
      ...comment,
      replies: addReplyToComment(comment.replies, parentId, nextReply),
    };
  });
}

export default function DiscussionDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;

  const [posts, setPosts] = useState<DiscussionPost[]>(discussionPosts);
  const [likedPosts, setLikedPosts] = useState<LikedMap>({});
  const [likedComments, setLikedComments] = useState<LikedMap>({});
  const [newComment, setNewComment] = useState("");
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [openReplyBox, setOpenReplyBox] = useState<Record<string, boolean>>({});
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setPosts(loadDiscussionPosts());

    try {
      const rawLikedPosts = localStorage.getItem(DISCUSSION_POST_LIKED_STORAGE_KEY);
      const rawLikedComments = localStorage.getItem(DISCUSSION_COMMENT_LIKED_STORAGE_KEY);

      if (rawLikedPosts) setLikedPosts(JSON.parse(rawLikedPosts));
      if (rawLikedComments) setLikedComments(JSON.parse(rawLikedComments));
    } catch {
      // ignore parse errors
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const post = useMemo(() => posts.find((item) => item.slug === slug), [posts, slug]);

  const updatePost = (updater: (target: DiscussionPost) => DiscussionPost) => {
    setPosts((prev) => {
      const nextPosts = prev.map((item) => (item.slug === slug ? updater(item) : item));
      saveDiscussionPosts(nextPosts);
      return nextPosts;
    });
  };

  const handleTogglePostLike = () => {
    if (!post) return;

    const key = `post:${post.slug}`;
    const isLiked = likedPosts[key] === true;
    const nextLiked = { ...likedPosts, [key]: !isLiked };
    setLikedPosts(nextLiked);
    localStorage.setItem(DISCUSSION_POST_LIKED_STORAGE_KEY, JSON.stringify(nextLiked));

    updatePost((target) => ({
      ...target,
      likes: isLiked ? Math.max(0, target.likes - 1) : target.likes + 1,
    }));
  };

  const handleToggleCommentLike = (commentId: string) => {
    const key = `comment:${commentId}`;
    const isLiked = likedComments[key] === true;
    const nextLiked = { ...likedComments, [key]: !isLiked };
    setLikedComments(nextLiked);
    localStorage.setItem(DISCUSSION_COMMENT_LIKED_STORAGE_KEY, JSON.stringify(nextLiked));

    updatePost((target) => ({
      ...target,
      comments: updateCommentTree(target.comments, commentId, (comment) => ({
        ...comment,
        likes: isLiked ? Math.max(0, comment.likes - 1) : comment.likes + 1,
      })),
    }));
  };

  const handleAddComment = () => {
    const content = newComment.trim();
    if (!content || !post) return;

    const created: DiscussionComment = {
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      author: "Bạn",
      content,
      createdAt: new Date().toISOString(),
      likes: 0,
      replies: [],
    };

    updatePost((target) => {
      const nextComments = [...target.comments, created];
      return {
        ...target,
        comments: nextComments,
        replies: countComments(nextComments),
      };
    });

    setNewComment("");
  };

  const handleAddReply = (parentId: string) => {
    const content = (replyInputs[parentId] || "").trim();
    if (!content || !post) return;

    const created: DiscussionComment = {
      id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      author: "Bạn",
      content,
      createdAt: new Date().toISOString(),
      likes: 0,
      replies: [],
    };

    updatePost((target) => {
      const nextComments = addReplyToComment(target.comments, parentId, created);
      return {
        ...target,
        comments: nextComments,
        replies: countComments(nextComments),
      };
    });

    setReplyInputs((prev) => ({ ...prev, [parentId]: "" }));
    setOpenReplyBox((prev) => ({ ...prev, [parentId]: false }));
  };

  const renderComment = (comment: DiscussionComment, depth = 0) => {
    const key = `comment:${comment.id}`;
    const isLiked = likedComments[key] === true;
    const isReplyOpen = openReplyBox[comment.id] === true;

    return (
      <div key={comment.id} className={`rounded-xl border bg-white p-4 ${depth > 0 ? "ml-6 mt-3" : "mt-4"}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">{comment.author}</p>
            <p className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleString("vi-VN")}</p>
          </div>
        </div>

        <div
          className="mt-3 text-sm text-slate-700 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: comment.content }}
        />

        <div className="mt-3 flex items-center gap-3 text-sm">
          <button
            onClick={() => handleToggleCommentLike(comment.id)}
            className={`inline-flex items-center gap-1 ${isLiked ? "text-primary-600" : "text-muted-foreground"}`}
          >
            <ThumbsUp className="h-4 w-4" />
            {comment.likes}
          </button>
          <button
            onClick={() =>
              setOpenReplyBox((prev) => ({
                ...prev,
                [comment.id]: !prev[comment.id],
              }))
            }
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary-600"
          >
            <Reply className="h-4 w-4" />
            Trả lời
          </button>
        </div>

        {isReplyOpen && (
          <div className="mt-3 space-y-2">
            <TiptapEditor
              value={replyInputs[comment.id] || ""}
              onChange={(html) =>
                setReplyInputs((prev) => ({
                  ...prev,
                  [comment.id]: html,
                }))
              }
              placeholder="Viết trả lời..."
              minHeight={100}
            />
            <button
              onClick={() => handleAddReply(comment.id)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              <Send className="h-4 w-4" />
              Gửi trả lời
            </button>
          </div>
        )}

        {comment.replies.map((reply) => renderComment(reply, depth + 1))}
      </div>
    );
  };

  if (!post && isHydrated) {
    notFound();
  }

  if (!post) {
    return null;
  }

  const postLikeKey = `post:${post.slug}`;
  const isPostLiked = likedPosts[postLikeKey] === true;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/discussions"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
      >
        <ChevronLeft className="h-4 w-4" />
        Quay lại danh sách thảo luận
      </Link>

      <article className="rounded-2xl border bg-white p-6 md:p-8">
        <header className="mb-6 border-b pb-6">
          <div className="mb-3 inline-flex rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
            {post.category}
          </div>
          <h1 className="mb-3 text-3xl font-bold text-slate-900">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span>Tác giả: {post.author}</span>
            <span>{post.createdAt}</span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              {post.replies} phản hồi
            </span>
            <button
              onClick={handleTogglePostLike}
              className={`inline-flex items-center gap-1 ${isPostLiked ? "text-primary-600" : "text-muted-foreground"}`}
            >
              <ThumbsUp className="h-4 w-4" />
              {post.likes} lượt thích
            </button>
          </div>
        </header>

        <div className="prose prose-slate max-w-none">
          {post.content.map((paragraph, index) => (
            <div
              key={`${post.slug}-paragraph-${index}`}
              dangerouslySetInnerHTML={{ __html: paragraph }}
            />
          ))}
        </div>
      </article>

      <section className="mt-8 rounded-2xl border bg-white p-6 md:p-8">
        <h2 className="text-lg font-semibold text-slate-900">Bình luận ({post.replies})</h2>

        <div className="mt-4 space-y-3">
          <TiptapEditor
            value={newComment}
            onChange={setNewComment}
            placeholder="Viết bình luận của bạn..."
            minHeight={120}
          />
          <button
            onClick={handleAddComment}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Send className="h-4 w-4" />
            Gửi bình luận
          </button>
        </div>

        <div className="mt-4">
          {post.comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có bình luận nào. Hãy mở đầu cuộc thảo luận.</p>
          ) : (
            post.comments.map((comment) => renderComment(comment))
          )}
        </div>
      </section>
    </div>
  );
}
