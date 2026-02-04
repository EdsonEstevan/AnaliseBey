import { Router } from 'express';
import { z } from 'zod';

import {
  createPost,
  createPostComment,
  deletePost,
  likePost,
  listPosts,
  unlikePost,
} from '../modules/posts/posts.service';
import { postCommentSchema, postCreateSchema } from '../modules/posts/posts.schema';
import { authenticate } from '../middleware/auth';

export const postsRouter = Router();

postsRouter.use(authenticate);

postsRouter.get('/', async (req, res) => {
  const schema = z.object({ limit: z.coerce.number().min(5).max(100).optional() });
  const { limit } = schema.parse(req.query);
  const posts = await listPosts(req.user!, limit ?? 50);
  res.json(posts);
});

postsRouter.post('/', async (req, res) => {
  const payload = postCreateSchema.parse(req.body);
  const post = await createPost(req.user!, payload);
  res.status(201).json(post);
});

postsRouter.delete('/:postId', async (req, res) => {
  await deletePost(req.user!, req.params.postId);
  res.json({ success: true });
});

postsRouter.post('/:postId/comments', async (req, res) => {
  const payload = postCommentSchema.parse(req.body);
  const post = await createPostComment(req.user!, req.params.postId, payload);
  res.status(201).json(post);
});

postsRouter.post('/:postId/likes', async (req, res) => {
  const post = await likePost(req.user!, req.params.postId);
  res.json(post);
});

postsRouter.delete('/:postId/likes', async (req, res) => {
  const post = await unlikePost(req.user!, req.params.postId);
  res.json(post);
});
