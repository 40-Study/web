"use client";

/**
 * Discussion forum list page — social feed with composer, post cards, and sidebar
 */

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { useDiscussionPosts, useCreateDiscussionPost, useVoteDiscussion, useRemoveVoteDiscussion } from "@/hooks/queries/use-discussions";
import { DiscussionPostCard } from "./discussion-post-card";
import { DiscussionComposer } from "./discussion-composer";
import { DiscussionSidebar } from "./discussion-sidebar";

export default function DiscussionsPage() {
  const [category, setCategory] = useState<string | undefined>(undefined);

  const { data, isLoading } = useDiscussionPosts(category);
  const createPost = useCreateDiscussionPost();
  const votePost = useVoteDiscussion();
  const removeVote = useRemoveVoteDiscussion();

  const posts = data?.posts ?? [];

  const handleVote = (id: string, hasVoted: boolean) => {
    if (hasVoted) {
      removeVote.mutate({ id });
    } else {
      votePost.mutate({ id, voteType: "upvote" });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Diễn đàn thảo luận</h1>
        <p className="text-slate-500 mt-1">Trao đổi, chia sẻ và học hỏi cùng cộng đồng</p>
      </div>

      <div className="flex gap-6">
        {/* Main feed */}
        <div className="flex-1 min-w-0">
          <DiscussionComposer
            onSubmit={(data) => createPost.mutate(data)}
            isSubmitting={createPost.isPending}
          />

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
                  delay={i * 50}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="w-64 shrink-0 hidden lg:block">
          <DiscussionSidebar
            posts={posts}
            activeCategory={category}
            onCategoryChange={setCategory}
          />
        </aside>
      </div>
    </div>
  );
}
