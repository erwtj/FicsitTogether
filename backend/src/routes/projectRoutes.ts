import { Router } from 'express';
import {createProject, getProject, deleteProject, downloadProject, updateProjectPublic} from "../controllers/projectController.js";
import {requireCanEditDirectory, requireCanEditProject} from "../middlewares/directoryAccess.js";

const router = Router();

// updateProject does not exist, updating is done from within a chart editor to prevent miscommunication between the socket and the database
router.post('/', requireCanEditDirectory, createProject);
router.get('/:projectId', requireCanEditProject, getProject);
router.delete('/:projectId', requireCanEditProject, deleteProject);
router.put('/:projectId/public', requireCanEditProject, updateProjectPublic);

router.get('/:projectId/download', requireCanEditProject, downloadProject);

export default router;