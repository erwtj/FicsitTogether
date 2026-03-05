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
    getChartsInDirectory
} from "../controllers/directoryController.js";

const router = Router();

// Important! /root and /share should go before /:directoryId, otherwise they will be interpreted as id's and will route incorrectly
router.get('/root', getRootDirectory); // get your root directory
router.get('/shared', getSharedDirectories); // get directories shared with you

router.get('/:directoryId', checkDirectoryAccess, getDirectory);
router.post('/', checkDirectoryAccess, createDirectory); // body.directoryId is in this case the parent directory in which to create the directory
router.delete('/:directoryId', checkDirectoryAccess, deleteDirectory);

router.post('/:directoryId/share', checkDirectoryAccess, shareDirectory); // share with someone
router.delete('/:directoryId/share', checkDirectoryAccess, unshareDirectory); // unshare someone or yourself
router.get('/:directoryId/share', checkDirectoryAccess, getDirectorySharedWith); // check with who a directory is shared
router.get('/:directoryId/charts', checkDirectoryAccess, getChartsInDirectory); // get all charts in directory and sub-directories
router.get('/:directoryId/leave', checkDirectoryAccess, leaveDirectory); // leave a shared directory (unshare yourself)


export default router;