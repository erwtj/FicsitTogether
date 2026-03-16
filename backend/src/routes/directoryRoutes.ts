import { Router } from 'express';
import {requireCanEditDirectory, requireCanEditProject, requireDirectoryOwner} from "../middlewares/directoryAccess.js";
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
router.put('/:directoryId/public', requireCanEditDirectory, updateDirectoryPublic);

router.post('/:directoryId/share', requireDirectoryOwner, shareDirectory);
router.delete('/:directoryId/share', requireCanEditDirectory, unshareDirectory); // Both the owner and shared users can unshare (the owner can unshare others, and shared users can unshare themselves to remove their access)
router.get('/:directoryId/share', requireCanEditDirectory, getDirectorySharedWith);
router.get('/:directoryId/charts', requireCanEditDirectory, getChartsInDirectory);
router.get('/:directoryId/leave', requireCanEditDirectory, leaveDirectory);

router.post('/:directoryId/upload', requireCanEditDirectory, uploadSingleJson, uploadProject);

export default router;