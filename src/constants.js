/**
 * MBI vNext - Constants
 */

// === BALLAST ===
export const HALF_PLOT = 85;
export const FULL_PLOT = 170;
export const QUARTER_PLOT = 42;
export const CAPACITY_PER_SIDE = 6;
export const MAX_BALLAST_HALF = CAPACITY_PER_SIDE * 2 * 2;
export const OFFSET_STEPS = [-170, -85, -42, 0, 42, 85, 170];

// === MASSES ===
export const MASSE_MAX = 4.200;
export const DELTA_MASSE = 0.170;

// === MÉTÉO ===
export const RHO_REF = 1.225;
export const Rd = 287.05;
export const Rv = 461.495;

// === POLY4 - Points de référence ===
export const POLY4_REFERENCE_POINTS = [
  { vent: 4.05, masse: 2.300 }, { vent: 4.23, masse: 2.385 },
  { vent: 4.41, masse: 2.470 }, { vent: 4.61, masse: 2.555 },
  { vent: 4.82, masse: 2.640 }, { vent: 5.04, masse: 2.725 },
  { vent: 5.28, masse: 2.810 }, { vent: 5.53, masse: 2.895 },
  { vent: 5.80, masse: 2.980 }, { vent: 6.10, masse: 3.065 },
  { vent: 6.42, masse: 3.150 }, { vent: 6.78, masse: 3.235 },
  { vent: 7.17, masse: 3.320 }, { vent: 7.61, masse: 3.405 },
  { vent: 8.10, masse: 3.490 }, { vent: 8.65, masse: 3.575 },
  { vent: 9.28, masse: 3.660 }, { vent: 9.99, masse: 3.745 },
  { vent: 10.78, masse: 3.830 }, { vent: 11.65, masse: 3.915 },
  { vent: 12.60, masse: 4.000 }, { vent: 13.70, masse: 4.085 },
  { vent: 15.30, masse: 4.170 }
];

// === IQA ===
export const IQA_CONFIG = {
  PITOT_WIN_S: 3, VENT_WIN_S: 5, TEMP_WIN_S: 60,
  PITOT_CV_GOOD: 0.02, PITOT_CV_BAD: 0.06,
  VENT_CV_GOOD: 0.05, VENT_CV_BAD: 0.12,
  TEMP_GRAD_GOOD: +0.10, TEMP_GRAD_BAD: -0.05,
  W_PITOT: 0.35, W_VENT: 0.30, W_TEMP: 0.20, W_COHERENCE: 0.15
};

// === ESP32 ===
export const ESP32_CONFIG = {
  DEFAULT_URL: 'http://192.168.4.1',
  HTTP_POLL_MS: 2000,
  WS_URL: 'ws://192.168.4.1/ws',
  RECONNECT_DELAY_MS: 5000,
  OFFLINE_TIMEOUT_MS: 10000
};

// === UI ===
export const UI_CONFIG = {
  LONG_PRESS_DELAY_MS: 200,
  LONG_PRESS_REPEAT_MS: 70,
  COOLDOWN_MS: 600,
  PARAM_SELECT_TIMEOUT_MS: 600,
  VIBRATION_SHORT_MS: 50,
  VIBRATION_DOUBLE: [50, 100, 50]
};

// === PARAMS ===
export const PARAMS = {
  pression: { min: 950, max: 1050, step: 1, label: 'Pression', unit: 'hPa', decimals: 0 },
  altitude: { min: 0, max: 5000, step: 10, label: 'Altitude', unit: 'm', decimals: 0 },
  temperature: { min: -30, max: 50, step: 1, label: 'T°', unit: '°C', decimals: 0 },
  rosee: { min: -30, max: 50, step: 1, label: 'Td', unit: '°C', decimals: 0 },
  vent: { min: 0, max: 25, step: 0.5, label: 'Vent', unit: 'm/s', decimals: 1 },
  offset: { min: -500, max: 500, step: 17, label: 'Offset', unit: 'g', decimals: 0 }
};

// === MATÉRIAUX ===
export const MATERIALS = {
  B: { name: 'Laiton', color: 'gold', default_mass: 75 },
  L: { name: 'Plomb', color: 'gray', default_mass: 75 },
  W: { name: 'Tungstène', color: 'red', default_mass: 75 }
};

// === DEFAULTS ===
export const DEFAULT_VALUES = {
  pression: 1015, altitude: 214, temperature: 15, rosee: 8,
  vent: 9.0, offset: 0, mv: 2.350, surface: 0.590,
  chronoC: 40.0, chronoR: 40.0, lievre: 38.0, angle: 0
};

export const DEFAULT_SOUTE_CONFIG = {
  x_av: 55, x_ar: -22, x_c: 0,
  m_B: 75, m_L: 75, m_W: 75,
  cap_av: 6, cap_ar: 6, cap_c: 6,
  stock_enabled: false
};

// === STORAGE KEYS ===
export const STORAGE_KEYS = {
  VALUES: 'MBI_VALUES_V3',
  SELECTED_PARAM: 'MBI_SELECTED_PARAM',
  INVERT_SOUTE: 'MBI_INVERT_SOUTE',
  SOUTE_STATE: 'MBI_SOUTE_STATE_V3',
  SOUTE_CONFIG: 'MBI_SOUTE_CFG_V3',
  RUNS: 'MBI_RUNS',
  GLIDER_PROFILE: 'MBI_GliderProfile_v1_last'
};
```

6. **Sauvegarde** : Appuie sur **Ctrl+S**

---

## ✅ **Vérifie**

Tu devrais maintenant voir dans l'arbre de fichiers :
```
src/
├── utils/
│   └── constants.js    ← NOUVEAU (avec du code dedans)