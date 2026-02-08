import { Router } from 'express';
import {createProject, getProject, deleteProject, getChart} from "../controllers/projectController.js";
import {checkDirectoryAccess, checkProjectAccess} from "../middlewares/directoryAccess.js";

const router = Router();

// getProject does not exist, request a directory and it will provide info about all directories and projects inside of that directory
// updateProject does not exist, updating is done from within a chart editor to prevent miscommunication between the socket and the database
router.post('/', checkDirectoryAccess, createProject);
router.get('/:projectId', checkProjectAccess, getProject);
router.delete('/:projectId', checkProjectAccess, deleteProject);

// TODO: [IMPORTANT!] This endpoint only exists for the overview page, FIX THE OVERVIEW!!!
// The overview page currently makes a request to every chart in a directory one by one
// Then the client processes ALL the nodes inside EACH chart to calculate the total input and output
// We should probably build an index when a chart updates with just the data from input and output nodes
//      - To save some compute on this, only update the index when a document is saved (everyone leaves) and whenever it is edited but with a cooldown
// This way we can just query against the index a few times which is much smaller than the entire chart resulting in less bandwidth being  used
// And less client compute, the tradeoff is of course that the building of this index  has to be done on the websocket (i.e. the server)
// But the time lost is made up for by reducing the amount of data that has to be sent on any overview page request
router.get('/chart/:projectId', checkProjectAccess, getChart); 

export default router;