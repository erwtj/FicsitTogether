import { Router } from 'express';
import {requireCanEditDirectory, requireDirectoryOwner} from "../middlewares/directoryAccess.js";
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
    updateDirectoryPublic, renameDirectory, countTotalsForDirectoryOwner, countTotalsForRootOwner
} from "../controllers/directoryController.js";
import {uploadSingleJson} from "../middlewares/upload.js";
import { validate } from '../middlewares/validate.js';
import {
    createDirectoryBodySchema,
    directoryIdParamSchema,
    shareDirectoryBodySchema,
    unshareDirectoryBodySchema,
    updatePublicStatusBodySchema,
    renameDirectoryBodySchema
} from '../validation/schemas.js';

const router = Router();

// Important! /root and /share should go before /:directoryId, otherwise they will be interpreted as id's and will route incorrectly
router.get('/root', getRootDirectory);
router.get('/shared', getSharedDirectories);
router.get('/root/owner/count', countTotalsForRootOwner );

router.get('/:directoryId', validate({ params: directoryIdParamSchema }), requireCanEditDirectory, getDirectory);
router.post('/', validate({ body: createDirectoryBodySchema }), requireCanEditDirectory, createDirectory);
router.delete('/:directoryId', validate({ params: directoryIdParamSchema }), requireCanEditDirectory, deleteDirectory);
router.put('/:directoryId/public', validate({ params: directoryIdParamSchema, body: updatePublicStatusBodySchema }), requireCanEditDirectory, updateDirectoryPublic);
router.patch('/:directoryId/name', validate({ params: directoryIdParamSchema, body: renameDirectoryBodySchema }), requireDirectoryOwner, renameDirectory);

router.get('/:directoryId/owner/count', validate({ params: directoryIdParamSchema }), requireCanEditDirectory, countTotalsForDirectoryOwner );

router.post('/:directoryId/share', validate({ params: directoryIdParamSchema, body: shareDirectoryBodySchema }), requireDirectoryOwner, shareDirectory);
router.post('/:directoryId/unshare', validate({ params: directoryIdParamSchema, body: unshareDirectoryBodySchema }), requireDirectoryOwner, unshareDirectory); // Post not delete since we are sending the userId in the body, not the url
router.post('/:directoryId/leave', validate({ params: directoryIdParamSchema }), requireCanEditDirectory, leaveDirectory);

router.get('/:directoryId/share', validate({ params: directoryIdParamSchema }), requireDirectoryOwner, getDirectorySharedWith);
router.get('/:directoryId/charts', validate({ params: directoryIdParamSchema }), requireCanEditDirectory, getChartsInDirectory);

router.post('/:directoryId/upload', validate({ params: directoryIdParamSchema }), requireCanEditDirectory, uploadSingleJson, uploadProject);

export default router;