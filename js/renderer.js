/**
 * Stellar Vista — Canvas Renderer v2
 * Renders the sky, star, landscape, and background stars on a full-viewport canvas.
 * Supports time-of-day positioning and comparison mode.
 */

const StellarRenderer = (() => {

    let canvas, ctx;
    let width, height;
    let currentState = null;
    let targetState = null;
    let animProgress = 1; // 0 → 1
    const ANIM_SPEED = 0.025;

    // Time of day: 0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset, 1 = midnight
    let timeOfDay = 0.5; // default: noon

    // Comparison mode
    let comparisonMode = false;
    let compTargetState = null;
    let compCurrentState = null;
    let compAnimProgress = 1;

    // Background stars (fixed random field)
    let bgStars = [];
    const BG_STAR_COUNT = 280;

    // Mountain landscape points
    let mountains = [];

    function init(canvasElement) {
        canvas = canvasElement;
        ctx = canvas.getContext('2d');
        resize();
        generateBgStars();
        generateMountains();
        window.addEventListener('resize', resize);
    }

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        generateMountains();
    }

    function setTimeOfDay(t) {
        timeOfDay = Math.max(0, Math.min(1, t));
    }

    function getTimeOfDay() {
        return timeOfDay;
    }

    function setComparisonMode(enabled) {
        comparisonMode = enabled;
    }

    function generateBgStars() {
        bgStars = [];
        for (let i = 0; i < BG_STAR_COUNT; i++) {
            bgStars.push({
                x: Math.random(),
                y: Math.random() * 0.82,  // above mountains
                size: Math.random() * 1.8 + 0.3,
                brightness: Math.random() * 0.8 + 0.2,
                twinkleSpeed: Math.random() * 0.02 + 0.005,
                twinkleOffset: Math.random() * Math.PI * 2,
            });
        }
    }

    function generateMountains() {
        mountains = [];
        const segments = Math.ceil(width / 20) + 1;
        // Layer 1 — far range
        const layer1 = [];
        for (let i = 0; i <= segments; i++) {
            const x = (i / segments) * width;
            const baseY = height * 0.78;
            const noise = Math.sin(i * 0.15) * height * 0.06
                + Math.sin(i * 0.07 + 1.2) * height * 0.04
                + Math.sin(i * 0.3 + 0.5) * height * 0.015;
            layer1.push({ x, y: baseY + noise });
        }
        // Layer 2 — near range
        const layer2 = [];
        for (let i = 0; i <= segments; i++) {
            const x = (i / segments) * width;
            const baseY = height * 0.85;
            const noise = Math.sin(i * 0.1 + 2.5) * height * 0.05
                + Math.sin(i * 0.25 + 0.8) * height * 0.02
                + Math.sin(i * 0.5 + 3.1) * height * 0.01;
            layer2.push({ x, y: baseY + noise });
        }
        mountains = [layer1, layer2];
    }

    /**
     * Compute time-of-day factors.
     * Returns { elevation, skyDim, position }
     * elevation: 0 = below horizon, 1 = maximum height
     * skyDim: how much to dim the sky (night = 0, noon = 1)
     * position: {x, y} of the star on screen
     */
    function computeTimeFactors(viewportW, viewportH, offsetX) {
        // Map time to angle: 0.25 = rise (0°), 0.5 = noon (90°), 0.75 = set (180°)
        // Star is below horizon when time < 0.2 or time > 0.8
        const dayPhase = (timeOfDay - 0.2) / 0.6; // 0 at rise, 1 at set
        const angle = Math.PI * Math.max(0, Math.min(1, dayPhase)); // 0 → π

        const elevation = Math.sin(angle);  // 0 → 1 → 0
        const horizonY = viewportH * 0.78;
        const zenithY = viewportH * 0.12;

        // Star position follows an arc
        const starX = offsetX + viewportW * 0.1 + viewportW * 0.8 * Math.max(0, Math.min(1, dayPhase));
        const starY = horizonY - (horizonY - zenithY) * elevation;

        // Sky dimming: smoothly transitions around sunrise/sunset
        let skyDim;
        if (elevation <= 0) {
            skyDim = 0;
        } else if (elevation < 0.15) {
            skyDim = elevation / 0.15 * 0.3; // twilight
        } else {
            skyDim = 0.3 + 0.7 * Math.min(1, (elevation - 0.15) / 0.35);
        }

        return { elevation, skyDim, starX, starY };
    }

    /**
     * Set the target rendering state for a star.
     */
    function setTarget(starData, computed, isComparison) {
        const state = {
            // Sky
            skyZenith: computed.sky.zenith,
            skyHorizon: computed.sky.horizon,
            skyBrightness: computed.sky.brightness,
            // Star
            starColor: computed.starColor,
            starX: width * 0.5,
            starRadius: computeStarVisualRadius(computed),
        };
        // Push star down so it stays visible when large
        const minY = state.starRadius + 10;
        state.starY = Math.max(minY, height * 0.32);
        Object.assign(state, {
            glowRadius: computeGlowRadius(computed),
            glowOpacity: computeGlowOpacity(computed),
            coronaRadius: computeCoronaRadius(computed),
        });

        if (isComparison) {
            compTargetState = state;
            if (!compCurrentState) {
                compCurrentState = JSON.parse(JSON.stringify(state));
                compAnimProgress = 1;
            } else {
                compAnimProgress = 0;
            }
        } else {
            targetState = state;
            if (!currentState) {
                currentState = JSON.parse(JSON.stringify(state));
                animProgress = 1;
            } else {
                animProgress = 0;
            }
        }
    }

    function computeStarVisualRadius(computed) {
        const ratio = computed.sunAngularRatio;
        if (ratio <= 0) return 2;
        const px = 40 * Math.pow(ratio, 0.55);
        return Math.max(2, Math.min(px, Math.min(width, height) * 0.45));
    }

    function computeGlowRadius(computed) {
        const base = computeStarVisualRadius(computed);
        const lumFactor = Math.pow(computed.sky.brightness, 0.5);
        return base * (2.5 + lumFactor * 3);
    }

    function computeCoronaRadius(computed) {
        return computeGlowRadius(computed) * 1.8;
    }

    function computeGlowOpacity(computed) {
        return Math.min(0.8, computed.sky.brightness * 1.2 + 0.05);
    }

    // ── Interpolation ────────────────────────────

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function lerpColor(a, b, t) {
        return {
            r: Math.round(lerp(a.r, b.r, t)),
            g: Math.round(lerp(a.g, b.g, t)),
            b: Math.round(lerp(a.b, b.b, t)),
        };
    }

    function interpolateState(cur, tgt, progress) {
        if (!cur || !tgt || progress >= 1) return tgt;
        const t = easeInOutCubic(progress);
        return {
            skyZenith: lerpColor(cur.skyZenith, tgt.skyZenith, t),
            skyHorizon: lerpColor(cur.skyHorizon, tgt.skyHorizon, t),
            skyBrightness: lerp(cur.skyBrightness, tgt.skyBrightness, t),
            starColor: {
                r: Math.round(lerp(cur.starColor.r, tgt.starColor.r, t)),
                g: Math.round(lerp(cur.starColor.g, tgt.starColor.g, t)),
                b: Math.round(lerp(cur.starColor.b, tgt.starColor.b, t)),
                css: '', hex: '',
            },
            starX: lerp(cur.starX, tgt.starX, t),
            starY: lerp(cur.starY, tgt.starY, t),
            starRadius: lerp(cur.starRadius, tgt.starRadius, t),
            glowRadius: lerp(cur.glowRadius, tgt.glowRadius, t),
            glowOpacity: lerp(cur.glowOpacity, tgt.glowOpacity, t),
            coronaRadius: lerp(cur.coronaRadius, tgt.coronaRadius, t),
        };
    }

    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // ── Drawing ──────────────────────────────────

    function drawFrame(time) {
        if (!targetState) { requestAnimationFrame(drawFrame); return; }

        // Advance animations
        if (animProgress < 1) {
            animProgress += ANIM_SPEED;
            if (animProgress >= 1) {
                animProgress = 1;
                currentState = JSON.parse(JSON.stringify(targetState));
            }
        }
        if (compAnimProgress < 1) {
            compAnimProgress += ANIM_SPEED;
            if (compAnimProgress >= 1) {
                compAnimProgress = 1;
                if (compTargetState) compCurrentState = JSON.parse(JSON.stringify(compTargetState));
            }
        }

        ctx.clearRect(0, 0, width, height);

        if (comparisonMode && compTargetState) {
            drawHalf(time, interpolateState(currentState, targetState, animProgress), 0, width / 2);
            drawHalf(time, interpolateState(compCurrentState, compTargetState, compAnimProgress), width / 2, width / 2);
            // Divider line
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(width / 2, 0);
            ctx.lineTo(width / 2, height);
            ctx.stroke();
        } else {
            drawHalf(time, interpolateState(currentState, targetState, animProgress), 0, width);
        }

        requestAnimationFrame(drawFrame);
    }

    function drawHalf(time, s, offsetX, viewW) {
        if (!s) return;
        ctx.save();
        ctx.beginPath();
        ctx.rect(offsetX, 0, viewW, height);
        ctx.clip();

        // Compute time-of-day adjusted values
        const tf = computeTimeFactors(viewW, height, offsetX);
        const adjustedBrightness = s.skyBrightness * tf.skyDim;

        // Adjusted sky colors
        const adjZenith = {
            r: Math.round(s.skyZenith.r * tf.skyDim),
            g: Math.round(s.skyZenith.g * tf.skyDim),
            b: Math.round(s.skyZenith.b * tf.skyDim),
        };
        const adjHorizon = {
            r: Math.round(s.skyHorizon.r * tf.skyDim),
            g: Math.round(s.skyHorizon.g * tf.skyDim),
            b: Math.round(s.skyHorizon.b * tf.skyDim),
        };

        // Sunrise/sunset tinting
        let sunriseTint = 0;
        if (tf.elevation > 0 && tf.elevation < 0.3) {
            sunriseTint = 1 - tf.elevation / 0.3;
        }

        if (sunriseTint > 0.05) {
            const tint = sunriseTint * s.skyBrightness;
            adjHorizon.r = Math.min(255, Math.round(adjHorizon.r + 180 * tint));
            adjHorizon.g = Math.min(255, Math.round(adjHorizon.g + 80 * tint));
            adjHorizon.b = Math.min(255, Math.round(adjHorizon.b + 20 * tint));
        }

        drawSky({ skyZenith: adjZenith, skyHorizon: adjHorizon, skyBrightness: adjustedBrightness }, time, offsetX, viewW);
        drawBackgroundStars({ skyBrightness: adjustedBrightness }, time, offsetX, viewW);

        if (tf.elevation > 0) {
            const clampedY = Math.max(s.starRadius + 10, tf.starY);
            const adjS = {
                ...s,
                starX: tf.starX,
                starY: clampedY,
                glowOpacity: s.glowOpacity * Math.min(1, tf.elevation * 3),
            };
            drawStar(adjS, time);
        }

        drawMountains({ skyBrightness: adjustedBrightness, skyZenith: adjZenith }, offsetX, viewW);
        drawAtmosphericHaze({ skyBrightness: adjustedBrightness, skyHorizon: adjHorizon }, offsetX, viewW);

        ctx.restore();
    }

    function drawSky(s, time, ox, vw) {
        const gradient = ctx.createLinearGradient(ox, 0, ox, height * 0.85);
        const z = s.skyZenith;
        const h = s.skyHorizon;
        gradient.addColorStop(0, `rgb(${z.r}, ${z.g}, ${z.b})`);
        gradient.addColorStop(0.6, `rgb(${Math.round((z.r + h.r) / 2)}, ${Math.round((z.g + h.g) / 2)}, ${Math.round((z.b + h.b) / 2)})`);
        gradient.addColorStop(1, `rgb(${h.r}, ${h.g}, ${h.b})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(ox, 0, vw, height);
    }

    function drawBackgroundStars(s, time, ox, vw) {
        const darkness = 1 - s.skyBrightness;
        if (darkness < 0.15) return;
        const alpha = darkness * 0.9;
        bgStars.forEach(star => {
            const sx = star.x * width;
            if (sx < ox || sx > ox + vw) return;
            const twinkle = 0.5 + 0.5 * Math.sin(time * star.twinkleSpeed + star.twinkleOffset);
            const a = alpha * star.brightness * twinkle;
            if (a < 0.02) return;
            ctx.fillStyle = `rgba(255, 255, 248, ${a})`;
            ctx.beginPath();
            ctx.arc(sx, star.y * height, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    function drawStar(s, time) {
        const cx = s.starX;
        const cy = s.starY;
        const r = s.starRadius;
        const sc = s.starColor;

        // Outer corona
        if (s.coronaRadius > 3) {
            const corona = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, s.coronaRadius);
            corona.addColorStop(0, `rgba(${sc.r}, ${sc.g}, ${sc.b}, ${s.glowOpacity * 0.15})`);
            corona.addColorStop(0.4, `rgba(${sc.r}, ${sc.g}, ${sc.b}, ${s.glowOpacity * 0.05})`);
            corona.addColorStop(1, `rgba(${sc.r}, ${sc.g}, ${sc.b}, 0)`);
            ctx.fillStyle = corona;
            ctx.beginPath();
            ctx.arc(cx, cy, s.coronaRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Inner glow
        if (s.glowRadius > 3) {
            const glow = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, s.glowRadius);
            glow.addColorStop(0, `rgba(${sc.r}, ${sc.g}, ${sc.b}, ${s.glowOpacity * 0.5})`);
            glow.addColorStop(0.5, `rgba(${sc.r}, ${sc.g}, ${sc.b}, ${s.glowOpacity * 0.15})`);
            glow.addColorStop(1, `rgba(${sc.r}, ${sc.g}, ${sc.b}, 0)`);
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(cx, cy, s.glowRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Star disc
        if (r >= 3) {
            const disc = ctx.createRadialGradient(cx - r * 0.15, cy - r * 0.15, 0, cx, cy, r);
            disc.addColorStop(0, `rgba(255, 255, 255, 0.95)`);
            disc.addColorStop(0.3, `rgb(${Math.min(255, sc.r + 30)}, ${Math.min(255, sc.g + 20)}, ${Math.min(255, sc.b + 10)})`);
            disc.addColorStop(0.8, `rgb(${sc.r}, ${sc.g}, ${sc.b})`);
            disc.addColorStop(1, `rgb(${Math.max(0, sc.r - 40)}, ${Math.max(0, sc.g - 30)}, ${Math.max(0, sc.b - 20)})`);
            ctx.fillStyle = disc;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = `rgba(${sc.r}, ${sc.g}, ${sc.b}, 1)`;
            ctx.beginPath();
            ctx.arc(cx, cy, Math.max(1.5, r), 0, Math.PI * 2);
            ctx.fill();
            const ptGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 15);
            ptGlow.addColorStop(0, `rgba(${sc.r}, ${sc.g}, ${sc.b}, 0.8)`);
            ptGlow.addColorStop(1, `rgba(${sc.r}, ${sc.g}, ${sc.b}, 0)`);
            ctx.fillStyle = ptGlow;
            ctx.beginPath();
            ctx.arc(cx, cy, 15, 0, Math.PI * 2);
            ctx.fill();
        }

        // Subtle star rays for bright stars
        if (s.glowOpacity > 0.3 && r > 5) {
            drawStarRays(cx, cy, r, sc, s.glowOpacity, time);
        }
    }

    function drawStarRays(cx, cy, r, color, opacity, time) {
        const rayLen = r * 4;
        const numRays = 4;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(Math.PI / 4);
        for (let i = 0; i < numRays; i++) {
            const angle = (i / numRays) * Math.PI * 2;
            const pulse = 0.9 + 0.1 * Math.sin(time * 0.001 + i);
            const len = rayLen * pulse;
            const rayGrad = ctx.createLinearGradient(0, 0, Math.cos(angle) * len, Math.sin(angle) * len);
            rayGrad.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity * 0.2})`);
            rayGrad.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
            ctx.strokeStyle = rayGrad;
            ctx.lineWidth = Math.max(1, r * 0.05);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
            ctx.stroke();
        }
        ctx.restore();
    }

    function drawMountains(s, ox, vw) {
        mountains.forEach((layer, li) => {
            const shade = li === 0
                ? Math.round(15 + 10 * s.skyBrightness)
                : Math.round(5 + 5 * s.skyBrightness);
            const colorShift = s.skyZenith;
            const mr = Math.round(shade + colorShift.r * 0.05);
            const mg = Math.round(shade + colorShift.g * 0.05);
            const mb = Math.round(shade + colorShift.b * 0.08);

            ctx.fillStyle = `rgb(${mr}, ${mg}, ${mb})`;
            ctx.beginPath();
            ctx.moveTo(ox, height);
            layer.forEach(pt => {
                if (pt.x >= ox - 20 && pt.x <= ox + vw + 20) ctx.lineTo(pt.x, pt.y);
            });
            ctx.lineTo(ox + vw, height);
            ctx.closePath();
            ctx.fill();
        });
    }

    function drawAtmosphericHaze(s, ox, vw) {
        if (s.skyBrightness < 0.1) return;
        const h = s.skyHorizon;
        const hazeGrad = ctx.createLinearGradient(ox, height * 0.65, ox, height * 0.85);
        hazeGrad.addColorStop(0, `rgba(${h.r}, ${h.g}, ${h.b}, 0)`);
        hazeGrad.addColorStop(1, `rgba(${h.r}, ${h.g}, ${h.b}, ${s.skyBrightness * 0.15})`);
        ctx.fillStyle = hazeGrad;
        ctx.fillRect(ox, height * 0.65, vw, height * 0.2);
    }

    function start() {
        requestAnimationFrame(drawFrame);
    }

    return {
        init, setTarget, start, resize,
        setTimeOfDay, getTimeOfDay,
        setComparisonMode,
    };
})();
