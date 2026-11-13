// Configuración: pega aquí tu URL de LinkedIn cuando la tengas.
const LINKEDIN_URL = "";
const GH_USER = "ladrillopastabase";
const EXCLUDE = ["ladrillopastabasee.github.io", "ladrillopastabase.github.io"];

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(pointer: fine)").matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

document.getElementById("year").textContent = new Date().getFullYear();

/* LinkedIn / CV */
$$("[data-linkedin]").forEach((a) => {
    if (LINKEDIN_URL) {
        a.href = LINKEDIN_URL;
        a.target = "_blank";
        a.rel = "noopener";
    } else {
        a.setAttribute("aria-disabled", "true");
        a.title = "Próximamente";
        a.addEventListener("click", (e) => { e.preventDefault(); toast("El CV estará disponible pronto"); });
    }
});

/* Copiar email */
let toastTimer;
function toast(msg) {
    const t = $(".toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}
$$("[data-copy]").forEach((b) => b.addEventListener("click", async () => {
    try {
        await navigator.clipboard.writeText(b.dataset.copy);
        toast("Email copiado");
    } catch {
        location.href = "mailto:" + b.dataset.copy;
    }
}));

/* Partir títulos en palabras para la entrada escalonada */
$$(".split").forEach((el) => {
    let i = 0;
    const wrap = (node) => {
        const s = document.createElement("span");
        s.className = "w";
        s.style.setProperty("--i", i++);
        return s;
    };
    [...el.childNodes].forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            const frag = document.createDocumentFragment();
            node.textContent.split(/(\s+)/).forEach((part) => {
                if (!part) return;
                if (/^\s+$/.test(part)) return frag.append(" ");
                const s = wrap();
                s.textContent = part;
                frag.append(s);
            });
            node.replaceWith(frag);
        } else {
            const s = wrap();
            node.replaceWith(s);
            s.append(node);
        }
    });
});

/* Revelado al hacer scroll */
const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
        if (e.target.dataset.stat) countUp(e.target);
    });
}, { threshold: 0.15 });

function observe(root = document) {
    $$("[data-reveal], .split, .titular-proyectos, [data-stat]", root).forEach((el) => {
        if (el.hasAttribute("data-reveal")) {
            const sibs = [...el.parentElement.children].filter((c) => c.hasAttribute("data-reveal"));
            el.style.setProperty("--d", sibs.indexOf(el) * 110 + "ms");
        }
        io.observe(el);
    });
}
observe();

/* Barra de progreso + nav activa */
addEventListener("scroll", () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    document.documentElement.style.setProperty("--p", max > 0 ? scrollY / max : 0);
}, { passive: true });

const navIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
        if (!e.isIntersecting) return;
        $$(".nav-link").forEach((a) => a.classList.toggle("active", a.hash === "#" + e.target.id));
    });
}, { rootMargin: "-45% 0px -50% 0px" });
["inicio", "proyectos", "github", "contacto"].forEach((id) => navIO.observe(document.getElementById(id)));

/* Tilt con foco de luz y botones magnéticos (solo con mouse) */
if (finePointer && !reduceMotion) {
    document.addEventListener("pointermove", (e) => {
        const card = e.target.closest(".tilt");
        if (card) {
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width;
            const y = (e.clientY - r.top) / r.height;
            card.style.setProperty("--ry", (x - 0.5) * 10 + "deg");
            card.style.setProperty("--rx", (0.5 - y) * 10 + "deg");
            card.style.setProperty("--gx", x * 100 + "%");
            card.style.setProperty("--gy", y * 100 + "%");
        }
        const btn = e.target.closest(".magnetic");
        if (btn) {
            const r = btn.getBoundingClientRect();
            btn.style.setProperty("--mx", (e.clientX - r.left - r.width / 2) * 0.25 + "px");
            btn.style.setProperty("--my", (e.clientY - r.top - r.height / 2) * 0.35 + "px");
        }
    });
    document.addEventListener("pointerout", (e) => {
        const card = e.target.closest(".tilt");
        if (card && !card.contains(e.relatedTarget)) {
            card.style.setProperty("--rx", "0deg");
            card.style.setProperty("--ry", "0deg");
        }
        const btn = e.target.closest(".magnetic");
        if (btn && !btn.contains(e.relatedTarget)) {
            btn.style.setProperty("--mx", "0px");
            btn.style.setProperty("--my", "0px");
        }
    });
}

/* Contadores */
function countUp(el) {
    const to = Number(el.dataset.value || 0);
    if (reduceMotion) return (el.textContent = to);
    const t0 = performance.now();
    const dur = 1600;
    const step = (t) => {
        const k = Math.min(1, (t - t0) / dur);
        el.textContent = Math.round(to * (1 - Math.pow(2, -10 * k)));
        if (k < 1) requestAnimationFrame(step);
        else el.textContent = to;
    };
    requestAnimationFrame(step);
}
function setStat(name, value) {
    const el = $(`[data-stat="${name}"]`);
    el.dataset.value = value;
    if (el.classList.contains("is-in")) countUp(el);
}

/* Marquee */
function fillLane(id, words) {
    const track = document.getElementById(id);
    const set = words.map((w) => `<span>${esc(w)}</span>`).join("");
    track.innerHTML = set.repeat(4);
}
const INDUSTRY = ["Mantenimiento", "Mejora Continua", "Optimización de costos", "5S", "Análisis de procesos", "Eficiencia"];
fillLane("laneIndustry", INDUSTRY);
fillLane("laneCode", ["JavaScript", "Python", "HTML", "CSS", "GitHub Pages", "Juegos web"]);

/* Fondo animado: manchas de color que derivan y siguen al cursor */
(() => {
    const canvas = $("#bgCanvas");
    const ctx = canvas.getContext("2d");
    const colors = [[255, 176, 32], [46, 230, 255], [255, 79, 139], [46, 230, 255], [120, 90, 255]];
    let w, h, dpr;
    const mouse = { x: innerWidth * 0.7, y: innerHeight * 0.3, tx: innerWidth * 0.7, ty: innerHeight * 0.3 };
    const resize = () => {
        dpr = Math.min(devicePixelRatio || 1, 1.5);
        w = canvas.width = innerWidth * dpr * 0.5;
        h = canvas.height = innerHeight * dpr * 0.5;
    };
    resize();
    addEventListener("resize", resize);
    addEventListener("pointermove", (e) => { mouse.tx = e.clientX; mouse.ty = e.clientY; });

    const blobs = colors.map((c, i) => ({
        c, x: Math.random() * w, y: Math.random() * h,
        r: (0.35 + Math.random() * 0.25) * Math.max(w, h),
        a: Math.random() * Math.PI * 2, s: 0.0015 + Math.random() * 0.002, o: i,
    }));

    const draw = (t) => {
        ctx.fillStyle = "#070b1a";
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "lighter";
        blobs.forEach((b) => {
            b.a += b.s;
            const x = w * 0.5 + Math.cos(b.a + b.o) * w * 0.38;
            const y = h * 0.5 + Math.sin(b.a * 1.3 + b.o) * h * 0.38;
            const g = ctx.createRadialGradient(x, y, 0, x, y, b.r);
            g.addColorStop(0, `rgba(${b.c},0.16)`);
            g.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);
        });
        mouse.x += (mouse.tx - mouse.x) * 0.06;
        mouse.y += (mouse.ty - mouse.y) * 0.06;
        const mx = mouse.x * dpr * 0.5, my = mouse.y * dpr * 0.5;
        const g = ctx.createRadialGradient(mx, my, 0, mx, my, Math.max(w, h) * 0.25);
        g.addColorStop(0, "rgba(255,176,32,0.14)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "source-over";
        if (!reduceMotion && !document.hidden) requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
    document.addEventListener("visibilitychange", () => { if (!document.hidden && !reduceMotion) requestAnimationFrame(draw); });
})();

/* ---------- GitHub: repos + README, se actualiza solo ---------- */
const LANG_COLORS = { JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5", HTML: "#e34c26", CSS: "#663399", Java: "#b07219", "C++": "#f34b7d", C: "#555555" };
const CACHE_KEY = "gh-portfolio-v1";
const CACHE_MS = 30 * 60 * 1000;

function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Título (# ...) y primer párrafo del README, sin markdown.
function parseReadme(md) {
    const clean = (s) => s
        .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/<[^>]+>/g, "")
        .replace(/(\*\*|__|\*|_|`)/g, "")
        .replace(/^[^\p{L}\p{N}¿¡]+|[^\p{L}\p{N}.!?)]+$/gu, "")
        .trim();
    const lines = md.replace(/\r/g, "").split("\n");
    let title = "", para = [];
    for (const line of lines) {
        const l = line.trim();
        if (!title && /^#\s+/.test(l)) { title = clean(l.replace(/^#\s+/, "")); continue; }
        if (!l || /^(#|\[!\[|!\[|<|```|[-*+]\s|\d+\.\s|>|\|)/.test(l)) {
            if (para.length) break;
            continue;
        }
        para.push(l);
    }
    return { title, desc: clean(para.join(" ")) };
}

async function loadRepos() {
    try {
        const c = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
        if (c && Date.now() - c.t < CACHE_MS) return c.data;
    } catch {}
    try {
        const res = await fetch(`https://api.github.com/users/${GH_USER}/repos?per_page=100&sort=pushed`);
        if (!res.ok) throw new Error(res.status);
        const repos = (await res.json()).filter((r) => !r.fork && !r.archived && !EXCLUDE.includes(r.name));
        const data = await Promise.all(repos.map(async (r) => {
            let readme = { title: "", desc: "" };
            try {
                const rr = await fetch(`https://api.github.com/repos/${r.full_name}/readme`, { headers: { Accept: "application/vnd.github.raw" } });
                if (rr.ok) readme = parseReadme(await rr.text());
            } catch {}
            return {
                name: r.name,
                title: readme.title || r.name.replace(/[-_]/g, " "),
                desc: r.description || readme.desc,
                url: r.html_url,
                demo: r.homepage || (r.has_pages ? `https://${GH_USER}.github.io/${r.name}/` : ""),
                lang: r.language,
                stars: r.stargazers_count,
                created: r.created_at,
                pushed: r.pushed_at,
            };
        }));
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), data })); } catch {}
        return data;
    } catch (err) {
        try {
            const c = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
            if (c) return c.data;
        } catch {}
        throw err;
    }
}

function timeAgo(iso) {
    const d = Math.floor((Date.now() - new Date(iso)) / 86400000);
    if (d < 1) return "hoy";
    if (d === 1) return "ayer";
    if (d < 30) return `hace ${d} días`;
    const m = Math.floor(d / 30);
    return m < 12 ? `hace ${m} ${m === 1 ? "mes" : "meses"}` : `hace ${Math.floor(m / 12)} año(s)`;
}

function renderRepos(repos) {
    repos.sort((a, b) => new Date(b.pushed) - new Date(a.pushed));
    const box = $("#repos");
    if (!repos.length) {
        box.innerHTML = `<p class="repos-error">Todavía no hay repositorios públicos.</p>`;
        return;
    }
    box.innerHTML = repos.map((r) => {
        const isNew = Date.now() - new Date(r.created) < 30 * 86400000;
        return `
        <article class="repo glass tilt" data-reveal>
            <div class="repo-head">
                <h3>${esc(r.title)}</h3>
                ${isNew ? `<span class="badge-new">Nuevo</span>` : ""}
            </div>
            <p>${esc(r.desc || "Proyecto en desarrollo. Revisa el repositorio para más detalles.")}</p>
            <div class="repo-meta">
                ${r.lang ? `<span><i class="lang-dot" style="--c:${LANG_COLORS[r.lang] || "#a3b0d4"}"></i>${esc(r.lang)}</span>` : ""}
                <span>Actualizado ${timeAgo(r.pushed)}</span>
                ${r.stars ? `<span>★ ${r.stars}</span>` : ""}
            </div>
            <div class="repo-links">
                ${r.demo ? `<a class="btn btn-primary magnetic" href="${esc(r.demo)}" target="_blank" rel="noopener">Abrir demo</a>` : ""}
                <a class="btn magnetic" href="${esc(r.url)}" target="_blank" rel="noopener">Código</a>
            </div>
        </article>`;
    }).join("");
    observe(box);

    const langs = [...new Set(repos.map((r) => r.lang).filter(Boolean))];
    const last = Math.max(...repos.map((r) => new Date(r.pushed)));
    setStat("repos", repos.length);
    setStat("pages", repos.filter((r) => r.demo).length);
    setStat("langs", langs.length);
    setStat("days", Math.max(0, Math.floor((Date.now() - last) / 86400000)));
    fillLane("laneCode", [...langs, "GitHub Pages", ...repos.map((r) => r.title)]);
}

loadRepos().then(renderRepos).catch(() => {
    $("#repos").innerHTML = `<p class="repos-error">No se pudieron cargar los repositorios ahora mismo. <a href="https://github.com/${GH_USER}" target="_blank" rel="noopener">Míralos directamente en GitHub</a>.</p>`;
});
