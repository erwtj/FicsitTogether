// We put it here so we can use the same constraints in both the API and frontend
// Fuck SOLID, fuck any good project structure I'm putting it here because it's easy. SUE ME!

// Text limits
export const MAX_NAME_LENGTH = 35;
export const MAX_DESCRIPTION_LENGTH = 255;

// Directory structure limits
export const MAX_DIRECTORY_DEPTH = 8; // How many levels deep a directory can be nested
export const MAX_DIRECTORIES_PER_DIRECTORY = 10; // Max subdirectories inside a single directory
export const MAX_PROJECTS_PER_DIRECTORY = 20; // Max projects inside a single directory
export const MAX_DIRECTORIES_PER_USER = 50; // Total directories a user can own across all levels
export const MAX_PROJECTS_PER_USER = 200; // Total projects a user can own across all directories

// Storage limits
// MAX_PROJECT_SIZE_BYTES is already enforced on update in chartValidator by virtue of max node and edge count
export const MAX_PROJECT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB per project
// No need for max global storage due to MAX_PROJECTS_PER_USER and MAX_PROJECT_SIZE_BYTES

// Chart limits
export const MAX_CHART_NODES = 2000;
export const MAX_CHART_EDGES = 5000;
export const MAX_MOVABLE_POINTS = 20; // Max movable (waypoint) points per edge
