import { marked } from "marked";
import { about, posts } from "../content.ts";

const app = document.getElementById("app")!;

type Section = "" | "about" | "blog";

function route(): string {
  const hash = location.hash.slice(1);
  return hash === "" || hash === "/" ? "home" : hash.replace(/^\//, "");
}

function shell(active: Section, body: string): string {
  return `
    <main class="shell">
      <nav class="topbar">
        <a class="topbar-name" href="#/">contact@404simon.de</a>
        <div class="topbar-links">
          <a href="#/about" class="${active === "about" ? "active" : ""}">about</a>
          <a href="#/blog" class="${active === "blog" ? "active" : ""}">blog</a>
        </div>
      </nav>
      ${body}
    </main>
  `;
}

function page(active: Section, backHref: string, body: string): string {
  return shell(
    active,
    `<section class="page">
      <a class="back" href="${backHref}">← back</a>
      ${body}
    </section>`,
  );
}

function markdown(md: string): string {
  return marked.parse(md, { async: false });
}

export function render(): void {
  const r = route();
  if (r === "about") return renderAbout();
  if (r === "blog") return renderBlog();

  const slug = r.match(/^blog\/(.+)$/)?.[1];
  if (slug && posts.some((p) => p.slug === slug)) return renderPost(slug);

  renderHome();
}

function renderHome(): void {
  app.innerHTML = shell("", `
    <section class="hero">
      <p class="hero-tag">~/home</p>
      <h1 class="hero-title">Servus! Ich bin <span class="accent">Simon.</span></h1>
      <p class="hero-sub">
        Computer Science Masterstudent who runs his website as a terminal.
      </p>
      <div class="hero-actions">
        <a class="btn" href="#/about">About me</a>
        <a class="btn btn-ghost" href="/">Back to the terminal</a>
      </div>
    </section>
  `);
}

function renderAbout(): void {
  app.innerHTML = page(
    "about",
    "#/",
    `<article class="prose">${markdown(about)}</article>`,
  );
}

function renderBlog(): void {
  const items = posts
    .map((p) => `<li><a href="#/blog/${p.slug}">${p.title}</a></li>`)
    .join("");
  app.innerHTML = page(
    "blog",
    "#/",
    `<article class="prose"><h1>Blog</h1><ul>${items}</ul></article>`,
  );
}

function renderPost(slug: string): void {
  const post = posts.find((p) => p.slug === slug)!;
  const date = post.date ? `<p class="post-date">${post.date}</p>` : "";
  app.innerHTML = page(
    "blog",
    "#/blog",
    `<article class="prose">${date}${markdown(post.content)}</article>`,
  );
}
