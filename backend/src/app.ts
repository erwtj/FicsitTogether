import express from 'express';
import cors from 'cors';
import projectRoutes from './routes/projectRoutes.js';
import directoryRoutes from './routes/directoryRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import config from './config/config.js';
import userRoutes from "./routes/userRoutes.js";
import {checkJwt} from "./middlewares/auth.js";
import {attachUser} from "./middlewares/attachUser.js";

const app = express();

// Parse json bodies
app.use(express.json());

// Cors middleware
app.use(cors({
    origin: config.corsOrigin,
    methods: 'GET, POST, PUT, DELETE, OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true
}));

// Every route requires login
app.use(checkJwt);
app.use(attachUser);

// Routes
app.use('/api/projects', projectRoutes);
app.use('/api/directories', directoryRoutes);
app.use('/api/users', userRoutes);

// Global error handler
app.use(errorHandler);

export default app;