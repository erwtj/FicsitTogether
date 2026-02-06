import rawBuildings from "./buildings.json" with { type: "json" };

export type Building = {
    className: string;
    displayName: string;
    icon: string;
    powerConsumption: number;
    powerProduction: number;
    fuel: {
        mFuelClass: string;
        mSupplementalResourceClass: string;
        mByproduct: string;
        mByproductAmount: string;
    }[];
    area: number
    somersloopsNeeded: number
}

const buildings = rawBuildings as readonly Building[];

// Module-level singleton
const buildingsByClassName: ReadonlyMap<string, Building> = new Map(
    buildings.map(building => [building.className, building])
);

// Make map immutable
for (const building of buildingsByClassName.values()) {
    Object.freeze(building);
}
Object.freeze(buildings);

export function getBuilding(className: string): Building | undefined {
    return buildingsByClassName.get(className);
}

export function hasBuilding(className: string): boolean {
    return buildingsByClassName.has(className);
}

export function getAllBuildings(): readonly Building[] {
    return buildings;
}