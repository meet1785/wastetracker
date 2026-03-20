import { Router } from 'express';
import { body } from 'express-validator';
import {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  getUserPosts,
} from '../controllers/communityController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', getPosts);
router.get('/:id', getPostById);

router.use(authenticate);

router.get('/my/posts', getUserPosts);

router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('item_name').trim().notEmpty().withMessage('Item name is required'),
    body('post_type').isIn(['give', 'sell', 'trade']).withMessage('post_type must be give, sell, or trade'),
    body('price').optional().isFloat({ min: 0 }),
    body('quantity').optional().isFloat({ min: 0 }),
  ],
  createPost
);

router.put('/:id', authenticate, updatePost);
router.delete('/:id', authenticate, deletePost);

export default router;
