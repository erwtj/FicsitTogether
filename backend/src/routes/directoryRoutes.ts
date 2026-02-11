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

router.get('/:directoryId', checkDirectoryAccess, getDirectory);
router.post('/', checkDirectoryAccess, createDirectory); // body.directoryId is in this case the parent directory in which to create the directory
router.delete('/:directoryId', checkDirectoryAccess, deleteDirectory);
router.get('/root', getRootDirectory);

router.post('/share', checkDirectoryAccess, shareDirectory);
router.delete('/share', checkDirectoryAccess, unshareDirectory);
router.get('/share', getSharedDirectories);

export default router;