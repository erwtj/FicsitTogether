import { Router } from 'express';
import {checkDirectoryAccess} from "../middlewares/directoryAccess.js";
import {
    getDirectory,
    createDirectory,
    deleteDirectory,
    shareDirectory,
    unshareDirectory,
    getRootDirectory,
    getSharedDirectories,
    getDirectorySharedWith, leaveDirectory,
    getChartsInDirectory, uploadProject
} from "../controllers/directoryController.js";
import {uploadSingleJson} from "../middlewares/upload.js";

const router = Router();

// Important! /root and /share should go before /:directoryId, otherwise they will be interpreted as id's and will route incorrectly
router.get('/root', getRootDirectory);
router.get('/shared', getSharedDirectories);

router.get('/:directoryId', checkDirectoryAccess, getDirectory);
router.post('/', checkDirectoryAccess, createDirectory);
router.delete('/:directoryId', checkDirectoryAccess, deleteDirectory);

router.post('/:directoryId/share', checkDirectoryAccess, shareDirectory);
router.delete('/:directoryId/share', checkDirectoryAccess, unshareDirectory);
router.get('/:directoryId/share', checkDirectoryAccess, getDirectorySharedWith);
router.get('/:directoryId/charts', checkDirectoryAccess, getChartsInDirectory);
router.get('/:directoryId/leave', checkDirectoryAccess, leaveDirectory);

router.post('/:directoryId/upload', checkDirectoryAccess, uploadSingleJson, uploadProject);

export default router;