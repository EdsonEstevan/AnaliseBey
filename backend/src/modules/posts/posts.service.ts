import { Prisma } from '@prisma/client';
import type { z } from 'zod';

import { prisma } from '../../db/prisma';
import { AuthUser } from '../../types/auth';
import { ApiError } from '../../utils/apiError';
import { postCommentSchema, postCreateSchema } from './posts.schema';

const userPreviewSelect = {
  id: true,
  name: true,
  username: true,
  role: true,
} satisfies Prisma.UserSelect;

type PostCreateInput = z.infer<typeof postCreateSchema>;
type PostCommentInput = z.infer<typeof postCommentSchema>;

type PostWithRelations = Prisma.PostGetPayload<{
  include: ReturnType<typeof buildPostInclude>;
}>;

function buildPostInclude(userId: string) {
  return {
    author: { select: userPreviewSelect },
    comments: {
      include: { author: { select: userPreviewSelect } },
      orderBy: { createdAt: 'asc' as const },
    },
    likes: { where: { userId }, select: { userId: true } },
    _count: { select: { likes: true, comments: true } },
  } satisfies Prisma.PostInclude;
}

function serializePost(post: PostWithRelations) {
  return {
    id: post.id,
    content: post.content,
    imageUrl: post.imageUrl ?? undefined,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: post.author,
    likeCount: post._count.likes,
    commentCount: post._count.comments,
    likedByCurrentUser: post.likes.length > 0,
    comments: post.comments.map((comment) => ({
      id: comment.id,
      postId: comment.postId,
      content: comment.content,
      createdAt: comment.createdAt,
      author: comment.author,
    })),
  };
}

async function getPostOrThrow(userId: string, postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: buildPostInclude(userId),
  });
  if (!post) {
    throw new ApiError(404, 'Post não encontrado.');
  }
  return post;
}

async function ensurePostExists(postId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true, userId: true } });
  if (!post) {
    throw new ApiError(404, 'Post não encontrado.');
  }
  return post;
}

export async function listPosts(user: AuthUser, limit = 50) {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: buildPostInclude(user.id),
  });
  return posts.map(serializePost);
}

export async function createPost(user: AuthUser, payload: PostCreateInput) {
  const post = await prisma.post.create({
    data: {
      userId: user.id,
      content: payload.content.trim(),
      imageUrl: payload.imageUrl ?? null,
    },
    include: buildPostInclude(user.id),
  });
  return serializePost(post);
}

export async function deletePost(user: AuthUser, postId: string) {
  const post = await ensurePostExists(postId);
  if (post.userId !== user.id) {
    throw new ApiError(403, 'Você só pode excluir suas próprias postagens.');
  }
  await prisma.post.delete({ where: { id: postId } });
}

export async function createPostComment(user: AuthUser, postId: string, payload: PostCommentInput) {
  await ensurePostExists(postId);
  await prisma.postComment.create({
    data: {
      postId,
      userId: user.id,
      content: payload.content.trim(),
    },
  });
  const post = await getPostOrThrow(user.id, postId);
  return serializePost(post);
}

export async function likePost(user: AuthUser, postId: string) {
  await ensurePostExists(postId);
  await prisma.postLike.upsert({
    where: { postId_userId: { postId, userId: user.id } },
    create: { postId, userId: user.id },
    update: {},
  });
  const post = await getPostOrThrow(user.id, postId);
  return serializePost(post);
}

export async function unlikePost(user: AuthUser, postId: string) {
  await ensurePostExists(postId);
  await prisma.postLike.deleteMany({ where: { postId, userId: user.id } });
  const post = await getPostOrThrow(user.id, postId);
  return serializePost(post);
}
