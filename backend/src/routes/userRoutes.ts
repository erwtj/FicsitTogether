import { Router } from 'express';
import {getMe, deleteMe} from "../controllers/userController.js";

const router = Router();

router.get('/me', getMe);
router.delete('/me', deleteMe);

export default router;