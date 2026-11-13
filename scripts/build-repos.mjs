// Genera repos.json con los repos públicos y la descripción de cada README.
// Lo corre la GitHub Action (.github/workflows/pages.yml); localmente: node scripts/build-repos.mjs
import { writeFileSync } from "node:fs";

const USER = "ladrillopastabase";
const EXCLUDE = ["ladrillopastabase.github.io", "ladrillopastabasee.github.io"];
const headers = { "User-Agent": "portfolio-build" };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

// Título (# ...) y primer párrafo del README, sin markdown.
export function parseReadme(md) {
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

const res = await fetch(`https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed`, { headers });
if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
const repos = (await res.json()).filter((r) => !r.fork && !r.archived && !EXCLUDE.includes(r.name));

const data = await Promise.all(repos.map(async (r) => {
    let readme = { title: "", desc: "" };
    const rr = await fetch(`https://api.github.com/repos/${r.full_name}/readme`, { headers: { ...headers, Accept: "application/vnd.github.raw" } });
    if (rr.ok) readme = parseReadme(await rr.text());
    return {
        title: readme.title || r.name.replace(/[-_]/g, " "),
        desc: r.description || readme.desc,
        url: r.html_url,
        demo: r.homepage || (r.has_pages ? `https://${USER}.github.io/${r.name}/` : ""),
        lang: r.language,
        created: r.created_at,
        pushed: r.pushed_at,
    };
}));

writeFileSync("repos.json", JSON.stringify(data, null, 2));
console.log(`repos.json: ${data.length} repos`);
