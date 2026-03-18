import { Router } from 'express';
import {getPublicDirectory, getPublicProject} from '../controllers/publicController.js';
import {requireCanViewDirectory, requireCanViewProject} from '../middlewares/directoryAccess.js';
import { validate } from '../middlewares/validate.js';
import { directoryIdParamSchema, projectIdParamSchema } from '../validation/schemas.js';

const router = Router();

router.get('/projects/:projectId', validate({ params: projectIdParamSchema }), requireCanViewProject, getPublicProject);
router.get('/directories/:directoryId', validate({ params: directoryIdParamSchema }), requireCanViewDirectory, getPublicDirectory);

export default router;

