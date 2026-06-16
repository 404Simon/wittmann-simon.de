interface Dir {
  type: "dir";
  children: Record<string, Node>;
}

interface File {
  type: "file";
  content: string;
}

type Node = Dir | File;

function dir(children: Record<string, Node>): Dir {
  return { type: "dir", children };
}

function file(content: string): File {
  return { type: "file", content };
}

const root: Dir = dir({
  home: dir({
    simon: dir({
      "about.txt": file(
        "Computer Science Masterstudent"
      ),
      projects: dir({
        "coming-soon.md": file(
          "# projects\n" +
          "Working on it..."
        ),
      }),
      todo: file("- add cool stuff\n"),
    }),
  }),
  tmp: dir({}),
  var: dir({ log: dir({}) }),
  etc: dir({
    "passwd": file("")
  })
});

export function lookup(path: string): Node | undefined {
  const parts = path.replace(/^\/+/, "").split("/").filter(Boolean);
  let node: Node = root;
  if (path === "/") return root;
  for (const p of parts) {
    if (node.type !== "dir") return;
    node = node.children[p];
    if (!node) return;
  }
  return node;
}

export function readFile(path: string): string | undefined {
  const node = lookup(path);
  return node?.type === "file" ? node.content : undefined;
}

export function writeFile(path: string, content: string): boolean {
  const parts = path.replace(/^\/+/, "").split("/").filter(Boolean);
  const name = parts.pop()!;
  let node: Node = root;
  for (const p of parts) {
    if (node.type !== "dir") return false;
    node = node.children[p];
    if (!node) return false;
  }
  if (node.type !== "dir") return false;
  node.children[name] = file(content);
  return true;
}

export interface LSResult {
  name: string;
  type: "dir" | "file";
}

export function listDir(path: string): LSResult[] | undefined {
  const node = lookup(path);
  if (node?.type !== "dir") return;
  return Object.entries(node.children).map(([name, n]) => ({
    name,
    type: n.type,
  }));
}

export function resolvePath(cwd: string, raw: string): string {
  if (raw.startsWith("/")) return normalize(raw);
  return normalize(cwd + "/" + raw);
}

function normalize(path: string): string {
  const parts = path.split("/").filter(Boolean);
  const result: string[] = [];
  for (const p of parts) {
    if (p === ".") continue;
    if (p === "..") { result.pop(); continue; }
    result.push(p);
  }
  return "/" + result.join("/");
}

export function resolveDir(cwd: string, raw: string): string | undefined {
  const resolved = resolvePath(cwd, raw);
  return lookup(resolved)?.type === "dir" ? resolved : undefined;
}
