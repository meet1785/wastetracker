import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import db from '../config/database';
import { createError } from '../middleware/errorHandler';
import { updateStreak } from '../services/gamificationService';

function generateToken(userId: string, email: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');
  return jwt.sign({ userId, email }, secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as string,
  } as jwt.SignOptions);
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { name, email, password, dietary_preferences = [] } = req.body as {
      name: string; email: string; password: string; dietary_preferences?: string[];
    };

    const existing = await db('users').where('email', email).first();
    if (existing) {
      next(createError('Email already registered', 409));
      return;
    }

    const password_hash = await bcrypt.hash(password, 12);

    const [user] = await db('users')
      .insert({ name, email, password_hash, dietary_preferences: JSON.stringify(dietary_preferences) })
      .returning(['id', 'name', 'email', 'dietary_preferences', 'points', 'streak_days', 'items_saved', 'money_saved', 'created_at']);

    const token = generateToken(user.id as string, user.email as string);

    res.status(201).json({
      success: true,
      data: { user, token },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { email, password } = req.body as { email: string; password: string };

    const user = await db('users').where('email', email).first();
    if (!user) {
      next(createError('Invalid email or password', 401));
      return;
    }

    const valid = await bcrypt.compare(password, user.password_hash as string);
    if (!valid) {
      next(createError('Invalid email or password', 401));
      return;
    }

    await updateStreak(user.id as string);

    const token = generateToken(user.id as string, user.email as string);

    // Return user without password_hash
    const { password_hash: _ph, ...safeUser } = user as Record<string, unknown>;

    res.json({ success: true, data: { user: safeUser, token } });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request & { userId?: string }, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await db('users')
      .where('id', req.userId)
      .select('id', 'name', 'email', 'dietary_preferences', 'points', 'streak_days', 'items_saved', 'money_saved', 'avatar_url', 'created_at', 'last_active')
      .first();

    if (!user) {
      next(createError('User not found', 404));
      return;
    }

    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: Request & { userId?: string }, res: Response, next: NextFunction): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { name, dietary_preferences, avatar_url } = req.body as {
      name?: string; dietary_preferences?: string[]; avatar_url?: string;
    };

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (dietary_preferences !== undefined) updateData.dietary_preferences = JSON.stringify(dietary_preferences);
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

    const [user] = await db('users')
      .where('id', req.userId)
      .update(updateData)
      .returning(['id', 'name', 'email', 'dietary_preferences', 'points', 'streak_days', 'items_saved', 'money_saved', 'avatar_url']);

    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req: Request & { userId?: string }, res: Response, next: NextFunction): Promise<void> {
  try {
    const { current_password, new_password } = req.body as { current_password: string; new_password: string };

    const user = await db('users').where('id', req.userId).first();
    if (!user) {
      next(createError('User not found', 404));
      return;
    }

    const valid = await bcrypt.compare(current_password, user.password_hash as string);
    if (!valid) {
      next(createError('Current password is incorrect', 400));
      return;
    }

    const password_hash = await bcrypt.hash(new_password, 12);
    await db('users').where('id', req.userId).update({ password_hash });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
}
