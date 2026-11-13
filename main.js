// Configuración: pega aquí tu URL de LinkedIn cuando la tengas.
const LINKEDIN_URL = "";
const GH_USER = "ladrillopastabase";
const EXCLUDE = ["ladrillopastabase.github.io", "ladrillopastabasee.github.io"];

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

document.documentElement.classList.add("js");
$("#year").textContent = new Date().getFullYear();
$$(".enter").forEach((el, i) => el.style.setProperty("--n", i));
$$(".stats dd").forEach((d) => d.classList.add("pending"));

/* Toast */
let toastTimer;
function toast(msg) {
    const t = $(".toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

/* LinkedIn / CV */
$$("[data-linkedin]").forEach((a) => {
    if (LINKEDIN_URL) {
        Object.assign(a, { href: LINKEDIN_URL, target: "_blank", rel: "noopener" });
    } else {
        a.setAttribute("aria-disabled", "true");
        a.addEventListener("click", (e) => { e.preventDefault(); toast("El CV estará disponible muy pronto"); });
    }
});

/* Copiar email */
$$("[data-copy]").forEach((b) => b.addEventListener("click", async () => {
    try {
        await navigator.clipboard.writeText(b.dataset.copy);
        toast("Email copiado");
    } catch {
        location.href = "mailto:" + b.dataset.copy;
    }
}));

/* Secciones: aparecen una vez */
const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); revealIO.unobserve(e.target); }
    });
}, { rootMargin: "0px 0px -10% 0px" });
$$(".reveal").forEach((el) => revealIO.observe(el));

/* Indicador deslizante de la navegación */
const navLinks = $$(".nav nav a");
const indicator = $(".indicator");
function moveIndicator(a) {
    if (!a) { indicator.style.opacity = 0; return; }
    indicator.style.setProperty("--ix", a.offsetLeft + "px");
    indicator.style.setProperty("--iw", a.offsetWidth + "px");
    indicator.style.opacity = 1;
}
let current = null;
const navIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
        if (!e.isIntersecting) return;
        current = navLinks.find((a) => a.hash === "#" + e.target.id) || null;
        navLinks.forEach((a) => a.classList.toggle("active", a === current));
        moveIndicator(current);
    });
}, { rootMargin: "-40% 0px -55% 0px" });
["inicio", "industria", "github", "contacto"].forEach((id) => navIO.observe(document.getElementById(id)));
navLinks.forEach((a) => a.addEventListener("pointerenter", () => moveIndicator(a)));
$(".nav nav").addEventListener("pointerleave", () => moveIndicator(current));
addEventListener("resize", () => moveIndicator(current));

/* Reflejo del vidrio siguiendo al puntero */
if (!reduceMotion) {
    document.addEventListener("pointermove", (e) => {
        const el = e.target.closest(".sheen");
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--x", e.clientX - r.left + "px");
        el.style.setProperty("--y", e.clientY - r.top + "px");
    }, { passive: true });
}

/* ---------- GitHub: repos + README, se actualiza solo ---------- */
const LANG_COLORS = { JavaScript: "#e9c400", TypeScript: "#3178c6", Python: "#3572a5", HTML: "#e34c26", CSS: "#663399", Java: "#b07219" };
const CACHE_KEY = "gh-portfolio-v2";
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
    let title = "", para = [];
    for (const line of md.replace(/\r/g, "").split("\n")) {
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

function readCache(maxAge) {
    try {
        const c = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
        if (c && Date.now() - c.t < maxAge) return c.data;
    } catch {}
    return null;
}

async function loadRepos() {
    const cached = readCache(CACHE_MS);
    if (cached) return cached;
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
                title: readme.title || r.name.replace(/[-_]/g, " "),
                desc: r.description || readme.desc,
                url: r.html_url,
                demo: r.homepage || (r.has_pages ? `https://${GH_USER}.github.io/${r.name}/` : ""),
                lang: r.language,
                created: r.created_at,
                pushed: r.pushed_at,
            };
        }));
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), data })); } catch {}
        return data;
    } catch (err) {
        const stale = readCache(Infinity);
        if (stale) return stale;
        throw err;
    }
}

function timeAgo(iso) {
    const d = Math.floor((Date.now() - new Date(iso)) / 86400000);
    if (d < 1) return "hoy";
    if (d === 1) return "ayer";
    if (d < 30) return `hace ${d} días`;
    const m = Math.floor(d / 30);
    if (m < 12) return `hace ${m} ${m === 1 ? "mes" : "meses"}`;
    const y = Math.floor(m / 12);
    return `hace ${y} ${y === 1 ? "año" : "años"}`;
}

const ARROW = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M8 7h9v9"/></svg>`;

function renderRepos(repos) {
    repos.sort((a, b) => new Date(b.pushed) - new Date(a.pushed));
    const list = $("#repos");
    if (!repos.length) {
        list.innerHTML = `<li class="repos-msg">Todavía no hay repositorios públicos.</li>`;
        return;
    }
    list.innerHTML = repos.map((r, i) => {
        const isNew = Date.now() - new Date(r.created) < 30 * 86400000;
        return `
        <li class="repo arrive" style="--n:${i}">
            <div class="repo-title">
                <h3>${esc(r.title)}</h3>
                ${isNew ? `<span class="new">Nuevo</span>` : ""}
            </div>
            <p>${esc(r.desc || "Proyecto en desarrollo. Revisa el repositorio para más detalles.")}</p>
            <div class="meta">
                ${r.lang ? `<span><i class="dot" style="--c:${LANG_COLORS[r.lang] || "#8a93ad"}"></i>${esc(r.lang)}</span>` : ""}
                <span>Actualizado ${timeAgo(r.pushed)}</span>
            </div>
            <div class="links">
                ${r.demo ? `<a class="btn btn-ink btn-sm" href="${esc(r.demo)}" target="_blank" rel="noopener">Abrir demo ${ARROW}</a>` : ""}
                <a class="btn btn-glass btn-sm" href="${esc(r.url)}" target="_blank" rel="noopener">Código</a>
            </div>
        </li>`;
    }).join("");

    const last = repos[0].pushed;
    $$(".stats dd").forEach((d) => d.classList.remove("pending"));
    $('[data-stat="repos"]').textContent = repos.length;
    $('[data-stat="pages"]').textContent = repos.filter((r) => r.demo).length;
    $('[data-stat="last"]').textContent = timeAgo(last);
}

loadRepos().then(renderRepos).catch(() => {
    $("#repos").innerHTML = `<li class="repos-msg">No se pudieron cargar los repositorios ahora mismo. <a href="https://github.com/${GH_USER}" target="_blank" rel="noopener">Míralos directamente en GitHub</a>.</li>`;
});
