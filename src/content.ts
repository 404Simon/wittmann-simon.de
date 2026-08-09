import aboutMd from "../content/about.md?raw";

const blogModules = import.meta.glob<string>("../content/blog/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

export interface Post {
  slug: string;
  title: string;
  date: string;
  content: string;
}

interface Frontmatter {
  title: string;
  date: string;
  body: string;
}

function parseFrontmatter(md: string): Frontmatter {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(md);
  if (!match) return { title: "", date: "", body: md };

  const data: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    data[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return {
    title: data.title ?? "",
    date: data.date ?? "",
    body: md.slice(match[0].length),
  };
}

function slugOf(path: string): string {
  return path.split("/").pop()!.replace(/\.md$/, "");
}

const entries = Object.entries(blogModules);

const sshKey =
  "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMiF2i/rAwQhsK9XCsUX0noZiL5i6miMYJ99fqvK6yCN\n";

export const about = aboutMd;

export const posts: Post[] = entries
  .map(([path, md]) => {
    const { title, date, body } = parseFrontmatter(md);
    return { slug: slugOf(path), title, date, content: body };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

export const files: Record<string, string> = {
  "/home/simon/about.md": about,
  "/home/simon/.ssh/id_ed25519.pub": sshKey,
  ...Object.fromEntries(
    entries.map(([path, md]) => [`/home/simon/blog/${slugOf(path)}.md`, md]),
  ),
};
