// TODO make obsolete by Projectile enum

export enum ProjectileLevel {
    BULLET = 1,
    ROCKET,
    LASER,
    PLASMA,
    MINE,
}

export enum ProjectileType {
    BULLET = 'bullet',
    ROCKET = 'rocket',
    LASER = 'laser',
    PLASMA = 'plasma',
    MINE = 'mine',
}

// TODO make obsolete by ProjectileMaxAmount enum
export enum ProjectileMaxAmount {
    BULLET = 99,
    ROCKET = 10,
    LASER = 50,
    PLASMA = 30,
    MINE = 6,
}

// TODO make obsolete by ProjectileRefillAmount enum
export enum ProjectileRefillAmount {
    BULLET = 10,
    ROCKET = 3,
    LASER = 5,
    PLASMA = 4,
    MINE = 2,
}

export enum ProjectileSpeed {
    BULLET = 650,
    ROCKET = 100,
    LASER = 400,
    PLASMA = 300,
    MINE = 0,
}

export enum ProjectileFireRate {
    BULLET_FIRE_RATE = 400,
    ROCKET_FIRE_RATE = 1000,
    LASER_FIRE_RATE = 500,
    PLASMA_FIRE_RATE = 800,
    MINE_FIRE_RATE = 1500,
}

/**
 * Enum representing the primary composition or spectral type of an asteroid.
 * Useful for understanding material properties, brightness, and appearance.
 * @readonly
 * @enum {string}
 */
export enum AsteroidComposition {
    /** Dark, carbon-rich asteroids; most common (~75%) */
    C_TYPE = 'C-type (Carbonaceous)',

    /** Silicate or stony asteroids; brighter than C-types */
    S_TYPE = 'S-type (Silicaceous / Stony)',

    /** Metallic asteroids; primarily nickel and iron; often asteroid cores */
    M_TYPE = 'M-type (Metallic)',
}
