<p align="center">
  <strong style="font-size: 32px;">✦ Stellar Vista ✦</strong>
</p>

<p align="center">
  <em>A physics-based star appearance simulator</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Stars-22-1a1a2e?style=flat-square&labelColor=0d1117" alt="Stars">
  <img src="https://img.shields.io/badge/Spectral%20Classes-O%20B%20A%20F%20G%20K%20M-1a1a2e?style=flat-square&labelColor=0d1117" alt="Classes">
  <img src="https://img.shields.io/badge/Physics-Real-1a1a2e?style=flat-square&labelColor=0d1117" alt="Physics">
  <img src="https://img.shields.io/badge/License-MIT-1a1a2e?style=flat-square&labelColor=0d1117" alt="License">
</p>

---

## What is Stellar Vista?

Stellar Vista answers a simple yet fascinating question:

> **"If you stood on a planet at 1 AU from a different star, what would the sky look like?"**

It replaces our Sun with any of 22 real stars — from the ultra-cool red dwarf **Proxima Centauri** to the monstrous supergiant **Betelgeuse** — and renders the sky, star disc, atmospheric color, and landscape in real-time using actual physics.

---

## ✦ Features

**Simulation Engine**
- Angular diameter, apparent magnitude, and star color from real astronomical data
- Rayleigh scattering sky model — blue sky under the Sun, amber under Betelgeuse, near-black under Proxima
- Canvas rendering with limb darkening, corona glow, star rays, and twinkling background star field
- Procedural mountain landscape with atmospheric haze

**Interactive Controls**
- 22-star catalog organized by spectral class (O through M)
- Time-of-day slider with sunrise, noon, and sunset positioning
- Split-screen comparison mode to view two stars side by side
- Keyboard navigation (arrow keys to cycle, `S` for settings, `Esc` for panel toggle)

**Settings Panel**
- Glassmorphism left-side panel with time, language, comparison, and sound controls
- Ambient sound engine (wind noise + stellar drone via Web Audio API)
- Bilingual interface — English and Arabic with full RTL layout support

**Data Dashboard**
- Live readout: temperature, luminosity, radius, mass, surface gravity
- Appearance data: angular diameter, apparent magnitude, star color swatch
- Habitable zone check — is 1 AU within the star's habitable zone?
- Educational description for every star

---

## ✦ Star Database

| Class | Stars | Temperature Range |
|-------|-------|-------------------|
| O — Blue Supergiant | Naos, Mintaka | > 30,000 K |
| B — Blue-White | Rigel, Spica, Achernar | 10,000 – 30,000 K |
| A — White | Sirius A, Vega, Deneb | 7,500 – 10,000 K |
| F — Yellow-White | Canopus, Procyon A, Polaris A | 6,000 – 7,500 K |
| G — Yellow (Sun-like) | Sun, Alpha Centauri A, Tau Ceti | 5,200 – 6,000 K |
| K — Orange | Arcturus, Epsilon Eridani, Aldebaran | 3,700 – 5,200 K |
| M — Red Dwarf / Giant | Proxima Centauri, Betelgeuse, Barnard's Star, TRAPPIST-1, Wolf 359 | 2,400 – 3,700 K |

---

## ✦ Project Structure

```
stellar-vista/
├── index.html           App shell
├── css/
│   └── style.css        Design system (glassmorphism, RTL)
├── js/
│   ├── stars.js         Star database (22 stars)
│   ├── physics.js       Astronomical calculations
│   ├── renderer.js      Canvas rendering engine
│   └── app.js           UI controller, i18n, settings
├── DOCUMENTATION.md     Physics & mathematics reference
└── README.md            This file
```

---

## ✦ Quick Start

No build tools, no dependencies. Just open:

```
index.html
```

Or serve locally:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

---

## ✦ Physics

The simulation computes everything from first principles. Full derivations and implementation details are in [`DOCUMENTATION.md`](DOCUMENTATION.md).

| Equation | Purpose |
|----------|---------|
| `θ = 2 × arctan(R/AU)` | Angular diameter at 1 AU |
| `m = −26.74 − 2.5 × log₁₀(L)` | Apparent magnitude |
| Tanner Helland algorithm | Black-body temperature → sRGB color |
| Modified Rayleigh model | Sky color from stellar spectrum |
| `HZ = [0.95√L, 1.37√L]` | Habitable zone boundaries |
| `g = M/R²` | Surface gravity |

---

## ✦ Credits

- Stellar data sourced from the **SIMBAD Astronomical Database** (CDS Strasbourg)
- Habitable zone model from **Kopparapu et al. (2013)**
- Color algorithm by **Tanner Helland (2012)**
- Physical constants from **IAU 2015 Resolution B3**

---

<p align="center">
  <sub>Built with curiosity about the cosmos ✦</sub>
</p>
