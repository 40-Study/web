/**
 * React Query hooks for discussion forum — posts, comments, votes
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { discussionService } from "@/services/discussion.service";

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const discussionKeys = {
  all: ["discussions"] as const,
  list: (category?: string, page?: number) =>
    [...discussionKeys.all, "list", category, page] as const,
  detail: (slug: string) => ["discussion", slug] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────────────

/** List posts, optionally filtered by category and paginated */
export function useDiscussionPosts(category?: string, page?: number) {
  return useQuery({
    queryKey: discussionKeys.list(category, page),
    queryFn: () =>
      discussionService.listPosts({
        category: category || undefined,
        page: page ?? 1,
        page_size: 20,
      }),
  });
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
