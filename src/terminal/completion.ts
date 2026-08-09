import { listDir, resolvePath } from "../vfs.ts";

export interface CompletionResult {
  line: string;
  matches?: string[];
}

function commonPrefix(strings: string[]): string {
  if (strings.length === 0) return "";
  let prefix = strings[0];
  for (let i = 1; i < strings.length; i++) {
    while (!strings[i].startsWith(prefix)) prefix = prefix.slice(0, -1);
  }
  return prefix;
}

export function complete(
  line: string,
  cwd: string,
  commandNames: string[],
): CompletionResult {
  const hasTrailingSpace = line.endsWith(" ");
  const parts = line.trimEnd().split(/\s+/);

  if (parts.length <= 1 && !hasTrailingSpace) {
    const prefix = parts[0] ?? "";
    const matches = commandNames.filter((c) => c.startsWith(prefix));
    if (matches.length === 0) return { line };
    if (matches.length === 1) return { line: matches[0] + " " };

    const common = commonPrefix(matches);
    if (common.length > prefix.length) return { line: common };
    return { line, matches };
  }

  const lastPart = hasTrailingSpace ? "" : parts[parts.length - 1];
  const expanded = lastPart.replace(/^~/, "/home/simon");

  let searchDir: string;
  let prefix: string;

  if (expanded.startsWith("/")) {
    const slashIdx = expanded.lastIndexOf("/");
    if (slashIdx === 0) {
      searchDir = "/";
      prefix = expanded.slice(1);
    } else {
      searchDir = expanded.slice(0, slashIdx);
      prefix = expanded.slice(slashIdx + 1);
    }
  } else if (expanded.includes("/")) {
    const slashIdx = expanded.lastIndexOf("/");
    searchDir = resolvePath(cwd, expanded.slice(0, slashIdx));
    prefix = expanded.slice(slashIdx + 1);
  } else {
    searchDir = cwd;
    prefix = expanded;
  }

  const entries = listDir(searchDir);
  if (!entries) return { line };

  const candidates = entries.filter((e) => e.name.startsWith(prefix));
  if (candidates.length === 0) return { line };

  if (candidates.length === 1) {
    const e = candidates[0];
    const suffix = e.type === "dir" ? "/" : " ";
    return { line: line + e.name.slice(prefix.length) + suffix };
  }

  const names = candidates.map((e) => e.name + (e.type === "dir" ? "/" : ""));
  const common = commonPrefix(names);
  if (common.length > prefix.length) {
    return { line: line + common.slice(prefix.length) };
  }
  return { line, matches: names };
}
