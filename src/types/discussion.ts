/**
 * Discussion forum types matching backend DTOs
 */

export interface ForumPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  category: string;
  author_id: string;
  author_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  upvote_count: number;
  reply_count: number;
  user_vote?: string; // "upvote" or null
}

export interface ForumPostListResponse {
  posts: ForumPost[];
  total: number;
  page: number;
  page_size: number;
}

export interface ForumComment {
  id: string;
  content: string;
  author_id: string;
  author_name: string;
  avatar_url?: string;
  created_at: string;
  upvote_count: number;
  user_vote?: string;
  replies: ForumComment[];
}

export interface ForumPostDetail extends ForumPost {
  comments: ForumComment[];
}
