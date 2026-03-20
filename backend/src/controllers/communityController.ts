import { Response, NextFunction, Request } from 'express';
import { validationResult } from 'express-validator';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { awardPoints, POINTS } from '../services/gamificationService';

export async function getPosts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { post_type, location, page = '1', limit = '20' } = req.query;
    const offset = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);

    let query = db('community_posts')
      .join('users', 'community_posts.user_id', 'users.id')
      .where('community_posts.is_available', true)
      .select(
        'community_posts.*',
        'users.name as author_name',
        'users.avatar_url as author_avatar'
      );

    if (post_type) query = query.where('community_posts.post_type', post_type as string);
    if (location) query = query.whereILike('community_posts.location', `%${location as string}%`);

    const [posts, countResult] = await Promise.all([
      query.clone().orderBy('community_posts.created_at', 'desc').limit(parseInt(limit as string, 10)).offset(offset),
      query.clone().count('* as total').first(),
    ]);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page: parseInt(page as string, 10),
          limit: parseInt(limit as string, 10),
          total: parseInt(String(countResult?.total ?? 0), 10),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getPostById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const post = await db('community_posts')
      .join('users', 'community_posts.user_id', 'users.id')
      .where('community_posts.id', req.params.id)
      .select(
        'community_posts.*',
        'users.name as author_name',
        'users.avatar_url as author_avatar'
      )
      .first();

    if (!post) {
      next(createError('Post not found', 404));
      return;
    }

    res.json({ success: true, data: { post } });
  } catch (err) {
    next(err);
  }
}

export async function createPost(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const [post] = await db('community_posts')
      .insert({ ...body, user_id: req.userId })
      .returning('*');

    await awardPoints(req.userId!, POINTS.COMMUNITY_POST, 'community post created');

    res.status(201).json({ success: true, data: { post } });
  } catch (err) {
    next(err);
  }
}

export async function updatePost(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const existing = await db('community_posts')
      .where({ id: req.params.id, user_id: req.userId })
      .first();

    if (!existing) {
      next(createError('Post not found', 404));
      return;
    }

    const [post] = await db('community_posts')
      .where({ id: req.params.id, user_id: req.userId })
      .update(req.body as Record<string, unknown>)
      .returning('*');

    res.json({ success: true, data: { post } });
  } catch (err) {
    next(err);
  }
}

export async function deletePost(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const deleted = await db('community_posts')
      .where({ id: req.params.id, user_id: req.userId })
      .delete();

    if (!deleted) {
      next(createError('Post not found', 404));
      return;
    }

    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
}

export async function getUserPosts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const posts = await db('community_posts')
      .where('user_id', req.userId)
      .orderBy('created_at', 'desc');

    res.json({ success: true, data: { posts, count: posts.length } });
  } catch (err) {
    next(err);
  }
}
