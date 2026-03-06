import { Router } from 'express';
import {createProject, getProject, deleteProject, downloadProject} from "../controllers/projectController.js";
import {checkDirectoryAccess, checkProjectAccess} from "../middlewares/directoryAccess.js";

const router = Router();

// getProject does not exist, request a directory and it will provide info about all directories and projects inside of that directory
// updateProject does not exist, updating is done from within a chart editor to prevent miscommunication between the socket and the database
router.post('/', checkDirectoryAccess, createProject);
router.get('/:projectId', checkProjectAccess, getProject);
router.delete('/:projectId', checkProjectAccess, deleteProject);

router.get('/:projectId/download', checkProjectAccess, downloadProject);

export default router;