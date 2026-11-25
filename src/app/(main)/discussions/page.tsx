"use client";

/**
 * Discussion forum list page — social feed with composer, post cards, and sidebar
 */

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loginHref } from "@/lib/login-redirect";
import { useAuthStore } from "@/stores/auth.store";
import { useDiscussionPosts, useDiscussionCategoryTotals, useCreateDiscussionPost, useVoteDiscussion, useRemoveVoteDiscussion } from "@/hooks/queries/use-discussions";
import { DiscussionPostCard } from "./discussion-post-card";
import { DiscussionComposer } from "./discussion-composer";
import { DiscussionSidebar } from "./discussion-sidebar";
import { DISCUSSION_CATEGORIES } from "./discussion-categories";

// "" = toàn diễn đàn, để "Tất cả" luôn là tổng thật kể cả khi đang lọc một danh mục.
const TOTAL_KEYS = ["", ...DISCUSSION_CATEGORIES.map((c) => c.value)];

// `useSearchParams` cần ranh giới Suspense (trang bị tạo tĩnh); vỏ này chỉ bọc phần nội dung.
export default function DiscussionsPage() {
  return (
    <Suspense fallback={null}>
      <DiscussionsPageContent />
    </Suspense>
  );
}

function DiscussionsPageContent() {
  const router = useRouter();
  // Q7-PG-02: chip danh mục nằm trên URL (`?category=`, như /courses và /contests) để tải lại / chia sẻ link không mất.
  // Đọc ngay ở lần render đầu; giá trị lạ bị bỏ qua (về "Tất cả"). L-2: URL đổi sau đó (điều hướng mềm cùng route, vd
  // footer "/discussions" khi đang ở ?category=qna) cũng được theo: so với giá trị URL lần trước ngay trong lúc render.
  // Chỉ chiều URL -> state; bấm chip ghi URL bằng replace, URL về cùng giá trị nên không lặp.
  const wantedCategory = useSearchParams().get("category");
  const urlCategory = DISCUSSION_CATEGORIES.find((c) => c.value === wantedCategory)?.value;
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isSessionPending = useAuthStore((s) => !s.isAuthenticated && s.sessionStatus === "checking");
  const [category, setCategory] = useState<string | undefined>(urlCategory);
  const [seenUrlCategory, setSeenUrlCategory] = useState<string | undefined>(urlCategory);
  if (urlCategory !== seenUrlCategory) {
    setSeenUrlCategory(urlCategory);
    setCategory(urlCategory);
  }
  const handleCategoryChange = (next: string | undefined) => {
    setCategory(next);
    router.replace(next ? `/discussions?category=${encodeURIComponent(next)}` : "/discussions", { scroll: false });
  };

  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useDiscussionPosts(category);
  const categoryTotals = useDiscussionCategoryTotals(TOTAL_KEYS);
  const createPost = useCreateDiscussionPost();
  const votePost = useVoteDiscussion();
  const removeVote = useRemoveVoteDiscussion();

  const posts = useMemo(() => data?.pages.flatMap((p) => p.posts) ?? [], [data]);
  const feedTotal = data?.pages[0]?.total ?? posts.length;
  const allTotal = categoryTotals[""] ?? (category ? undefined : feedTotal);

  const handleVote = (id: string, hasVoted: boolean) => {
    // Q6-PG-12: khách bấm tim đi đăng nhập (như tim ở thẻ khoá học), không nhận toast lỗi 401.
    if (!isAuthenticated) {
      router.push(loginHref("/discussions"));
      return;
    }
    if (hasVoted) {
      removeVote.mutate({ id });
    } else {
      votePost.mutate({ id, voteType: "upvote" });
    }
  };

  return (
    <div className="page-container py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Diễn đàn thảo luận</h1>
        <p className="text-slate-500 mt-1">Trao đổi, chia sẻ và học hỏi cùng cộng đồng</p>
      </div>

      <div className="flex gap-6">
        {/* Main feed */}
        <div className="flex-1 min-w-0">
          {/* Q6-PG-14: khách không có ô soạn bài đầy đủ rồi mới biết cần tài khoản lúc gửi. */}
          {isAuthenticated ? (
            <DiscussionComposer
              onSubmit={(data) => createPost.mutate(data)}
              isSubmitting={createPost.isPending}
            />
          ) : !isSessionPending ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6 flex items-center justify-between gap-3">
              <p className="text-sm text-slate-500">Đăng nhập để bắt đầu một cuộc thảo luận.</p>
              <Link
                href={loginHref("/discussions")}
                className="shrink-0 rounded-xl bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
              >
                Đăng nhập để đăng bài
              </Link>
            </div>
          ) : null}

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-pulse">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-slate-200" />
                    <div className="space-y-1.5">
                      <div className="h-3 w-24 bg-slate-200 rounded" />
                      <div className="h-2.5 w-16 bg-slate-100 rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-3/4 bg-slate-200 rounded mb-2" />
                  <div className="h-3 w-full bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
                <MessageSquare className="w-7 h-7 text-primary-400" />
              </div>
              <p className="text-slate-500">Chưa có bài viết nào. Hãy mở đầu cuộc thảo luận!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post, i) => (
                <DiscussionPostCard
                  key={post.id}
                  post={post}
                  onVote={handleVote}
                  delay={(i % 20) * 50}
                />
              ))}
              <div className="flex flex-col items-center gap-2 pt-2">
                <p className="text-sm text-slate-500" aria-live="polite">
                  Đang hiển thị {posts.length} / {feedTotal} bài viết
                </p>
                {hasNextPage && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? "Đang tải..." : "Tải thêm bài viết"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="w-64 shrink-0 hidden lg:block">
          <DiscussionSidebar
            total={allTotal}
            categoryCounts={categoryTotals}
            activeCategory={category}
            onCategoryChange={handleCategoryChange}
          />
        </aside>
      </div>
    </div>
  );
}
