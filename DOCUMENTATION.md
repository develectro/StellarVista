# Stellar Vista — Physics & Mathematics Reference

> A detailed technical document explaining every equation used in the Stellar Vista star appearance simulator, how it was derived, and how it maps to code.

---

## Table of Contents

1. [Physical Constants](#1-physical-constants)
2. [Angular Diameter](#2-angular-diameter)
3. [Apparent Magnitude](#3-apparent-magnitude)
4. [Absolute Magnitude](#4-absolute-magnitude)
5. [Black-Body Color (Temperature → RGB)](#5-black-body-color-temperature--rgb)
6. [Rayleigh Sky Scattering Model](#6-rayleigh-sky-scattering-model)
7. [Habitable Zone Boundaries](#7-habitable-zone-boundaries)
8. [Surface Gravity](#8-surface-gravity)
9. [Visual Rendering Formulas](#9-visual-rendering-formulas)
10. [Star Database Sources](#10-star-database-sources)

---

## 1. Physical Constants

These are the foundational constants used throughout the physics engine. All values are from IAU 2015 nominal values.

| Constant | Symbol | Value | Unit |
|----------|--------|-------|------|
| Astronomical Unit | AU | 1.496 × 10⁸ | km |
| Solar Radius | R☉ | 6.957 × 10⁵ | km |
| Sun's Angular Diameter (from 1 AU) | θ☉ | 0.533 | degrees |
| Sun's Apparent Magnitude (from 1 AU) | m☉ | −26.74 | mag |
| Stefan–Boltzmann Constant | σ | 5.670374419 × 10⁻⁸ | W⋅m⁻²⋅K⁻⁴ |

**In code** (`physics.js`, lines 8–12):
```javascript
const AU_KM           = 1.496e8;
const SOLAR_RADIUS_KM = 6.957e5;
const SUN_ANGULAR_DEG = 0.533;
const SUN_APP_MAG     = -26.74;
const STEFAN_BOLTZMANN = 5.670374419e-8;
```

---

## 2. Angular Diameter

### The Question
> "How big would this star look in the sky if I stood on a planet at 1 AU from it?"

### The Formula

The angular diameter θ of a sphere of radius R viewed from distance d is:

```
θ = 2 × arctan(R / d)
```

Where:
- **R** = star radius in km = `R_solar × R☉_km`
- **d** = observer distance = 1 AU = 1.496 × 10⁸ km
- **θ** = result in radians, converted to degrees by multiplying by `180/π`

### Small-Angle Approximation

For stars much smaller than 1 AU (most main-sequence stars), this reduces to:

```
θ ≈ 2R / d    (radians)
```

However, for red supergiants like Betelgeuse (R = 887 R☉ = 6.17 × 10⁸ km ≈ 4.1 AU), the full `arctan` form is essential because the "small angle" approximation breaks down entirely — the star is physically larger than the viewing distance!

### Conversion to Arcminutes

```
θ_arcmin = θ_degrees × 60
```

The Sun from Earth subtends ~32 arcminutes (0.533°). For comparison, Betelgeuse at 1 AU would subtend ~152.7° — covering nearly the entire sky hemisphere.

### Implementation (`physics.js`, lines 18–28)

```javascript
function angularDiameter(radiusSolar) {
    const rKm = radiusSolar * SOLAR_RADIUS_KM;
    return 2 * Math.atan(rKm / AU_KM) * (180 / Math.PI);
}

function angularDiameterArcmin(radiusSolar) {
    return angularDiameter(radiusSolar) * 60;
}
```

### Worked Examples

| Star | Radius (R☉) | R (km) | θ (degrees) | θ (arcmin) |
|------|-------------|--------|------------|-----------|
| Sun | 1.0 | 6.957×10⁵ | 0.533° | 31.97′ |
| Sirius A | 1.711 | 1.190×10⁶ | 0.912° | 54.7′ |
| Proxima Centauri | 0.154 | 1.071×10⁵ | 0.082° | 4.9′ |
| Betelgeuse | 887 | 6.17×10⁸ | 152.7° | 9162′ |

---

## 3. Apparent Magnitude

### The Question
> "How bright would this star appear to my eyes from 1 AU?"

### The Formula

The magnitude scale is logarithmic. A difference of 5 magnitudes = factor of 100 in brightness. The apparent magnitude m of a star at 1 AU, relative to the Sun at 1 AU:

```
m = m☉ − 2.5 × log₁₀(L / L☉)
```

Where:
- **m☉** = −26.74 (Sun's apparent magnitude from 1 AU)
- **L** = star's luminosity in solar luminosities (L☉)
- The factor `(d☉/d)²` = 1 because both are measured at the same distance (1 AU)

### Derivation

Starting from the flux ratio:
```
m₁ − m₂ = −2.5 × log₁₀(F₁ / F₂)
```

Since flux F ∝ L/d² and d is the same (1 AU):
```
m_star − m☉ = −2.5 × log₁₀(L_star / L☉)
m_star = m☉ − 2.5 × log₁₀(L_star / L☉)
```

Since L☉ = 1 in solar units:
```
m_star = −26.74 − 2.5 × log₁₀(L)
```

### Implementation (`physics.js`, lines 35–37)

```javascript
function apparentMagnitude(luminositySolar) {
    return SUN_APP_MAG - 2.5 * Math.log10(luminositySolar);
}
```

### Worked Examples

| Star | Luminosity (L☉) | Apparent Mag at 1 AU | Interpretation |
|------|-----------------|---------------------|----------------|
| Sun | 1.0 | −26.74 | Baseline — our normal Sun |
| Sirius A | 25.4 | −30.25 | ~25× brighter than our Sun |
| Proxima Centauri | 0.0017 | −19.61 | ~1000× dimmer than our Sun, but still bright as a torch overhead |
| Rigel | 120,000 | −39.44 | Blindingly, destructively bright |
| Betelgeuse | 126,000 | −39.49 | Similar to Rigel in raw brightness |

### Important Notes

- **Negative magnitudes** = brighter. The full Moon is about −12.7 mag. Even Proxima Centauri at 1 AU (−19.61) would be far brighter than the full Moon.
- Very luminous stars (Rigel, Betelgeuse) at 1 AU would be genuinely dangerous — the radiation flux would vaporize any Earth-like planet.

---

## 4. Absolute Magnitude

### The Formula

Absolute magnitude M is defined as apparent magnitude at a standard distance of 10 parsecs:

```
M = m − 5 × log₁₀(d / 10)
```

Where:
- **m** = apparent magnitude (at 1 AU, from §3)
- **d** = distance in parsecs = 1 AU ÷ (3.086 × 10¹³ km/pc) ≈ 4.848 × 10⁻⁶ pc

### Implementation (`physics.js`, lines 44–48)

```javascript
function absoluteMagnitude(luminositySolar) {
    const m = apparentMagnitude(luminositySolar);
    const dParsec = AU_KM / 3.086e13;  // 1 AU in parsecs
    return m - 5 * Math.log10(dParsec / 10);
}
```

---

## 5. Black-Body Color (Temperature → RGB)

### The Question
> "What color is this star?"

### The Physics

Every star is (approximately) a **black-body radiator**. Its peak emission wavelength is given by **Wien's Displacement Law**:

```
λ_max = b / T
```

Where:
- **b** = 2.897 × 10⁶ nm⋅K (Wien's displacement constant)
- **T** = surface temperature in Kelvin

For the Sun (T = 5778 K): `λ_max ≈ 501 nm` (green-yellow light).

### The Algorithm: Tanner Helland Approximation

Converting a black-body spectrum to an sRGB color requires integrating the Planck function against the CIE color matching functions. This is computationally expensive. Instead, we use **Tanner Helland's empirical approximation** (2012), which provides excellent accuracy for the range 1000–40000 K using simple power-law and logarithmic fits.

The algorithm divides the temperature range at **T = 6600 K** (temp/100 = 66) and applies different formulas for each channel:

### Red Channel

```
if T/100 ≤ 66:
    R = 255
else:
    R = 329.698727446 × (T/100 − 60)^(−0.1332047592)
```

**Interpretation**: Below 6600 K, red is always saturated. Above 6600 K, red decreases as the star gets bluer.

### Green Channel

```
if T/100 ≤ 66:
    G = 99.4708025861 × ln(T/100) − 161.1195681661
else:
    G = 288.1221695283 × (T/100 − 60)^(−0.0755148492)
```

**Interpretation**: Green follows a logarithmic curve for cool stars and a power law for hot stars.

### Blue Channel

```
if T/100 ≥ 66:
    B = 255
else if T/100 ≤ 19:
    B = 0
else:
    B = 138.5177312231 × ln(T/100 − 10) − 305.0447927307
```

**Interpretation**: Above 6600 K, blue is saturated (the star appears blue-white). Below 1900 K, there's essentially no blue. In between, blue follows a logarithmic curve.

All values are clamped to [0, 255].

### Implementation (`physics.js`, lines 54–91)

```javascript
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

    return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
}
```

### Color Results

| Star | Temp (K) | R | G | B | Visual |
|------|----------|---|---|---|--------|
| Betelgeuse | 3,600 | 255 | 178 | 108 | 🟠 Orange-amber |
| Sun | 5,778 | 255 | 243 | 234 | 🟡 Warm white-yellow |
| Sirius A | 9,940 | 202 | 216 | 255 | 🔵 Cool white-blue |
| Naos | 42,400 | 155 | 176 | 255 | 🔵 Deep blue |

---

## 6. Rayleigh Sky Scattering Model

### The Question
> "What color would the sky be under this star?"

### The Physics

Earth's blue sky is caused by **Rayleigh scattering** — atmospheric gas molecules scatter short wavelengths (blue) much more than long wavelengths (red). The scattering intensity follows:

```
I ∝ 1/λ⁴
```

This means blue light (λ ≈ 450 nm) scatters ~5.5× more than red light (λ ≈ 700 nm).

The key insight for our simulation: **the color of the sky depends on the star's spectrum**, not just its brightness:

- **Hot blue stars** (O/B) → emit lots of blue/UV photons → intensely blue sky
- **Sun-like stars** (F/G) → balanced spectrum → classic blue sky
- **Cool red stars** (K/M) → emit mostly red/infrared → reddish/amber sky
- **Very dim stars** → too few photons scattered → dark sky regardless of color

### Our Model

We decompose sky color into two independent factors:

#### Factor 1: Brightness (from luminosity)

The sky brightness is determined by the total photon flux received. We use a logarithmic mapping because human perception of brightness is logarithmic:

```
raw = (log₁₀(L) + 3) / 6
brightness = clamp(raw, 0, 1)^0.7
```

- **L = 1** (Sun): `raw = (0+3)/6 = 0.5`, `brightness = 0.5^0.7 ≈ 0.616` → daylight
- **L = 0.0017** (Proxima): `raw = (−2.77+3)/6 = 0.038`, `brightness = 0.038^0.7 ≈ 0.082` → near darkness
- **L = 120000** (Rigel): `raw = (5.08+3)/6 = 1.0` → capped at maximum brightness

The exponent 0.7 is a **gamma correction** that boosts mid-range values, making the transition from dim to bright more visually pleasing.

#### Factor 2: Color (from temperature)

We define a **blue ratio** that goes from 0 (all red) to 1 (all blue):

```
blueRatio = min(1, T / 10000)
redRatio  = 1 − blueRatio
```

Then compose the zenith (straight-up) color:

```
zenith.R = (30 × blueRatio + 140 × redRatio) × brightness
zenith.G = (80 × blueRatio +  50 × redRatio) × brightness
zenith.B = (220 × blueRatio + 40 × redRatio) × brightness
```

**Interpretation of the coefficients:**
- For a fully blue sky (blueRatio = 1): RGB base = (30, 80, 220) → deep blue, like a clear Earth sky
- For a fully red sky (redRatio = 1): RGB base = (140, 50, 40) → deep amber/maroon, like an alien sunset
- Multiplied by brightness to fade to black for dim stars

#### Horizon vs. Zenith

The atmosphere is thicker at the horizon (longer optical path), causing more scattering and a lighter, whiter sky:

```
horizon.R = min(255, zenith.R × 1.8 + 40 × brightness)
horizon.G = min(255, zenith.G × 1.5 + 60 × brightness)
horizon.B = min(255, zenith.B × 1.2 + 30 × brightness)
```

The multipliers (1.8, 1.5, 1.2) are calibrated so that:
- Blue dominance is reduced at the horizon (lower relative multiply for B)
- Red is boosted at the horizon (higher multiply for R)
- An additive white component simulates the "whitening" effect of heavy scattering

### Implementation (`physics.js`, lines 100–143)

```javascript
function skyScattering(luminositySolar, temperatureK) {
    const flux = luminositySolar;
    let brightness;
    if (flux <= 0) {
        brightness = 0;
    } else {
        brightness = Math.min(1, Math.max(0, (Math.log10(flux) + 3) / 6));
        brightness = Math.pow(brightness, 0.7);
    }

    const blueRatio = Math.min(1, temperatureK / 10000);
    const redRatio  = 1 - blueRatio;

    const zenith = {
        r: Math.round((30 * blueRatio + 140 * redRatio) * brightness),
        g: Math.round((80 * blueRatio + 50 * redRatio) * brightness),
        b: Math.round((220 * blueRatio + 40 * redRatio) * brightness),
    };

    const horizon = {
        r: Math.round(Math.min(255, zenith.r * 1.8 + 40 * brightness)),
        g: Math.round(Math.min(255, zenith.g * 1.5 + 60 * brightness)),
        b: Math.round(Math.min(255, zenith.b * 1.2 + 30 * brightness)),
    };

    return { zenith, horizon, brightness };
}
```

### Sky Color Results

| Star | Temp | Luminosity | Brightness | Zenith Color | Sky Appearance |
|------|------|-----------|-----------|-------------|----------------|
| Sun | 5778 K | 1 L☉ | 0.62 | (26, 54, 140) | Classic blue |
| Rigel | 12100 K | 120000 L☉ | 1.0 | (30, 80, 220) | Intense deep blue |
| Proxima Centauri | 3042 K | 0.0017 L☉ | 0.08 | (8, 3.4, 2.7) | Near black |
| Betelgeuse | 3600 K | 126000 L☉ | 1.0 | (100, 36, 28) | Deep amber/red |

---

## 7. Habitable Zone Boundaries

### The Question
> "Could liquid water exist on a planet at 1 AU from this star?"

### The Formula

The habitable zone is the range of distances where liquid water could exist on a planet's surface. Using the **Kopparapu et al. (2013)** simplified model:

```
Inner edge = 0.95 × √(L/L☉)    AU    (runaway greenhouse limit)
Outer edge = 1.37 × √(L/L☉)    AU    (maximum greenhouse limit)
```

The planet is habitable if 1 AU falls within [inner, outer].

### Derivation

The equilibrium temperature of a planet scales as:

```
T_eq ∝ (L/d²)^(1/4)
```

For constant T_eq (matching Earth's), solving for d:

```
d ∝ √L
```

The coefficients 0.95 and 1.37 come from detailed climate models accounting for greenhouse effects, cloud feedback, and atmospheric absorption.

### Implementation (`physics.js`, lines 150–164)

```javascript
function habitableZone(luminositySolar) {
    const sqrtL = Math.sqrt(luminositySolar);
    return {
        inner: 0.95 * sqrtL,
        outer: 1.37 * sqrtL,
    };
}

function isInHabitableZone(luminositySolar) {
    const hz = habitableZone(luminositySolar);
    return 1.0 >= hz.inner && 1.0 <= hz.outer;
}
```

### Results

| Star | L (L☉) | HZ Inner (AU) | HZ Outer (AU) | 1 AU in HZ? |
|------|--------|---------------|---------------|-------------|
| Sun | 1.0 | 0.95 | 1.37 | ✓ Yes |
| Sirius A | 25.4 | 4.79 | 6.91 | ✗ Too close (scorched) |
| Proxima Centauri | 0.0017 | 0.039 | 0.056 | ✗ Too far (frozen) |
| Alpha Centauri A | 1.519 | 1.17 | 1.69 | ✓ Yes |

---

## 8. Surface Gravity

### The Formula

Surface gravity g relative to the Sun:

```
g/g☉ = (M/M☉) / (R/R☉)²
```

This comes from Newton's law of gravitation:

```
g = GM/R²
```

Since we normalize by the Sun:

```
g_relative = M_solar / R_solar²
```

### Implementation (`physics.js`, lines 169–171)

```javascript
function surfaceGravity(massSolar, radiusSolar) {
    return massSolar / (radiusSolar * radiusSolar);
}
```

### Results

| Star | Mass (M☉) | Radius (R☉) | g/g☉ | Interpretation |
|------|----------|-----------|------|---------------|
| Sun | 1.0 | 1.0 | 1.0 | Baseline |
| Sirius A | 2.063 | 1.711 | 0.70 | Lower surface gravity |
| Betelgeuse | 16.5 | 887 | 0.00002 | Nearly zero — very tenuous surface |
| Proxima Centauri | 0.122 | 0.154 | 5.15 | Very high surface gravity |

---

## 9. Visual Rendering Formulas

### Star Visual Radius on Screen

The star's pixel radius on the canvas is determined by its angular size relative to the Sun, with **power-law scaling** to keep extreme values displayable:

```
ratio = θ_star / θ_sun
px = 40 × ratio^0.55
clamped to [2, 0.45 × viewport_min]
```

The exponent **0.55** (close to √) compresses the enormous dynamic range:
- Sun (ratio = 1) → 40 px
- Betelgeuse (ratio = 286) → ~320 px (fills screen)
- Proxima Centauri (ratio = 0.15) → ~13 px (small but visible)

Without compression, Betelgeuse would need 11,440 px — far larger than any display.

### Glow and Corona Radii

```
glow   = starRadius × (2.5 + √brightness × 3)
corona = glow × 1.8
```

Brighter stars get proportionally larger glow halos.

### Limb Darkening

The star disc is rendered with a **radial gradient** simulating limb darkening — the well-known phenomenon where a star's edge appears darker than its center:

```
Center:  white (bright hot core)
30%:     star color + 30 brightness boost
80%:     true star color
Edge:    star color − 40 darkening
```

This is a simplified version of the physical limb darkening law:

```
I(θ) / I(0) = 1 − u × (1 − cos θ)
```

Where u ≈ 0.6 for Sun-like stars.

---

## 10. Star Database Sources

All stellar properties were sourced from peer-reviewed catalogs:

- **Luminosity, Temperature, Radius**: SIMBAD Astronomical Database (CDS Strasbourg)
- **Spectral Classifications**: Morgan–Keenan (MK) system via SIMBAD
- **Habitable Zone Model**: Kopparapu et al. (2013), "Habitable Zones Around Main-Sequence Stars"
- **Color Algorithm**: Tanner Helland (2012), "How to Convert Temperature to RGB"
- **Physical Constants**: IAU 2015 Resolution B3 nominal solar and astronomical constants

---

## Summary of Equations

| # | Equation | Purpose | File:Line |
|---|----------|---------|-----------|
| 1 | `θ = 2 × arctan(R/AU)` | Angular diameter | physics.js:18 |
| 2 | `m = −26.74 − 2.5 × log₁₀(L)` | Apparent magnitude | physics.js:35 |
| 3 | `M = m − 5 × log₁₀(d/10)` | Absolute magnitude | physics.js:44 |
| 4 | Helland piecewise RGB model | Star color from temperature | physics.js:54 |
| 5 | `brightness = ((log₁₀L+3)/6)^0.7` | Sky brightness | physics.js:100 |
| 6 | `blueRatio = min(1, T/10000)` | Sky color hue | physics.js:125 |
| 7 | `HZ = [0.95√L, 1.37√L]` | Habitable zone | physics.js:150 |
| 8 | `g = M/R²` | Surface gravity | physics.js:169 |
| 9 | `px = 40 × ratio^0.55` | Visual star size | renderer.js |
| 10 | Radial gradient (4-stop) | Limb darkening | renderer.js |
