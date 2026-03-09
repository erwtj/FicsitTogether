// We put it here so we can use the same constraints in both the API and frontend
// Fuck SOLID, fuck any good project structure I'm putting it here because it's easy. SUE ME!

// Text limits
export const MAX_NAME_LENGTH = 35;
export const MAX_DESCRIPTION_LENGTH = 255;

// Directory structure limits
export const MAX_DIRECTORY_DEPTH = 8;           // How many levels deep a directory can be nested
export const MAX_DIRECTORIES_PER_DIRECTORY = 10; // Max subdirectories inside a single directory
export const MAX_PROJECTS_PER_DIRECTORY = 20;   // Max projects inside a single directory

// Storage limits
// TODO: Fix that storage limits are also enforced upon document update, else you can create hundreds of empty projects and fill them up later
// TODO: Probably want to add somewhere a progress bar to show how much storage a user has left
export const MAX_PROJECT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB per project
export const MAX_STORAGE_PER_USER_BYTES = 500 * 1024 * 1024; // 500 MB per user

// Chart limits
export const MAX_CHART_NODES = 2000;
export const MAX_CHART_EDGES = 5000;
export const MAX_MOVABLE_POINTS = 20; // Max movable (waypoint) points per edge
