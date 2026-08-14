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

    const prefix = 'Software ';
    const suffixes = ['Designer', 'Developer'];
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
    const nameEl = document.querySelector('.hero__line--name');
    if (!nameEl) return;

    const logoEl = nameEl.querySelector('.hero__logo');
    const text = nameEl.textContent.trim();
    nameEl.textContent = '';

    const wrap = document.createElement('span');
    wrap.className = 'hero-liquid';

    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);';
    sr.textContent = text;

    nameEl.appendChild(wrap);
    if (logoEl) nameEl.appendChild(logoEl);

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
        textCtx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--blue').trim() || '#7B8CDE';
        textCtx.textAlign = 'left';
        textCtx.textBaseline = 'alphabetic';
        if ('letterSpacing' in textCtx) textCtx.letterSpacing = cs.letterSpacing;
        if ('fontKerning' in textCtx) textCtx.fontKerning = cs.fontKerning || 'normal';

        const metrics = textCtx.measureText(text);
        const y = metrics.fontBoundingBoxAscent || parseFloat(cs.fontSize) * 0.8;
        textCtx.fillText(text, 0, y);

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
            autoplay: { delay: 12000, disableOnInteraction: false },
            pagination: { el: '.swiper-pagination', clickable: true },
            navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }
        });
    }
});
