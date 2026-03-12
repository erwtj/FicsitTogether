import { Router } from 'express';
import {requireCanEditDirectory} from "../middlewares/directoryAccess.js";
import {
    getDirectory,
    createDirectory,
    deleteDirectory,
    shareDirectory,
    unshareDirectory,
    getRootDirectory,
    getSharedDirectories,
    getDirectorySharedWith, leaveDirectory,
    getChartsInDirectory, uploadProject,
    updateDirectoryPublic
} from "../controllers/directoryController.js";
import {uploadSingleJson} from "../middlewares/upload.js";

const router = Router();

// Important! /root and /share should go before /:directoryId, otherwise they will be interpreted as id's and will route incorrectly
router.get('/root', getRootDirectory);
router.get('/shared', getSharedDirectories);

router.get('/:directoryId', requireCanEditDirectory, getDirectory);
router.post('/', requireCanEditDirectory, createDirectory);
router.delete('/:directoryId', requireCanEditDirectory, deleteDirectory);
router.put('/:directoryId', requireCanEditDirectory, updateDirectoryPublic);

router.post('/:directoryId/share', requireCanEditDirectory, shareDirectory);
router.delete('/:directoryId/share', requireCanEditDirectory, unshareDirectory);
router.get('/:directoryId/share', requireCanEditDirectory, getDirectorySharedWith);
router.get('/:directoryId/charts', requireCanEditDirectory, getChartsInDirectory);
router.get('/:directoryId/leave', requireCanEditDirectory, leaveDirectory);

router.post('/:directoryId/upload', requireCanEditDirectory, uploadSingleJson, uploadProject);

export default router;