import { z } from 'zod';
import {
    MAX_NAME_LENGTH,
    MAX_DESCRIPTION_LENGTH,
    MAX_CHART_NODES,
    MAX_CHART_EDGES,
    MAX_MOVABLE_POINTS
} from 'dtolib';

// Common reusable schemas
const uuidSchema = z.string().uuid('Invalid UUID format');
const usernameSchema = z.string().min(1, 'Username is required').max(100, 'Username is too long');

/* Params Schemas */

export const projectIdParamSchema = z.object({
    projectId: uuidSchema
});

export const directoryIdParamSchema = z.object({
    directoryId: uuidSchema
});

/* Body Schemas */

// Project creation
export const createProjectBodySchema = z.object({
    directoryId: uuidSchema,
    name: z.string()
        .min(1, 'Project name is required')
        .max(MAX_NAME_LENGTH, `Project name must be at most ${MAX_NAME_LENGTH} characters`),
    description: z.string()
        .min(1, 'Project description is required')
        .max(MAX_DESCRIPTION_LENGTH, `Project description must be at most ${MAX_DESCRIPTION_LENGTH} characters`)
});

// Directory creation
export const createDirectoryBodySchema = z.object({
    directoryId: uuidSchema,
    name: z.string()
        .min(1, 'Directory name is required')
        .max(MAX_NAME_LENGTH, `Directory name must be at most ${MAX_NAME_LENGTH} characters`)
});

// Update public status (for both projects and directories)
export const updatePublicStatusBodySchema = z.object({
    isPublic: z.boolean({
        required_error: 'isPublic field is required',
        invalid_type_error: 'isPublic must be a boolean'
    })
});

// Rename directory
export const renameDirectoryBodySchema = z.object({
    name: z.string()
        .min(1, 'Directory name is required')
        .max(MAX_NAME_LENGTH, `Directory name must be at most ${MAX_NAME_LENGTH} characters`)
});

// Share directory with user
export const shareDirectoryBodySchema = z.object({
    user: usernameSchema
});

// Unshare directory from user
export const unshareDirectoryBodySchema = z.object({
    userId: uuidSchema
});

// Chart data schema (for uploaded projects) // TODO: Check correctness of chart schemas
const chartNodeSchema = z.object({
    id: z.string(),
    type: z.string(),
    position: z.object({
        x: z.number(),
        y: z.number()
    }),
    data: z.record(z.any()),
    width: z.number(),
    height: z.number()
});

const chartEdgeSchema = z.object({
    id: z.string(),
    type: z.string(),

    source: z.string(),
    target: z.string(),
    sourceHandle: z.string().optional(),
    targetHandle: z.string().optional(),

    data: z.object({
        throughput: z.number(),
        movablePoints: z.array(z.object({
            id: z.string(),
            x: z.number(),
            y: z.number()
        })).max(MAX_MOVABLE_POINTS, `Maximum ${MAX_MOVABLE_POINTS} movable points per edge`).optional()
    })
});

export const uploadProjectBodySchema = z.object({
    name: z.string()
        .max(MAX_NAME_LENGTH, `Project name must be at most ${MAX_NAME_LENGTH} characters`),
    description: z.string()
        .max(MAX_DESCRIPTION_LENGTH, `Project description must be at most ${MAX_DESCRIPTION_LENGTH} characters`),
    chart: z.object({
        nodes: z.array(chartNodeSchema)
            .max(MAX_CHART_NODES, `Maximum ${MAX_CHART_NODES} nodes allowed`),
        edges: z.array(chartEdgeSchema)
            .max(MAX_CHART_EDGES, `Maximum ${MAX_CHART_EDGES} edges allowed`)
    })
});

// Inferred types for hinting (if needed we don't use it right now)
export type CreateProjectBody = z.infer<typeof createProjectBodySchema>;
export type CreateDirectoryBody = z.infer<typeof createDirectoryBodySchema>;
export type UpdatePublicStatusBody = z.infer<typeof updatePublicStatusBodySchema>;
export type RenameDirectoryBody = z.infer<typeof renameDirectoryBodySchema>;
export type ShareDirectoryBody = z.infer<typeof shareDirectoryBodySchema>;
export type UnshareDirectoryBody = z.infer<typeof unshareDirectoryBodySchema>;
export type UploadProjectBody = z.infer<typeof uploadProjectBodySchema>;
export type ProjectIdParam = z.infer<typeof projectIdParamSchema>;
export type DirectoryIdParam = z.infer<typeof directoryIdParamSchema>;
