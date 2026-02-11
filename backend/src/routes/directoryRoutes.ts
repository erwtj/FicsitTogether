import { Router } from 'express';
import {checkDirectoryAccess} from "../middlewares/directoryAccess.js";
import {
    getDirectory,
    createDirectory,
    deleteDirectory,
    shareDirectory,
    unshareDirectory, 
    getRootDirectory, 
    getSharedDirectories
} from "../controllers/directoryController.js";

const router = Router();

// Important! /root and /share should go before /:directoryId, otherwise they will be interpreted as id's and will route incorrectly
router.get('/root', getRootDirectory);
router.get('/share', getSharedDirectories);

router.get('/:directoryId', checkDirectoryAccess, getDirectory);
router.post('/', checkDirectoryAccess, createDirectory); // body.directoryId is in this case the parent directory in which to create the directory
router.delete('/:directoryId', checkDirectoryAccess, deleteDirectory);

router.post('/share', checkDirectoryAccess, shareDirectory);
router.delete('/share', checkDirectoryAccess, unshareDirectory);

export default router;