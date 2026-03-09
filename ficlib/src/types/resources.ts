import rawResources from "./resources.json" with { type: "json" };

export type Resource = {
    className: string;
    displayName: string;
    harvestableAmount: number;
};

const resources = rawResources as readonly Resource[];

// Module-level singleton
const resourcesByClassName: ReadonlyMap<string, Resource> = new Map(
    resources.map(resource => [resource.className, resource])
);

// Make map immutable
for (const resource of resourcesByClassName.values()) {
    Object.freeze(resource);
}
Object.freeze(resources);

export function getResource(className: string): Resource | undefined {
    return resourcesByClassName.get(className);
}

export function hasResource(className: string): boolean {
    return resourcesByClassName.has(className);
}

export function getAllResources(): readonly Resource[] {
    return resources;
}