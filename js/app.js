/**
 * Stellar Vista — Application Controller v2
 * Settings panel, comparison mode, bilingual, ambient sounds, time-of-day
 */

// ── Language Dictionary ────────────────────────
const LANG = {
    en: {
        appName: 'Stellar Vista',
        starCatalog: 'Star Catalog',
        selectStar: 'Select a Star',
        stellarProps: 'Stellar Properties',
        name: 'Name',
        spectralType: 'Spectral Type',
        temperature: 'Temperature',
        luminosity: 'Luminosity',
        radius: 'Radius',
        mass: 'Mass',
        surfaceGravity: 'Surface Gravity',
        appearanceAt1AU: 'Appearance at 1 AU',
        angularDiameter: 'Angular Diameter',
        apparentMagnitude: 'Apparent Magnitude',
        starColor: 'Star Color',
        visualSize: 'Visual Size (relative to Sun)',
        habitableZone: 'Habitable Zone Check (1 AU)',
        aboutStar: 'About This Star',
        spectralClasses: 'Spectral Classes',
        navigate: 'Navigate',
        togglePanel: 'Toggle panel',
        settings: 'Settings',
        timeOfDay: 'Time of Day',
        midnight: 'Midnight',
        sunrise: 'Sunrise',
        noon: 'Noon',
        sunset: 'Sunset',
        language: 'Language',
        comparisonMode: 'Comparison Mode',
        compStar: 'Compare With',
        ambientSound: 'Ambient Sound',
        on: 'On',
        off: 'Off',
        hzYes: '✓ In HZ',
        hzNo: '✗ Outside HZ',
    },
    ar: {
        appName: 'ستيلر فيستا',
        starCatalog: 'كتالوج النجوم',
        selectStar: 'اختر نجماً',
        stellarProps: 'الخصائص النجمية',
        name: 'الاسم',
        spectralType: 'الصنف الطيفي',
        temperature: 'الحرارة',
        luminosity: 'اللمعان',
        radius: 'نصف القطر',
        mass: 'الكتلة',
        surfaceGravity: 'جاذبية السطح',
        appearanceAt1AU: 'المظهر عند 1 و.ف',
        angularDiameter: 'القطر الزاوي',
        apparentMagnitude: 'القدر الظاهري',
        starColor: 'لون النجم',
        visualSize: 'الحجم البصري (نسبة للشمس)',
        habitableZone: 'فحص المنطقة الصالحة للحياة',
        aboutStar: 'عن هذا النجم',
        spectralClasses: 'الأصناف الطيفية',
        navigate: 'تنقل',
        togglePanel: 'إخفاء اللوحة',
        settings: 'الإعدادات',
        timeOfDay: 'وقت اليوم',
        midnight: 'منتصف الليل',
        sunrise: 'شروق',
        noon: 'ظهيرة',
        sunset: 'غروب',
        language: 'اللغة',
        comparisonMode: 'وضع المقارنة',
        compStar: 'قارن مع',
        ambientSound: 'الصوت المحيط',
        on: 'تشغيل',
        off: 'إيقاف',
        hzYes: '✓ ضمن المنطقة',
        hzNo: '✗ خارج المنطقة',
    }
};

// ── Ambient Sound Engine ────────────────────────
const AmbientSound = (() => {
    let audioCtx = null;
    let masterGain = null;
    let windNode = null;
    let humNode = null;
    let running = false;

    function init() {
        if (audioCtx) return;
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0;
        masterGain.connect(audioCtx.destination);
    }

    function start() {
        if (running) return;
        init();
        running = true;

        // Wind noise (filtered white noise)
        const bufferSize = audioCtx.sampleRate * 2;
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        windNode = audioCtx.createBufferSource();
        windNode.buffer = noiseBuffer;
        windNode.loop = true;

        const windFilter = audioCtx.createBiquadFilter();
        windFilter.type = 'bandpass';
        windFilter.frequency.value = 300;
        windFilter.Q.value = 0.5;

        const windGain = audioCtx.createGain();
        windGain.gain.value = 0.08;

        windNode.connect(windFilter);
        windFilter.connect(windGain);
        windGain.connect(masterGain);
        windNode.start();

        // Stellar hum (low drone)
        humNode = audioCtx.createOscillator();
        humNode.type = 'sine';
        humNode.frequency.value = 55;

        const humGain = audioCtx.createGain();
        humGain.gain.value = 0.03;

        humNode.connect(humGain);
        humGain.connect(masterGain);
        humNode.start();

        // Fade in
        masterGain.gain.setTargetAtTime(0.6, audioCtx.currentTime, 0.5);
    }

    function stop() {
        if (!running || !audioCtx) return;
        running = false;
        masterGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.3);
        setTimeout(() => {
            if (windNode) { try { windNode.stop(); } catch (e) { } windNode = null; }
            if (humNode) { try { humNode.stop(); } catch (e) { } humNode = null; }
        }, 1000);
    }

    function isRunning() { return running; }

    return { start, stop, isRunning };
})();

// ── Main App Controller ─────────────────────────
const App = (() => {
    let selectedIndex = 0;
    let compSelectedIndex = -1;
    let panelOpen = true;
    let settingsOpen = false;
    let currentLang = 'en';
    let comparisonEnabled = false;

    function init() {
        buildStarList('star-list');
        buildStarList('comp-star-list');
        buildSpectralLegend();
        bindEvents();
        setupSettings();
        selectStar(findStarIndex('Sun'));
        StellarRenderer.start();
        applyLanguage(currentLang);
    }

    function findStarIndex(name) {
        return STAR_DATABASE.findIndex(s => s.name === name);
    }

    function t(key) {
        return LANG[currentLang]?.[key] || LANG['en'][key] || key;
    }

    // ── Star List ────────────────────────────────

    function buildStarList(containerId) {
        const list = document.getElementById(containerId);
        if (!list) return;
        list.innerHTML = '';
        const classes = ['O', 'B', 'A', 'F', 'G', 'K', 'M'];
        const isComp = containerId === 'comp-star-list';

        classes.forEach(cls => {
            const stars = STAR_DATABASE.filter(s => s.class === cls);
            if (stars.length === 0) return;

            const group = document.createElement('div');
            group.className = 'star-group';

            const header = document.createElement('div');
            header.className = 'star-group-header';
            header.innerHTML = `<span class="spectral-dot" style="background:${SPECTRAL_CLASSES[cls].color}"></span>${SPECTRAL_CLASSES[cls].label}`;
            group.appendChild(header);

            stars.forEach(star => {
                const idx = STAR_DATABASE.indexOf(star);
                const btn = document.createElement('button');
                btn.className = 'star-btn';
                btn.dataset.index = idx;
                btn.dataset.listType = isComp ? 'comp' : 'main';
                btn.innerHTML = `
                    <span class="star-btn-dot" style="background:${StellarPhysics.temperatureToRGB(star.temperature).css}"></span>
                    <span class="star-btn-name">${star.name}</span>
                    <span class="star-btn-spec">${star.spectral}</span>
                `;
                btn.addEventListener('click', () => {
                    if (isComp) {
                        selectCompStar(idx);
                    } else {
                        selectStar(idx);
                    }
                });
                group.appendChild(btn);
            });

            list.appendChild(group);
        });
    }

    function buildSpectralLegend() {
        const bar = document.getElementById('spectral-bar');
        if (!bar) return;
        const classes = ['O', 'B', 'A', 'F', 'G', 'K', 'M'];
        classes.forEach(cls => {
            const seg = document.createElement('div');
            seg.className = 'spectral-segment';
            seg.style.background = SPECTRAL_CLASSES[cls].color;
            seg.title = SPECTRAL_CLASSES[cls].range;
            seg.textContent = cls;
            bar.appendChild(seg);
        });
    }

    // ── Star Selection ───────────────────────────

    function selectStar(index) {
        if (index < 0 || index >= STAR_DATABASE.length) return;
        selectedIndex = index;
        const star = STAR_DATABASE[index];
        const computed = StellarPhysics.computeAll(star);
        StellarRenderer.setTarget(star, computed, false);
        updateDataPanel(star, computed);
        updateDescription(star);
        highlightButton(index, 'main');
        updateTitle(star);
    }

    function selectCompStar(index) {
        if (index < 0 || index >= STAR_DATABASE.length) return;
        compSelectedIndex = index;
        const star = STAR_DATABASE[index];
        const computed = StellarPhysics.computeAll(star);
        StellarRenderer.setTarget(star, computed, true);
        highlightButton(index, 'comp');

        // Update comparison label
        const label = document.getElementById('comp-label');
        if (label) label.textContent = star.name;
    }

    function updateDataPanel(star, computed) {
        setText('data-name', star.name);
        setText('data-spectral', star.spectral);
        setText('data-temp', formatNumber(star.temperature) + ' K');
        setText('data-lum', formatLuminosity(star.luminosity));
        setText('data-radius', star.radius.toFixed(star.radius < 1 ? 4 : 2) + ' R☉');
        setText('data-mass', star.mass.toFixed(star.mass < 1 ? 4 : 2) + ' M☉');
        setText('data-angdiam', formatAngularDiam(computed.angularDiameterArcmin));
        setText('data-appmag', computed.apparentMagnitude.toFixed(2) + ' mag');
        setText('data-gravity', computed.surfaceGravity.toFixed(2) + ' g☉');

        const hzEl = document.getElementById('data-hz');
        const hz = computed.habitableZone;
        if (hzEl) {
            if (computed.isHabitable) {
                hzEl.innerHTML = `<span class="hz-yes">${t('hzYes')}</span> <span class="hz-range">(${hz.inner.toFixed(2)}–${hz.outer.toFixed(2)} AU)</span>`;
            } else {
                hzEl.innerHTML = `<span class="hz-no">${t('hzNo')}</span> <span class="hz-range">(${hz.inner.toFixed(2)}–${hz.outer.toFixed(2)} AU)</span>`;
            }
        }

        const swatch = document.getElementById('color-swatch');
        if (swatch) swatch.style.background = computed.starColor.css;

        const sizeBar = document.getElementById('size-comparison');
        const ratio = computed.sunAngularRatio;
        const barWidth = Math.min(100, Math.max(2, Math.log10(ratio + 1) * 40 + 5));
        if (sizeBar) {
            sizeBar.style.width = barWidth + '%';
            sizeBar.style.background = computed.starColor.css;
        }
        setText('size-label', ratio < 0.01 ? (ratio * 60).toFixed(1) + '″' :
            ratio < 1 ? (ratio).toFixed(3) + '×☉' :
                ratio.toFixed(1) + '×☉');
    }

    function updateDescription(star) {
        setText('star-description', star.description);
    }

    function updateTitle(star) {
        document.title = `Stellar Vista — ${star.name}`;
        setText('header-star-name', star.name);
    }

    function highlightButton(index, listType) {
        const selector = listType === 'comp'
            ? '.star-btn[data-list-type="comp"]'
            : '.star-btn[data-list-type="main"]';
        document.querySelectorAll(selector).forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.index) === index);
        });
    }

    // ── Settings ─────────────────────────────────

    function setupSettings() {
        // Time of day slider
        const timeSlider = document.getElementById('time-slider');
        if (timeSlider) {
            timeSlider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                StellarRenderer.setTimeOfDay(val);
                updateTimeLabel(val);
            });
        }

        // Language toggle
        const langToggle = document.getElementById('lang-toggle');
        if (langToggle) {
            langToggle.addEventListener('click', () => {
                currentLang = currentLang === 'en' ? 'ar' : 'en';
                applyLanguage(currentLang);
            });
        }

        // Comparison mode toggle
        const compToggle = document.getElementById('comp-toggle');
        if (compToggle) {
            compToggle.addEventListener('click', () => {
                comparisonEnabled = !comparisonEnabled;
                StellarRenderer.setComparisonMode(comparisonEnabled);
                compToggle.classList.toggle('toggle-on', comparisonEnabled);
                compToggle.textContent = comparisonEnabled ? t('on') : t('off');

                const compSection = document.getElementById('comp-section');
                if (compSection) compSection.style.display = comparisonEnabled ? 'block' : 'none';

                if (comparisonEnabled && compSelectedIndex < 0) {
                    // Auto-select Sirius for comparison
                    const siriusIdx = findStarIndex('Sirius A');
                    if (siriusIdx >= 0) selectCompStar(siriusIdx);
                }
            });
        }

        // Sound toggle
        const soundToggle = document.getElementById('sound-toggle');
        if (soundToggle) {
            soundToggle.addEventListener('click', () => {
                if (AmbientSound.isRunning()) {
                    AmbientSound.stop();
                    soundToggle.classList.remove('toggle-on');
                    soundToggle.textContent = t('off');
                } else {
                    AmbientSound.start();
                    soundToggle.classList.add('toggle-on');
                    soundToggle.textContent = t('on');
                }
            });
        }
    }

    function updateTimeLabel(val) {
        const label = document.getElementById('time-label');
        if (!label) return;
        const hours = Math.floor(val * 24);
        const mins = Math.floor((val * 24 - hours) * 60);
        label.textContent = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }

    // ── Language ──────────────────────────────────

    function applyLanguage(lang) {
        currentLang = lang;
        const isAr = lang === 'ar';
        document.documentElement.lang = isAr ? 'ar' : 'en';
        document.documentElement.dir = isAr ? 'rtl' : 'ltr';

        // Update all translatable elements
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            if (LANG[lang]?.[key]) {
                el.textContent = LANG[lang][key];
            }
        });

        // Update toggle button texts
        const compToggle = document.getElementById('comp-toggle');
        if (compToggle) compToggle.textContent = comparisonEnabled ? t('on') : t('off');
        const soundToggle = document.getElementById('sound-toggle');
        if (soundToggle) soundToggle.textContent = AmbientSound.isRunning() ? t('on') : t('off');
        const langBtn = document.getElementById('lang-toggle');
        if (langBtn) langBtn.textContent = isAr ? 'English' : 'العربية';

        // Re-update data panel with current star
        if (selectedIndex >= 0) {
            const star = STAR_DATABASE[selectedIndex];
            const computed = StellarPhysics.computeAll(star);
            updateDataPanel(star, computed);
        }
    }

    // ── Events ───────────────────────────────────

    function bindEvents() {
        document.addEventListener('keydown', e => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                selectStar((selectedIndex + 1) % STAR_DATABASE.length);
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                selectStar((selectedIndex - 1 + STAR_DATABASE.length) % STAR_DATABASE.length);
            } else if (e.key === 'Escape') {
                togglePanel();
            } else if (e.key === 's' || e.key === 'S') {
                toggleSettings();
            }
        });

        document.getElementById('panel-toggle').addEventListener('click', togglePanel);
        document.getElementById('settings-toggle').addEventListener('click', toggleSettings);

        const infoToggle = document.getElementById('info-toggle');
        if (infoToggle) infoToggle.addEventListener('click', togglePanel);

        const mobileSettings = document.getElementById('mobile-settings-toggle');
        if (mobileSettings) mobileSettings.addEventListener('click', toggleSettings);
    }

    function togglePanel() {
        panelOpen = !panelOpen;
        document.getElementById('control-panel').classList.toggle('collapsed', !panelOpen);
        const togBtn = document.getElementById('panel-toggle');
        togBtn.textContent = panelOpen ? '◀' : '▶';
        // Close settings if opening catalog
        if (panelOpen && settingsOpen) {
            settingsOpen = false;
            document.getElementById('settings-panel').classList.add('collapsed');
        }
    }

    function toggleSettings() {
        settingsOpen = !settingsOpen;
        document.getElementById('settings-panel').classList.toggle('collapsed', !settingsOpen);
        // Close catalog if opening settings
        if (settingsOpen && panelOpen) {
            panelOpen = false;
            document.getElementById('control-panel').classList.add('collapsed');
            document.getElementById('panel-toggle').textContent = '▶';
        }
    }

    // ── Formatting ───────────────────────────────

    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    function formatNumber(n) {
        return n.toLocaleString('en-US');
    }

    function formatLuminosity(l) {
        if (l >= 1000) return formatNumber(Math.round(l)) + ' L☉';
        if (l >= 1) return l.toFixed(2) + ' L☉';
        if (l >= 0.01) return l.toFixed(4) + ' L☉';
        return l.toExponential(2) + ' L☉';
    }

    function formatAngularDiam(arcmin) {
        if (arcmin >= 60) return (arcmin / 60).toFixed(1) + '°';
        if (arcmin >= 1) return arcmin.toFixed(1) + '′';
        return (arcmin * 60).toFixed(1) + '″';
    }

    return { init };
})();

// ── Bootstrap ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    StellarRenderer.init(document.getElementById('sky-canvas'));
    App.init();
});
