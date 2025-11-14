export interface EntityDTO {
    id: string;
    x: number;
    y: number;
}

export interface EntityWithHealthDTO extends EntityDTO {
    health: number;
    maxHealth?: number;
}
