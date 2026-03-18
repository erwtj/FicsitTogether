import { Router } from 'express';
import {createProject, getProject, deleteProject, downloadProject, updateProjectPublic} from "../controllers/projectController.js";
import {requireCanEditDirectory, requireCanEditProject} from "../middlewares/directoryAccess.js";
import { validate } from '../middlewares/validate.js';
import { 
    createProjectBodySchema, 
    projectIdParamSchema, 
    updatePublicStatusBodySchema 
} from '../validation/schemas.js';

const router = Router();

// updateProject does not exist, updating is done from within a chart editor to prevent miscommunication between the socket and the database
router.post('/', validate({ body: createProjectBodySchema }), requireCanEditDirectory, createProject);
router.get('/:projectId', validate({ params: projectIdParamSchema }), requireCanEditProject, getProject);
router.delete('/:projectId', validate({ params: projectIdParamSchema }), requireCanEditProject, deleteProject);
router.put('/:projectId/public', validate({ params: projectIdParamSchema, body: updatePublicStatusBodySchema }), requireCanEditProject, updateProjectPublic);

router.get('/:projectId/download', validate({ params: projectIdParamSchema }), requireCanEditProject, downloadProject);

export default router;