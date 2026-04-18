/**
 * Stellar Vista — Star Database
 * Real astronomical data for 22 stars across all spectral classes (O, B, A, F, G, K, M).
 *
 * Properties:
 *   name         — Common name
 *   spectral     — Spectral classification
 *   luminosity   — Solar luminosities (L☉)
 *   temperature  — Effective surface temperature (K)
 *   radius       — Solar radii (R☉)
 *   mass         — Solar masses (M☉)
 *   description  — Short educational blurb
 */

const SPECTRAL_CLASSES = {
    O: { label: 'O — Blue Supergiant',   color: '#92b5ff', range: '> 30,000 K' },
    B: { label: 'B — Blue-White',         color: '#a2c0ff', range: '10,000–30,000 K' },
    A: { label: 'A — White',              color: '#d5e0ff', range: '7,500–10,000 K' },
    F: { label: 'F — Yellow-White',       color: '#f8f7ff', range: '6,000–7,500 K' },
    G: { label: 'G — Yellow (Sun-like)',   color: '#fff4ea', range: '5,200–6,000 K' },
    K: { label: 'K — Orange',             color: '#ffd2a1', range: '3,700–5,200 K' },
    M: { label: 'M — Red Dwarf / Giant',  color: '#ffb56c', range: '2,400–3,700 K' },
};

const STAR_DATABASE = [
    // ─── O-class ───────────────────────────────
    {
        name: 'Naos (ζ Puppis)',
        spectral: 'O5Iaf',
        luminosity: 813000,
        temperature: 42400,
        radius: 20,
        mass: 56,
        class: 'O',
        description: 'One of the hottest and most luminous stars visible to the naked eye. Its fierce UV radiation ionizes the surrounding interstellar medium.',
    },
    {
        name: 'Mintaka (δ Orionis)',
        spectral: 'O9.5II',
        luminosity: 190000,
        temperature: 29500,
        radius: 16.5,
        mass: 24,
        class: 'O',
        description: 'The westernmost star of Orion\'s Belt. A massive multiple star system over 900 light-years away.',
    },

    // ─── B-class ───────────────────────────────
    {
        name: 'Rigel',
        spectral: 'B8Ia',
        luminosity: 120000,
        temperature: 12100,
        radius: 78.9,
        mass: 21,
        class: 'B',
        description: 'The brightest star in Orion and a blue supergiant. If placed at 1 AU, its disc would span over 36° of sky.',
    },
    {
        name: 'Spica',
        spectral: 'B1III-IV',
        luminosity: 12100,
        temperature: 22400,
        radius: 7.47,
        mass: 11.4,
        class: 'B',
        description: 'The brightest star in Virgo and a spectroscopic binary. Its intense radiation makes it a beacon of the spring sky.',
    },
    {
        name: 'Achernar',
        spectral: 'B6Vep',
        luminosity: 3150,
        temperature: 15000,
        radius: 6.7,
        mass: 6.7,
        class: 'B',
        description: 'The flattest star known — it spins so fast it bulges 56% wider at its equator than at its poles.',
    },

    // ─── A-class ───────────────────────────────
    {
        name: 'Sirius A',
        spectral: 'A1V',
        luminosity: 25.4,
        temperature: 9940,
        radius: 1.711,
        mass: 2.063,
        class: 'A',
        description: 'The brightest star in Earth\'s night sky. A main-sequence star only 8.6 light-years away with a white dwarf companion.',
    },
    {
        name: 'Vega',
        spectral: 'A0V',
        luminosity: 40.12,
        temperature: 9602,
        radius: 2.362,
        mass: 2.135,
        class: 'A',
        description: 'Once the North Star and the standard for stellar magnitude. It was the first star (other than the Sun) to be photographed.',
    },
    {
        name: 'Deneb',
        spectral: 'A2Ia',
        luminosity: 196000,
        temperature: 8525,
        radius: 203,
        mass: 19,
        class: 'A',
        description: 'A white supergiant and one of the most luminous stars known. Its absolute brightness dwarfs even Rigel.',
    },

    // ─── F-class ───────────────────────────────
    {
        name: 'Canopus',
        spectral: 'F0II',
        luminosity: 10700,
        temperature: 7400,
        radius: 71,
        mass: 8.0,
        class: 'F',
        description: 'The second-brightest star in the sky. Used extensively for spacecraft navigation due to its brightness and position.',
    },
    {
        name: 'Procyon A',
        spectral: 'F5IV-V',
        luminosity: 6.93,
        temperature: 6530,
        radius: 2.048,
        mass: 1.499,
        class: 'F',
        description: 'Part of the Winter Triangle. A subgiant star nearing the end of its hydrogen-burning life, only 11.46 light-years away.',
    },
    {
        name: 'Polaris A',
        spectral: 'F7Ib',
        luminosity: 1260,
        temperature: 6015,
        radius: 37.5,
        mass: 5.4,
        class: 'F',
        description: 'The current North Star. A Cepheid variable that pulsates in brightness with a period of about 4 days.',
    },

    // ─── G-class (Sun-like) ────────────────────
    {
        name: 'Sun',
        spectral: 'G2V',
        luminosity: 1.0,
        temperature: 5778,
        radius: 1.0,
        mass: 1.0,
        class: 'G',
        description: 'Our home star — a middle-aged main-sequence star. The baseline reference for all stellar measurements.',
    },
    {
        name: 'Alpha Centauri A',
        spectral: 'G2V',
        luminosity: 1.519,
        temperature: 5790,
        radius: 1.2175,
        mass: 1.1,
        class: 'G',
        description: 'The closest Sun-like star at 4.37 light-years. Part of a triple system that includes Proxima Centauri.',
    },
    {
        name: 'Tau Ceti',
        spectral: 'G8.5V',
        luminosity: 0.488,
        temperature: 5344,
        radius: 0.793,
        mass: 0.783,
        class: 'G',
        description: 'A nearby Sun-like star with a suspected planetary system. A prime target in the search for habitable worlds.',
    },

    // ─── K-class ───────────────────────────────
    {
        name: 'Arcturus',
        spectral: 'K0III',
        luminosity: 170,
        temperature: 4286,
        radius: 25.4,
        mass: 1.08,
        class: 'K',
        description: 'The brightest star in the northern hemisphere. An evolved red giant that has exhausted its hydrogen core.',
    },
    {
        name: 'Epsilon Eridani',
        spectral: 'K2V',
        luminosity: 0.34,
        temperature: 5084,
        radius: 0.735,
        mass: 0.82,
        class: 'K',
        description: 'A young star only 10.5 light-years away with a confirmed exoplanet. Featured in many science fiction settings.',
    },
    {
        name: 'Aldebaran',
        spectral: 'K5III',
        luminosity: 518,
        temperature: 3910,
        radius: 45.1,
        mass: 1.16,
        class: 'K',
        description: 'The fiery eye of Taurus. An orange giant star 65 light-years away that has swelled to 45 times the Sun\'s radius.',
    },

    // ─── M-class ───────────────────────────────
    {
        name: 'Proxima Centauri',
        spectral: 'M5.5Ve',
        luminosity: 0.0017,
        temperature: 3042,
        radius: 0.1542,
        mass: 0.1221,
        class: 'M',
        description: 'The closest star to the Sun at 4.24 light-years. A red dwarf so dim it is invisible to the naked eye, yet it hosts an Earth-mass planet in its habitable zone.',
    },
    {
        name: 'Betelgeuse',
        spectral: 'M1-2Ia-Iab',
        luminosity: 126000,
        temperature: 3600,
        radius: 887,
        mass: 16.5,
        class: 'M',
        description: 'A red supergiant in Orion nearing the end of its life. At 1 AU, its surface would extend past Jupiter\'s orbit.',
    },
    {
        name: 'Barnard\'s Star',
        spectral: 'M4Ve',
        luminosity: 0.0035,
        temperature: 3134,
        radius: 0.196,
        mass: 0.144,
        class: 'M',
        description: 'The fastest-moving star across our sky (proper motion). A very old red dwarf approximately 6 light-years away.',
    },
    {
        name: 'TRAPPIST-1',
        spectral: 'M8V',
        luminosity: 0.000553,
        temperature: 2566,
        radius: 0.1192,
        mass: 0.0898,
        class: 'M',
        description: 'An ultra-cool dwarf star hosting 7 Earth-sized planets, 3 in the habitable zone. A prime target for atmospheric characterization.',
    },
    {
        name: 'Wolf 359',
        spectral: 'M6.5Ve',
        luminosity: 0.0014,
        temperature: 2800,
        radius: 0.16,
        mass: 0.09,
        class: 'M',
        description: 'One of the faintest and nearest stars to the Sun. Famous in science fiction as the site of a legendary space battle.',
    },
];
