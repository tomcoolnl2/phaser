import { CoordinatesDTO } from './Coordinates.dto';

export interface EntityDTO extends CoordinatesDTO {
    id: string;
}

export interface EntityWithHealthDTO extends EntityDTO {
    health: number;
    maxHealth?: number;
}
