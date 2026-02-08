import { Router } from 'express';
import {helloWorld} from "../controllers/projectController.js";

const router = Router();

router.get('/hello', helloWorld);

// router.get('/', getItems);
// router.get('/:id', getItemById);
// router.post('/', createItem);
// router.put('/:id', updateItem);
// router.delete('/:id', deleteItem);

export default router;