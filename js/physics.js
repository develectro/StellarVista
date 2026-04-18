/**
 * Stellar Vista — Physics Engine
 * Real astronomical calculations for star appearance simulation.
 */

const StellarPhysics = (() => {
    // ── Constants ──────────────────────────────────
    const AU_KM = 1.496e8;          // 1 AU in km
    const SOLAR_RADIUS_KM = 6.957e5;          // R☉ in km
    const SUN_ANGULAR_DEG = 0.533;            // Sun's angular diameter from 1 AU in degrees
    const SUN_APP_MAG = -26.74;           // Sun's apparent magnitude from 1 AU
    const STEFAN_BOLTZMANN = 5.670374419e-8;  // W⋅m⁻²⋅K⁻⁴

    /**
     * Angular diameter of a star at 1 AU (degrees).
     * θ = 2 × arctan(R / AU)  ≈ 2R/AU for small angles
     */
    function angularDiameter(radiusSolar) {
        const rKm = radiusSolar * SOLAR_RADIUS_KM;
        return 2 * Math.atan(rKm / AU_KM) * (180 / Math.PI);
    }

    /**
     * Angular diameter in arcminutes.
     */
    function angularDiameterArcmin(radiusSolar) {
        return angularDiameter(radiusSolar) * 60;
    }

    /**
     * Apparent magnitude at 1 AU given luminosity in L☉.
     * m = m_sun - 2.5 × log10(L / L_sun × (d_sun / d)²)
     * Since both are at 1 AU: m = -26.74 - 2.5 × log10(L)
     */
    function apparentMagnitude(luminositySolar) {
        return SUN_APP_MAG - 2.5 * Math.log10(luminositySolar);
    }

    /**
     * Absolute magnitude (at 10 pc).
     * M = m - 5 × log10(d/10pc)
     * where d = 1 AU = 4.848e-6 pc
     */
    function absoluteMagnitude(luminositySolar) {
        const m = apparentMagnitude(luminositySolar);
        const dParsec = AU_KM / 3.086e13; // 1 AU in parsecs
        return m - 5 * Math.log10(dParsec / 10);
    }

    /**
     * Convert black-body temperature to sRGB color.
     * Uses Tanner Helland's algorithm (fast approximation).
     */
    function temperatureToRGB(kelvin) {
        const temp = kelvin / 100;
        let r, g, b;

        // Red
        if (temp <= 66) {
            r = 255;
        } else {
            r = 329.698727446 * Math.pow(temp - 60, -0.1332047592);
            r = Math.max(0, Math.min(255, r));
        }

        // Green
        if (temp <= 66) {
            g = 99.4708025861 * Math.log(temp) - 161.1195681661;
        } else {
            g = 288.1221695283 * Math.pow(temp - 60, -0.0755148492);
        }
        g = Math.max(0, Math.min(255, g));

        // Blue
        if (temp >= 66) {
            b = 255;
        } else if (temp <= 19) {
            b = 0;
        } else {
            b = 138.5177312231 * Math.log(temp - 10) - 305.0447927307;
            b = Math.max(0, Math.min(255, b));
        }

        return {
            r: Math.round(r),
            g: Math.round(g),
            b: Math.round(b),
            css: `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`,
            hex: `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`,
        };
    }

    /**
     * Compute sky color based on stellar properties.
     * Models Rayleigh scattering: blue light scattered more for hot (blue) stars,
     * reddish atmosphere for cool stars, darkness for dim stars.
     *
     * Returns { zenith: {r,g,b}, horizon: {r,g,b}, brightness: 0–1 }
     */
    function skyScattering(luminositySolar, temperatureK) {
        // Overall brightness scales with apparent intensity (flux at 1 AU)
        // Flux ∝ L, but perceived sky brightness has a logarithmic response
        const flux = luminositySolar;
        // Brightness factor: 0 = pitch black, 1 = full daylight
        let brightness;
        if (flux <= 0) {
            brightness = 0;
        } else {
            // Use a logarithmic mapping with soft clamp
            brightness = Math.min(1, Math.max(0, (Math.log10(flux) + 3) / 6));
            // Boost mid-range for visual appeal
            brightness = Math.pow(brightness, 0.7);
        }

        // Color temperature → dominant scattered color
        // Rayleigh scattering preferentially scatters short wavelengths (λ⁻⁴).
        // Hot stars emit more blue → bluer sky; cool stars emit more red → amber sky.
        //
        // Threshold at 7000 K so that the Sun (5778 K) gets blueRatio ≈ 0.83,
        // producing a clearly blue sky. Stars below ~3500 K produce red/amber skies.
        const blueRatio = Math.min(1, temperatureK / 7000);
        const redRatio = 1 - blueRatio;

        // Zenith color (looking straight up — maximal scattering path)
        //   Blue sky base:  (20, 100, 230) — deep blue
        //   Red sky base:   (130, 35, 15)  — deep amber / maroon
        const zenith = {
            r: Math.round((20 * blueRatio + 130 * redRatio) * brightness),
            g: Math.round((100 * blueRatio + 35 * redRatio) * brightness),
            b: Math.round((230 * blueRatio + 15 * redRatio) * brightness),
        };

        // Horizon color (thicker atmosphere — more scattering, lighter/whiter)
        const horizon = {
            r: Math.round(Math.min(255, zenith.r * 1.6 + 50 * brightness)),
            g: Math.round(Math.min(255, zenith.g * 1.4 + 70 * brightness)),
            b: Math.round(Math.min(255, zenith.b * 1.1 + 40 * brightness)),
        };

        return { zenith, horizon, brightness };
    }

    /**
     * Habitable zone boundaries (AU) for a star given its luminosity in L☉.
     * Inner edge ≈ 0.95 × √L  (runaway greenhouse)
     * Outer edge ≈ 1.37 × √L  (maximum greenhouse)
     */
    function habitableZone(luminositySolar) {
        const sqrtL = Math.sqrt(luminositySolar);
        return {
            inner: 0.95 * sqrtL,
            outer: 1.37 * sqrtL,
        };
    }

    /**
     * Check if 1 AU falls within the habitable zone.
     */
    function isInHabitableZone(luminositySolar) {
        const hz = habitableZone(luminositySolar);
        return 1.0 >= hz.inner && 1.0 <= hz.outer;
    }

    /**
     * Stellar surface gravity relative to Sun.
     */
    function surfaceGravity(massSolar, radiusSolar) {
        return massSolar / (radiusSolar * radiusSolar);
    }

    /**
     * Compute all derived properties for a star.
     */
    function computeAll(star) {
        const angDiam = angularDiameter(star.radius);
        const angDiamArcmin = angularDiameterArcmin(star.radius);
        const appMag = apparentMagnitude(star.luminosity);
        const starColorRGB = temperatureToRGB(star.temperature);
        const sky = skyScattering(star.luminosity, star.temperature);
        const hz = habitableZone(star.luminosity);
        const inHZ = isInHabitableZone(star.luminosity);
        const surfGrav = surfaceGravity(star.mass, star.radius);

        return {
            angularDiameterDeg: angDiam,
            angularDiameterArcmin: angDiamArcmin,
            apparentMagnitude: appMag,
            starColor: starColorRGB,
            sky,
            habitableZone: hz,
            isHabitable: inHZ,
            surfaceGravity: surfGrav,
            // Visual rendering helpers
            sunAngularRatio: angDiam / SUN_ANGULAR_DEG, // size relative to our Sun
        };
    }

    return {
        angularDiameter,
        angularDiameterArcmin,
        apparentMagnitude,
        absoluteMagnitude,
        temperatureToRGB,
        skyScattering,
        habitableZone,
        isInHabitableZone,
        surfaceGravity,
        computeAll,
        SUN_ANGULAR_DEG,
    };
})();
