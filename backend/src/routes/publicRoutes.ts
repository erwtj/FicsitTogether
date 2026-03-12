import { Router } from 'express';
import { getPublicProject } from '../controllers/publicController.js';
import { requireCanViewProject } from '../middlewares/directoryAccess.js';

const router = Router();

// TODO: Rate limit public endpoints
router.get('/projects/:projectId', requireCanViewProject, getPublicProject);
// router.get('/directories/:directoryId', requireCanViewDirectory, getPublicDirectory);

export default router;

