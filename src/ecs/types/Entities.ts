/**
 * Enum representing the primary composition or spectral type of an asteroid.
 * Useful for understanding material properties, brightness, and appearance.
 * @readonly
 * @enum {string}
 */
export enum AsteroidComposition {
    /** Dark, carbon-rich asteroids; most common (~75%) */
    C_TYPE = "C-type (Carbonaceous)",

    /** Silicate or stony asteroids; brighter than C-types */
    S_TYPE = "S-type (Silicaceous / Stony)",

    /** Metallic asteroids; primarily nickel and iron; often asteroid cores */
    M_TYPE = "M-type (Metallic)",
}

/**
 * Enum representing the typical orbital location of an asteroid in the solar system.
 * Helps categorize asteroids based on orbital behavior and proximity to planets.
 * @readonly
 * @enum {string}
 */
export enum AsteroidOrbit {
    /** Located mainly between Mars and Jupiter */
    MAIN_BELT = "Main-belt",

    /** Orbits bring them close to Earth; potentially hazardous */
    NEAR_EARTH = "Near-Earth",

    /** Share orbits with Jupiter (or other planets) at Lagrange points */
    TROJAN = "Trojan",

    /** Between Jupiter and Neptune; often icy-rocky hybrids */
    CENTAUR = "Centaur",

    /** Other orbital locations not classified above */
    OTHER = "Other",
}