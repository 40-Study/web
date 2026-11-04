/**
 * React Query hooks for discussion forum — posts, comments, votes
 */

import { useQuery, useQueries, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { discussionService } from "@/services/discussion.service";

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const discussionKeys = {
  all: ["discussions"] as const,
  list: (category?: string) => [...discussionKeys.all, "list", category] as const,
  detail: (slug: string) => ["discussion", slug] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────────────

/** Số bài mỗi lượt tải của diễn đàn. */
export const DISCUSSION_PAGE_SIZE = 20;

/**
 * List posts theo từng trang ("Tải thêm"). Trước đây chỉ tải trang 1 nên diễn đàn 77 bài chỉ thấy 20
 * và không có cách xem tiếp (QA3 Q5). `total` lấy từ API để đếm đúng.
 */
export function useDiscussionPosts(category?: string) {
  return useInfiniteQuery({
    queryKey: discussionKeys.list(category),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      discussionService.listPosts({
        category: category || undefined,
        page: pageParam,
        page_size: DISCUSSION_PAGE_SIZE,
      }),
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + p.posts.length, 0);
      return lastPage.posts.length > 0 && loaded < lastPage.total ? allPages.length + 1 : undefined;
    },
  });
}

/**
 * Tổng số bài theo API (một lần gọi page_size=1 mỗi mục, chỉ đọc `total`). Khoá "" = toàn diễn đàn
 * (không lọc danh mục); các khoá khác là danh mục tương ứng.
 */
export function useDiscussionCategoryTotals(categories: readonly string[]) {
  const results = useQueries({
    queries: categories.map((category) => ({
      queryKey: [...discussionKeys.all, "total", category] as const,
      queryFn: () => discussionService.listPosts({ category: category || undefined, page: 1, page_size: 1 }),
      select: (data: { total: number }) => data.total,
    })),
  });
  const totals: Record<string, number> = {};
  categories.forEach((category, i) => {
    const total = results[i]?.data;
    if (typeof total === "number") totals[category] = total;
  });
  return totals;
}

/** Single post with comments by slug */
export function useDiscussionPost(slug: string) {
  return useQuery({
    queryKey: discussionKeys.detail(slug),
    queryFn: () => discussionService.getPostBySlug(slug),
    enabled: !!slug,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

/** Create a new discussion post */
export function useCreateDiscussionPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; content: string; category: string }) =>
      discussionService.createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discussionKeys.all });
    },
  });
}

/** Add a comment to a post */
export function useAddDiscussionComment(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { content: string; parent_id?: string }) =>
      discussionService.addComment(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discussionKeys.detail(slug) });
    },
  });
}

/** Vote on a post or comment */
export function useVoteDiscussion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, voteType }: { id: string; voteType: string }) =>
      discussionService.vote(id, voteType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discussionKeys.all });
    },
  });
}

/** Remove vote from a post or comment */
export function useRemoveVoteDiscussion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => discussionService.removeVote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discussionKeys.all });
    },
  });
}
