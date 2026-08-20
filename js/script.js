/* ==========================================================================
   Adam Hurwitz — Homepage interactions
   ========================================================================== */

/* ---------- Copyright year ---------- */
(function () {
    const yr = document.getElementById('current-year');
    if (yr) yr.textContent = new Date().getFullYear();
})();

/* ---------- Theme toggle (persisted, respects system preference) ---------- */
(function () {
    const root = document.documentElement;
    const stateEl = document.getElementById('theme-state');
    const toggle = document.getElementById('theme-toggle');
    const stored = localStorage.getItem('theme');
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    let theme = stored || (prefersLight ? 'light' : 'dark');

    function apply(t) {
        root.setAttribute('data-theme', t);
        if (stateEl) stateEl.textContent = t === 'light' ? '[LIGHT]' : '[DARK]';
    }
    apply(theme);

    if (toggle) {
        toggle.addEventListener('click', function () {
            theme = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', theme);
            apply(theme);
        });
    }
})();

/* ---------- Eastern time clock ---------- */
(function () {
    const els = [document.getElementById('edt-clock'), document.getElementById('hero-clock')].filter(Boolean);
    if (!els.length) return;

    const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
    });

    function tick() {
        const parts = fmt.formatToParts(new Date());
        const get = (t) => (parts.find((p) => p.type === t) || {}).value || '';
        const time = `${get('hour')}:${get('minute')}:${get('second')}`;
        const zone = get('timeZoneName') || 'ET';
        els.forEach((el) => {
            if (el.id === 'edt-clock') {
                el.innerHTML = `${time} <span class="clock__zone">${zone}</span>`;
            } else {
                el.textContent = `${time} ${zone}`;
            }
        });
    }
    tick();
    setInterval(tick, 1000);
})();

/* ---------- Typewriter role ---------- */
(function () {
    const container = document.getElementById('typewriter-container');
    if (!container) return;

    const prefix = 'software ';
    const suffixes = ['design', 'development'];
    let suffixIndex = 0;
    let charIndex = 0;
    let prefixIndex = 0;
    let deleting = false;

    const prefixSpan = document.createElement('span');
    const suffixSpan = document.createElement('span');
    suffixSpan.className = 'tw-accent';
    const cursor = document.createElement('span');
    cursor.className = 'cursor';
    cursor.textContent = '|';
    cursor.style.animation = 'twblink 1s steps(1) infinite';

    container.append(prefixSpan, suffixSpan, cursor);

    const style = document.createElement('style');
    style.textContent = '@keyframes twblink { 0%,50% { opacity: 1; } 51%,100% { opacity: 0; } }';
    document.head.appendChild(style);

    function typePrefix() {
        if (prefixIndex < prefix.length) {
            prefixSpan.textContent = prefix.slice(0, ++prefixIndex);
            setTimeout(typePrefix, 90);
        } else {
            typeSuffix();
        }
    }

    function typeSuffix() {
        const cur = suffixes[suffixIndex];
        if (!deleting) {
            if (charIndex < cur.length) {
                suffixSpan.textContent = cur.slice(0, ++charIndex);
                setTimeout(typeSuffix, 100);
            } else {
                setTimeout(() => { deleting = true; typeSuffix(); }, 2000);
            }
        } else {
            if (charIndex > 0) {
                suffixSpan.textContent = cur.slice(0, --charIndex);
                setTimeout(typeSuffix, 50);
            } else {
                deleting = false;
                suffixIndex = (suffixIndex + 1) % suffixes.length;
                setTimeout(typeSuffix, 500);
            }
        }
    }

    typePrefix();
})();

/* ---------- Interactive hero name (char reveal + WebGL liquid distortion) ---------- */
(function () {
    function bootLiquid(nameEl, opts) {
    if (!nameEl) return;
    const bubble = !!(opts && opts.bubble);

    const logoStage = nameEl.querySelector('.hero__logo-stage');
    const label = nameEl.getAttribute('aria-label');
    const text = nameEl.textContent.trim();
    nameEl.textContent = '';
    if (label) nameEl.setAttribute('aria-label', label);

    const wrap = document.createElement('span');
    wrap.className = 'hero-liquid';

    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);';
    sr.textContent = label || text;

    nameEl.appendChild(wrap);
    if (logoStage) nameEl.appendChild(logoStage);

    function useCharReveal() {
        wrap.classList.add('hero-liquid--chars');
        const chars = [];
        text.split('').forEach((ch) => {
            const span = document.createElement('span');
            span.className = 'hero-char' + (ch === ' ' ? ' is-space' : '');
            span.textContent = ch === ' ' ? '\u00A0' : ch;
            span.setAttribute('aria-hidden', 'true');
            wrap.appendChild(span);
            chars.push(span);
        });
        wrap.appendChild(sr);
        setTimeout(() => {
            chars.forEach((span, i) => {
                setTimeout(() => span.classList.add('is-revealed'), i * 55);
            });
        }, 300);
    }

    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!canHover || reduceMotion) {
        useCharReveal();
        return;
    }

    const src = document.createElement('span');
    src.className = 'hero-liquid__src';
    src.textContent = text;
    src.setAttribute('aria-hidden', 'true');
    wrap.appendChild(src);
    wrap.appendChild(sr);

    const canvas = document.createElement('canvas');
    canvas.className = 'hero-liquid__canvas';
    canvas.setAttribute('aria-hidden', 'true');
    wrap.appendChild(canvas);

    const gl = canvas.getContext('webgl2', {
        alpha: true,
        antialias: false,
        premultipliedAlpha: true,
        preserveDrawingBuffer: false
    });
    if (!gl) {
        canvas.remove();
        src.remove();
        useCharReveal();
        return;
    }
    gl.getExtension('EXT_color_buffer_float');
    gl.getExtension('EXT_color_buffer_half_float');

    const VS = `#version 300 es
        in vec2 aPos;
        out vec2 vUv;
        void main() {
            vUv = aPos * 0.5 + 0.5;
            gl_Position = vec4(aPos, 0.0, 1.0);
        }`;

    const SPLAT_FS = `#version 300 es
        precision highp float;
        in vec2 vUv;
        out vec4 fragColor;
        uniform sampler2D uVelocity;
        uniform vec2 uPointer;
        uniform vec2 uDelta;
        uniform float uRadius;
        uniform float uAspect;
        void main() {
            vec2 vel = texture(uVelocity, vUv).xy;
            vec2 diff = (vUv - uPointer) * vec2(uAspect, 1.0);
            float mask = exp(-dot(diff, diff) / max(uRadius, 1e-5));
            vel += uDelta * mask;
            fragColor = vec4(vel, 0.0, 1.0);
        }`;

    const ADVECT_FS = `#version 300 es
        precision highp float;
        in vec2 vUv;
        out vec4 fragColor;
        uniform sampler2D uVelocity;
        uniform vec2 uTexelSize;
        uniform float uDissipation;
        void main() {
            vec2 velocity = texture(uVelocity, vUv).xy;
            vec2 coord = clamp(vUv - velocity * uTexelSize * 16.0, 0.0, 1.0);
            vec2 advected = texture(uVelocity, coord).xy;
            advected *= uDissipation;
            fragColor = vec4(advected, 0.0, 1.0);
        }`;

    const DISPLAY_FS = `#version 300 es
        precision highp float;
        in vec2 vUv;
        out vec4 fragColor;
        uniform sampler2D tText;
        uniform sampler2D uVelocity;
        uniform vec2 uSimSize;
        uniform float uDisplacementStrength;

        void main() {
            vec2 velocity = texture(uVelocity, vUv).xy;
            vec2 displacement = velocity * uDisplacementStrength;

            vec4 color = vec4(0.0);
            for (int i = 0; i < 4; i++) {
                float t = float(i) / 3.0;
                vec2 sampleUv = clamp(vUv - displacement * (0.35 + t * 0.85), 0.0, 1.0);
                color += texture(tText, sampleUv);
            }
            color /= 4.0;

            fragColor = vec4(color.rgb * color.a, color.a);
        }`;

    function compile(type, src) {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
            console.warn(gl.getShaderInfoLog(sh));
            return null;
        }
        return sh;
    }

    function program(vsSrc, fsSrc) {
        const p = gl.createProgram();
        const vs = compile(gl.VERTEX_SHADER, vsSrc);
        const fs = compile(gl.FRAGMENT_SHADER, fsSrc);
        if (!vs || !fs) return null;
        gl.attachShader(p, vs);
        gl.attachShader(p, fs);
        gl.bindAttribLocation(p, 0, 'aPos');
        gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
            console.warn(gl.getProgramInfoLog(p));
            return null;
        }
        const uniforms = {};
        const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < n; i++) {
            const info = gl.getActiveUniform(p, i);
            uniforms[info.name] = gl.getUniformLocation(p, info.name);
        }
        return { p, uniforms };
    }

    const splatProg = program(VS, SPLAT_FS);
    const advectProg = program(VS, ADVECT_FS);
    const displayProg = program(VS, DISPLAY_FS);
    if (!splatProg || !advectProg || !displayProg) return;

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    function bindQuad(prog) {
        gl.useProgram(prog.p);
        gl.bindBuffer(gl.ARRAY_BUFFER, quad);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    }

    function makeFBO(w, h) {
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        const formats = [
            [gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT],
            [gl.RGBA32F, gl.RGBA, gl.FLOAT],
            [gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE]
        ];
        for (const [internal, format, type] of formats) {
            gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, type, null);
            const fbo = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
            if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) {
                return { tex, fbo, w, h };
            }
            gl.deleteFramebuffer(fbo);
        }
        throw new Error('No float FBO');
    }

    const SIM = 160;
    let velA, velB;
    try {
        velA = makeFBO(SIM, SIM);
        velB = makeFBO(SIM, SIM);
    } catch (err) {
        canvas.remove();
        src.remove();
        useCharReveal();
        return;
    }

    const textTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const textCanvas = document.createElement('canvas');
    const textCtx = textCanvas.getContext('2d');

    function paintText() {
        const w = Math.max(2, wrap.clientWidth);
        const h = Math.max(2, wrap.clientHeight);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);

        textCanvas.width = canvas.width;
        textCanvas.height = canvas.height;
        textCtx.setTransform(1, 0, 0, 1, 0, 0);
        textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);
        textCtx.scale(dpr, dpr);

        const cs = getComputedStyle(src);
        textCtx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        textCtx.textAlign = 'left';
        textCtx.textBaseline = 'bottom';
        if ('letterSpacing' in textCtx) textCtx.letterSpacing = cs.letterSpacing;
        if ('fontKerning' in textCtx) textCtx.fontKerning = cs.fontKerning || 'normal';

        const sizePx = parseFloat(cs.fontSize) || 80;
        const srcRect = src.getBoundingClientRect();
        const wrapRect = wrap.getBoundingClientRect();
        const ox = srcRect.left - wrapRect.left;
        const oy = srcRect.top - wrapRect.top;
        const y = oy + src.offsetHeight;
        const blue = getComputedStyle(document.documentElement).getPropertyValue('--blue').trim() || '#7B8CDE';
        const fillAlpha = bubble ? 0.55 : 0.82;
        textCtx.save();
        textCtx.shadowColor = 'rgba(20, 24, 40, 0.26)';
        textCtx.shadowBlur = sizePx * 0.08;
        textCtx.shadowOffsetX = sizePx * 0.03;
        textCtx.shadowOffsetY = sizePx * 0.05;
        textCtx.fillStyle = `rgba(123, 140, 222, ${fillAlpha})`;
        textCtx.fillText(text, ox, y);
        textCtx.shadowColor = 'transparent';
        textCtx.lineJoin = 'round';
        textCtx.lineWidth = Math.max(1.6, sizePx * 0.038);
        textCtx.strokeStyle = blue;
        textCtx.strokeText(text, ox, y);
        textCtx.fillStyle = 'rgba(255, 255, 255, 0.32)';
        textCtx.fillText(text, ox - sizePx * 0.016, y - sizePx * 0.022);
        textCtx.restore();

        gl.bindTexture(gl.TEXTURE_2D, textTex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    }

    let hovering = false;
    let raf = null;
    let lastX = -1, lastY = -1;
    let pointer = [0.5, 0.5];
    let delta = [0, 0];
    let pendingSplat = false;
    let idleFrames = 0;

    function swapVel() {
        const tmp = velA;
        velA = velB;
        velB = tmp;
    }

    function tick() {
        const aspect = Math.max(wrap.clientWidth / Math.max(wrap.clientHeight, 1), 0.001);

        if (pendingSplat) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, velB.fbo);
            gl.viewport(0, 0, SIM, SIM);
            bindQuad(splatProg);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, velA.tex);
            gl.uniform1i(splatProg.uniforms.uVelocity, 0);
            gl.uniform2f(splatProg.uniforms.uPointer, pointer[0], pointer[1]);
            gl.uniform2f(splatProg.uniforms.uDelta, delta[0], delta[1]);
            gl.uniform1f(splatProg.uniforms.uRadius, 0.045);
            gl.uniform1f(splatProg.uniforms.uAspect, aspect);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            swapVel();
            pendingSplat = false;
            idleFrames = 0;
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, velB.fbo);
        gl.viewport(0, 0, SIM, SIM);
        bindQuad(advectProg);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, velA.tex);
        gl.uniform1i(advectProg.uniforms.uVelocity, 0);
        gl.uniform2f(advectProg.uniforms.uTexelSize, 1 / SIM, 1 / SIM);
        gl.uniform1f(advectProg.uniforms.uDissipation, hovering ? 0.96 : 0.86);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        swapVel();

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        bindQuad(displayProg);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textTex);
        gl.uniform1i(displayProg.uniforms.tText, 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, velA.tex);
        gl.uniform1i(displayProg.uniforms.uVelocity, 1);
        gl.uniform2f(displayProg.uniforms.uSimSize, SIM, SIM);
        gl.uniform1f(displayProg.uniforms.uDisplacementStrength, 1.15);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.disable(gl.BLEND);

        if (!hovering) idleFrames += 1;
        if (!hovering && idleFrames > 36) {
            raf = null;
            return;
        }
        raf = requestAnimationFrame(tick);
    }

    function startLoop() {
        if (!raf) raf = requestAnimationFrame(tick);
    }

    wrap.addEventListener('mouseenter', () => {
        hovering = true;
        idleFrames = 0;
        startLoop();
    });

    wrap.addEventListener('mousemove', (e) => {
        const rect = wrap.getBoundingClientRect();
        const x = (e.clientX - rect.left) / Math.max(rect.width, 1);
        const y = 1 - (e.clientY - rect.top) / Math.max(rect.height, 1);
        if (lastX >= 0) {
            const dx = x - pointer[0];
            const dy = y - pointer[1];
            delta[0] = dx * 1.8;
            delta[1] = dy * 1.8;
            pendingSplat = Math.hypot(dx, dy) > 0.0004;
        }
        pointer[0] = x;
        pointer[1] = y;
        lastX = e.clientX;
        lastY = e.clientY;
        startLoop();
    });

    wrap.addEventListener('mouseleave', () => {
        hovering = false;
        lastX = -1;
        lastY = -1;
        pendingSplat = false;
    });

    const goLive = () => {
        paintText();
        startLoop();
    };

    const fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    fontsReady.then(() => {
        requestAnimationFrame(() => requestAnimationFrame(goLive));
    });

    new ResizeObserver(() => {
        paintText();
    }).observe(wrap);

    new MutationObserver(() => {
        paintText();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    }

    bootLiquid(document.querySelector('.hero__line--name'), { bubble: false });
    bootLiquid(document.querySelector('.hero__company'), { bubble: true });
})();

/* ---------- Scroll reveal ---------- */
(function () {
    const items = document.querySelectorAll('[data-reveal]');
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
        items.forEach((el) => el.classList.add('is-in'));
        return;
    }

    const io = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                const delay = Math.min(i * 60, 180);
                setTimeout(() => entry.target.classList.add('is-in'), delay);
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    items.forEach((el) => io.observe(el));
})();

/* ---------- Work list hover-follow thumbnail ---------- */
(function () {
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const hover = document.getElementById('work-hover');
    const img = document.getElementById('work-hover-img');
    const rows = document.querySelectorAll('.work-row[data-img]');
    if (!canHover || !hover || !img || !rows.length) return;

    let targetX = 0, targetY = 0, curX = 0, curY = 0, raf = null;

    function loop() {
        curX += (targetX - curX) * 0.18;
        curY += (targetY - curY) * 0.18;
        hover.style.transform = `translate(${curX}px, ${curY}px) translate(-50%, -50%) scale(1)`;
        raf = requestAnimationFrame(loop);
    }

    rows.forEach((row) => {
        row.addEventListener('mouseenter', () => {
            const src = row.getAttribute('data-img');
            if (src) img.src = src;
            hover.classList.add('is-visible');
            if (!raf) loop();
        });
        row.addEventListener('mousemove', (e) => {
            targetX = e.clientX;
            targetY = e.clientY;
        });
        row.addEventListener('mouseleave', () => {
            hover.classList.remove('is-visible');
            if (raf) { cancelAnimationFrame(raf); raf = null; }
        });
    });
})();

/* ---------- Topbar scrolled state ---------- */
(function () {
    const bar = document.getElementById('topbar');
    if (!bar) return;
    const onScroll = () => bar.classList.toggle('is-scrolled', window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
})();

/* ---------- Confetti on resume download ---------- */
function triggerConfetti(button) {
    if (typeof confetti !== 'function') return;
    const rect = button.getBoundingClientRect();
    const originX = (rect.left + rect.width / 2) / window.innerWidth;
    const originY = rect.top / window.innerHeight;

    const count = 500;
    const defaults = {
        origin: { x: originX, y: originY },
        spread: 180,
        ticks: 300,
        gravity: 2.5,
        decay: 0.94,
        startVelocity: 15,
        colors: ['#7B8CDE', '#E0A44A', '#F4EEE2', '#9AA8E8', '#EEC079'],
        shapes: ['square', 'circle']
    };
    const fire = (ratio, opts) => confetti(Object.assign({}, defaults, opts, { particleCount: Math.floor(count * ratio) }));
    fire(0.25, { spread: 20, startVelocity: 25 });
    fire(0.2, { spread: 40, startVelocity: 20 });
    fire(0.35, { spread: 60, startVelocity: 30, decay: 0.98 });
    fire(0.1, { spread: 80, startVelocity: 15, decay: 0.98 });
    fire(0.1, { spread: 80, startVelocity: 25, decay: 0.98 });
}

/* ---------- 2D logo faces + extruded 3D backend ---------- */
(function () {
    const field = document.getElementById('tri-field');
    const hero = document.querySelector('.hero');
    const logoStage = document.getElementById('hero-logo-stage');
    if (!field || !hero || typeof THREE === 'undefined') return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const compact = window.matchMedia('(max-width: 700px)').matches;
    const noHeroTurn = compact || window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(hover: none)').matches;
    const LOGO_SRC = 'images/Me/Menes_Logo.png';
    const DEPTH = 0.18;

    function isLight() {
        return document.documentElement.getAttribute('data-theme') === 'light';
    }

    function readPixels(img) {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        return { w, h, data: ctx.getImageData(0, 0, w, h).data };
    }

    function makeMask(pixels, thresh) {
        const { w, h, data } = pixels;
        const mask = new Uint8Array(w * h);
        for (let i = 0; i < mask.length; i++) mask[i] = data[i * 4 + 3] > thresh ? 1 : 0;
        return mask;
    }

    function traceContour(mask, w, h, sx, sy) {
        const dirs = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
        const pts = [];
        let x = sx;
        let y = sy;
        let dir = 4;
        for (let step = 0; step < w * h; step++) {
            pts.push([x, y]);
            let found = false;
            for (let i = 0; i < 8; i++) {
                const d = (dir + i) % 8;
                const nx = x + dirs[d][0];
                const ny = y + dirs[d][1];
                if (nx >= 0 && ny >= 0 && nx < w && ny < h && mask[ny * w + nx]) {
                    dir = (d + 6) % 8;
                    x = nx;
                    y = ny;
                    found = true;
                    break;
                }
            }
            if (!found) break;
            if (step && x === sx && y === sy) break;
        }
        return pts;
    }

    function findStart(mask, w, h) {
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                if (mask[y * w + x]) return [x, y];
            }
        }
        return null;
    }

    function findHoleStart(mask, w, h) {
        const cx = Math.floor(w / 2);
        const cy = Math.floor(h / 2);
        if (mask[cy * w + cx]) return null;
        for (let x = cx; x < w; x++) {
            if (mask[cy * w + x]) return [x, cy];
        }
        return null;
    }

    function signedArea(pts) {
        let a = 0;
        for (let i = 0; i < pts.length; i++) {
            const p = pts[i];
            const q = pts[(i + 1) % pts.length];
            a += p[0] * q[1] - q[0] * p[1];
        }
        return a;
    }

    function toShapePoints(contour, w, h, wantCCW) {
        const s = 1 / Math.max(w, h);
        const pts = contour.map((p) => new THREE.Vector2((p[0] - w / 2) * s, -(p[1] - h / 2) * s));
        const area = signedArea(pts.map((p) => [p.x, p.y]));
        if ((area > 0) !== wantCCW) pts.reverse();
        return pts;
    }

    function solidUV(pixels, x, y) {
        const { w, h, data } = pixels;
        const len = Math.hypot(x, y) || 1;
        const sign = len > 0.22 ? -1 : 1;
        for (let step = 2; step <= 20; step++) {
            const ix = x + (x / len) * sign * step * 0.008;
            const iy = y + (y / len) * sign * step * 0.008;
            const px = Math.round(ix * w + w / 2);
            const py = Math.round(-iy * h + h / 2);
            if (px < 0 || py < 0 || px >= w || py >= h) continue;
            if (data[(py * w + px) * 4 + 3] > 200) return [ix + 0.5, iy + 0.5];
        }
        return [x + 0.5, y + 0.5];
    }

    function splitCapsAndSides(geo, pixels) {
        const pos = geo.getAttribute('position');
        const sidePos = [];
        const sideUv = [];
        const capPos = [];
        const capUv = [];
        for (let i = 0; i < pos.count; i += 3) {
            const z0 = pos.getZ(i);
            const z1 = pos.getZ(i + 1);
            const z2 = pos.getZ(i + 2);
            const cap = Math.abs(z0 - z1) < 1e-5 && Math.abs(z0 - z2) < 1e-5;
            const destPos = cap ? capPos : sidePos;
            const destUv = cap ? capUv : sideUv;
            for (let k = 0; k < 3; k++) {
                const x = pos.getX(i + k);
                const y = pos.getY(i + k);
                destPos.push(x, y, pos.getZ(i + k));
                if (cap) destUv.push(x + 0.5, y + 0.5);
                else {
                    const uv = solidUV(pixels, x, y);
                    destUv.push(uv[0], uv[1]);
                }
            }
        }
        function make(p, u) {
            const g = new THREE.BufferGeometry();
            g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
            g.setAttribute('uv', new THREE.Float32BufferAttribute(u, 2));
            g.computeVertexNormals();
            return g;
        }
        geo.dispose();
        return { sideGeo: make(sidePos, sideUv), capGeo: make(capPos, capUv) };
    }

    function makeRingGeometry(outer, hole, pixels) {
        const { w, h } = pixels;
        const shape = new THREE.Shape(toShapePoints(outer, w, h, true));
        shape.holes.push(new THREE.Path(toShapePoints(hole, w, h, false)));
        const geo = new THREE.ExtrudeGeometry(shape, {
            depth: DEPTH,
            steps: 1,
            bevelEnabled: false,
            curveSegments: 1
        });
        geo.translate(0, 0, -DEPTH / 2);
        return splitCapsAndSides(geo, pixels);
    }

    function makeOpaqueSideTexture(pixels) {
        const { w, h, data } = pixels;
        let r = 0;
        let g = 0;
        let b = 0;
        let n = 0;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 200) {
                r += data[i];
                g += data[i + 1];
                b += data[i + 2];
                n += 1;
            }
        }
        const ar = Math.round(r / Math.max(n, 1));
        const ag = Math.round(g / Math.max(n, 1));
        const ab = Math.round(b / Math.max(n, 1));
        const out = new Uint8ClampedArray(w * h * 4);
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 40) {
                out[i] = data[i];
                out[i + 1] = data[i + 1];
                out[i + 2] = data[i + 2];
            } else {
                out[i] = ar;
                out[i + 1] = ag;
                out[i + 2] = ab;
            }
            out[i + 3] = 255;
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').putImageData(new ImageData(out, w, h), 0, 0);
        const tex = new THREE.Texture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        tex.minFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        return tex;
    }

    function makeLogoAssets(img) {
        const pixels = readPixels(img);
        const mask = makeMask(pixels, 40);
        const start = findStart(mask, pixels.w, pixels.h);
        const holeStart = findHoleStart(mask, pixels.w, pixels.h);
        if (!start || !holeStart) return null;
        const outer = traceContour(mask, pixels.w, pixels.h, start[0], start[1]);
        const hole = traceContour(mask, pixels.w, pixels.h, holeStart[0], holeStart[1]);
        if (outer.length < 20 || hole.length < 20) return null;

        const tex = new THREE.Texture(img);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        tex.minFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        const { sideGeo, capGeo } = makeRingGeometry(outer, hole, pixels);
        return { sideGeo, capGeo, tex, sideTex: makeOpaqueSideTexture(pixels) };
    }

    function makeFaceMaterial(tex, opacity) {
        return new THREE.MeshBasicMaterial({
            map: tex,
            color: 0xffffff,
            transparent: true,
            opacity,
            alphaTest: 0.08,
            depthWrite: true,
            toneMapped: false,
            premultipliedAlpha: false,
            side: THREE.DoubleSide
        });
    }

    function makeSideMaterial(tex) {
        return new THREE.MeshBasicMaterial({
            map: tex,
            color: 0xffffff,
            transparent: false,
            opacity: 1,
            alphaTest: 0,
            depthWrite: true,
            toneMapped: false,
            side: THREE.DoubleSide
        });
    }

    function makeLogoGroup(assets, faceOpacity) {
        const side = makeSideMaterial(assets.sideTex);
        const face = makeFaceMaterial(assets.tex, faceOpacity);
        const group = new THREE.Group();
        group.add(new THREE.Mesh(assets.sideGeo, side));
        group.add(new THREE.Mesh(assets.capGeo, face));
        return { group, side, face };
    }

    function boot(img) {
        const fieldRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, premultipliedAlpha: false });
        fieldRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        fieldRenderer.setClearColor(0x000000, 0);
        fieldRenderer.outputColorSpace = THREE.SRGBColorSpace;
        fieldRenderer.toneMapping = THREE.NoToneMapping;
        fieldRenderer.domElement.className = 'tri-field__canvas';
        field.appendChild(fieldRenderer.domElement);

        const assets = makeLogoAssets(img);
        if (!assets) return;

        const fieldScene = new THREE.Scene();
        const fieldCamera = new THREE.PerspectiveCamera(38, 1, 10, 5000);
        const geoSize = { x: 1 };

        const LAYOUT = [
            { x: 0.07, y: 0.16, size: 86, opacity: 0.92, depth: 0.45, rot: -12 },
            { x: 0.78, y: 0.09, size: 124, opacity: 0.78, depth: 0.95, rot: 18 },
            { x: 0.88, y: 0.40, size: 64, opacity: 0.94, depth: 0.55, rot: -8 },
            { x: 0.04, y: 0.56, size: 52, opacity: 0.88, depth: 0.7, rot: 22 },
            { x: 0.70, y: 0.66, size: 102, opacity: 0.74, depth: 1.05, rot: -16 },
            { x: 0.17, y: 0.78, size: 70, opacity: 0.86, depth: 0.4, rot: 10 },
            { x: 0.91, y: 0.80, size: 46, opacity: 0.95, depth: 0.62, rot: -20 },
            { x: 0.41, y: 0.07, size: 40, opacity: 0.9, depth: 0.85, rot: 6 },
            { x: 0.53, y: 0.88, size: 90, opacity: 0.7, depth: 0.5, rot: 14 },
            { x: 0.27, y: 0.36, size: 36, opacity: 0.84, depth: 1.15, rot: -4 },
            { x: 0.94, y: 0.20, size: 32, opacity: 0.96, depth: 0.32, rot: 26 }
        ];

        const specs = compact ? LAYOUT.filter((_, i) => i % 2 === 0) : LAYOUT;
        const items = specs.map((spec, i) => {
            const made = makeLogoGroup(assets, 1);
            const heading = (i * 2.1 + spec.rot) * (Math.PI / 180);
            const speed = 48 + (i % 5) * 14 + spec.depth * 12;
            fieldScene.add(made.group);
            return {
                spec,
                mesh: made.group,
                face: made.face,
                side: made.side,
                x: spec.x,
                y: spec.y,
                vx: Math.cos(heading) * speed,
                vy: Math.sin(heading) * speed,
                reactX: 0,
                reactY: 0,
                flickX: 0,
                flickY: 0
            };
        });

        const heroMade = makeLogoGroup(assets, 1);
        const heroMesh = heroMade.group;
        fieldScene.add(heroMesh);

    let vw = 1;
    let vh = 1;
    function resize() {
        vw = field.clientWidth || window.innerWidth;
        vh = field.clientHeight || window.innerHeight;
        fieldRenderer.setSize(vw, vh, false);
        fieldCamera.aspect = vw / Math.max(vh, 1);
        const dist = (vh / 2) / Math.tan((fieldCamera.fov * Math.PI / 180) / 2);
        fieldCamera.position.set(vw / 2, vh / 2, dist);
        fieldCamera.lookAt(vw / 2, vh / 2, 0);
        fieldCamera.near = 10;
        fieldCamera.far = dist + 2000;
        fieldCamera.updateProjectionMatrix();
    }

    function applyTheme() {
        items.forEach((item) => {
            item.face.opacity = 1;
            item.side.opacity = 1;
        });
        heroMade.face.opacity = 1;
        heroMade.side.opacity = 1;
    }

    let mx = 0.5;
    let my = 0.5;
    let px = 0.5;
    let py = 0.5;
    let smx = 0.5;
    let smy = 0.5;
    let heroLookX = 0;
    let heroLookY = 0;
    let mouseAmt = 0;
    let targetMouse = 0;
    let lastMove = 0;
    let targetTurn = 0;
    let turn = 0;
    let lastT = performance.now();

    function easeInOut(t) {
        return t * t * (3 - 2 * t);
    }

    function measureTurn() {
        const sections = document.querySelectorAll('main > section');
        if (!sections.length) {
            targetTurn = 0;
            return;
        }
        const y = window.scrollY;
        const starts = Array.from(sections, (el) => el.getBoundingClientRect().top + window.scrollY);
        if (y <= starts[0]) {
            targetTurn = 0;
            return;
        }
        for (let i = 0; i < starts.length - 1; i++) {
            if (y < starts[i + 1]) {
                const t = (y - starts[i]) / Math.max(starts[i + 1] - starts[i], 1);
                targetTurn = (i + easeInOut(Math.min(1, Math.max(0, t)))) * Math.PI;
                return;
            }
        }
        targetTurn = (starts.length - 1) * Math.PI;
    }

    function wrap(item) {
        const pad = item.spec.size * 0.8 / Math.min(vw, vh);
        if (item.x > 1 + pad) item.x = -pad;
        if (item.x < -pad) item.x = 1 + pad;
        if (item.y > 1 + pad) item.y = -pad;
        if (item.y < -pad) item.y = 1 + pad;
    }

    resize();
    measureTurn();
    applyTheme();

    new MutationObserver(applyTheme).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
    });
    window.addEventListener('resize', () => { resize(); measureTurn(); }, { passive: true });
    window.addEventListener('scroll', measureTurn, { passive: true });

    let lastScrollAt = 0;
    window.addEventListener('scroll', () => { lastScrollAt = performance.now(); }, { passive: true });

    function onPointer(e) {
        if (!vw || !vh) return;
        mx = e.clientX / vw;
        my = e.clientY / vh;
        const scrolling = performance.now() - lastScrollAt < 160;
        if (e.pointerType === 'mouse' || (e.pointerType === 'touch' && !scrolling)) {
            lastMove = performance.now();
            targetMouse = 1;
        }
    }

    window.addEventListener('pointerdown', onPointer, { passive: true });
    window.addEventListener('pointermove', onPointer, { passive: true });

    function frame(now) {
        try {
        const dt = Math.min(0.05, (now - lastT) / 1000);
        lastT = now;

        if (now - lastMove > 380) targetMouse = 0;
        mouseAmt += (targetMouse - mouseAmt) * (targetMouse ? 0.18 : 0.045);
        smx += (mx - smx) * 0.1;
        smy += (my - smy) * 0.1;
        const velX = mx - px;
        const velY = my - py;
        px = mx;
        py = my;
        turn += (targetTurn - turn) * 0.1;
        const idle = 1 - mouseAmt;

        items.forEach((item) => {
            item.x += (item.vx / vw) * dt * idle;
            item.y += (item.vy / vh) * dt * idle;
            wrap(item);

            const depth = item.spec.depth;
            const parX = (smx - 0.5) * 2 * 120 * depth;
            const parY = (smy - 0.5) * 2 * 90 * depth;
            const dx = (item.x - smx) * vw;
            const dy = (item.y - smy) * vh;
            const dist = Math.hypot(dx, dy) + 36;
            const push = mouseAmt * 4200 * depth / dist;
            const targetReactX = mouseAmt * (parX + (dx / dist) * push);
            const targetReactY = mouseAmt * (parY + (dy / dist) * push);
            item.reactX += (targetReactX - item.reactX) * 0.16;
            item.reactY += (targetReactY - item.reactY) * 0.16;
            item.flickX += (velX * vw * 1.15 * depth * mouseAmt - item.flickX) * 0.22;
            item.flickY += (velY * vh * 1.15 * depth * mouseAmt - item.flickY) * 0.22;

            const scale = item.spec.size / geoSize.x;
            item.mesh.scale.setScalar(scale);
            item.mesh.position.set(
                item.x * vw + item.reactX + item.flickX,
                vh - (item.y * vh + item.reactY + item.flickY),
                depth * 40
            );
            item.mesh.rotation.set(
                turn,
                noHeroTurn ? 0 : mouseAmt * (smx - 0.5) * 0.9 * depth,
                item.spec.rot * Math.PI / 180
            );
        });

        if (logoStage) {
            const r = logoStage.getBoundingClientRect();
            const onscreen = r.width > 2 && r.bottom > 0 && r.top < vh;
            heroMesh.visible = onscreen;
            if (onscreen) {
                const hx = r.left + r.width / 2;
                const hy = r.top + r.height / 2;
                heroMesh.scale.setScalar(r.width / geoSize.x);
                heroMesh.position.set(hx, vh - hy, 90);
                if (noHeroTurn) {
                    heroLookX = 0;
                    heroLookY = 0;
                    heroMesh.rotation.set(0, 0, 0);
                } else {
                    const targetLookY = Math.max(-0.22, Math.min(0.22, Math.atan2(mx * vw - hx, 1500)));
                    const targetLookX = Math.max(-0.16, Math.min(0.16, Math.atan2(-(my * vh - hy), 1700)));
                    heroLookY += (targetLookY - heroLookY) * 0.05;
                    heroLookX += (targetLookX - heroLookX) * 0.05;
                    heroMesh.rotation.set(turn + heroLookX, heroLookY, 0);
                }
            }
        }

        fieldRenderer.render(fieldScene, fieldCamera);

        if (!reduceMotion) requestAnimationFrame(frame);
        } catch (err) {
            console.warn(err);
        }
    }

    if (reduceMotion) {
        items.forEach((item) => {
            const scale = item.spec.size / geoSize.x;
            item.mesh.scale.setScalar(scale);
            item.mesh.position.set(item.x * vw, vh - item.y * vh, 0);
            item.mesh.rotation.set(targetTurn, 0, item.spec.rot * Math.PI / 180);
        });
        if (logoStage) {
            const r = logoStage.getBoundingClientRect();
            heroMesh.scale.setScalar(r.width / geoSize.x);
            heroMesh.position.set(r.left + r.width / 2, vh - (r.top + r.height / 2), 90);
            heroMesh.rotation.x = noHeroTurn ? 0 : targetTurn;
        }
        fieldRenderer.render(fieldScene, fieldCamera);
        return;
    }

    frame(performance.now());
    }

    const img = new Image();
    img.onload = () => boot(img);
    img.src = LOGO_SRC;
})();

document.addEventListener('DOMContentLoaded', () => {
    const resumeButton = document.querySelector('a[download].hero-resume-btn');
    if (resumeButton) {
        resumeButton.addEventListener('click', () => triggerConfetti(resumeButton));
    }

    /* Testimonials carousel */
    if (typeof Swiper === 'function') {
        new Swiper('.testimonials-carousel', {
            slidesPerView: 1,
            spaceBetween: 40,
            loop: true,
            autoHeight: true,
            autoplay: { delay: 24000, disableOnInteraction: false, pauseOnMouseEnter: true },
            pagination: { el: '.swiper-pagination', clickable: true },
            navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }
        });
    }
});
