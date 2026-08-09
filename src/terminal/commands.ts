import { listDir, readFile, resolveDir, resolvePath } from "../vfs.ts";

export interface Ctx {
  readonly cwd: string;
  write(s: string): void;
  writeln(s: string): void;
  clear(): void;
  cd(dir: string): void;
}

export type Command = (args: string[], ctx: Ctx) => void;

export function createCommands(
  openVim: (path: string) => void,
): Record<string, Command> {
  return {
    clear: (_, ctx) => ctx.clear(),

    help: (_, ctx) => {
      ctx.writeln("\x1b[1mAvailable commands:\x1b[0m");
      ctx.writeln("  help           - this help");
      ctx.writeln("  startx         - open the graphical site");
    },

    pwd: (_, ctx) => ctx.writeln(ctx.cwd),
    whoami: (_, ctx) => ctx.writeln("simon"),
    hostname: (_, ctx) => ctx.writeln("wittmann-portfolio"),
    date: (_, ctx) => ctx.writeln(new Date().toString()),
    uname: (_, ctx) => ctx.writeln("WASM v0.1 (Browser)"),
    echo: (args, ctx) => ctx.writeln(args.join(" ")),

    ls: (args, ctx) => ls(args, ctx),
    cd: (args, ctx) => cd(args, ctx),
    cat: (args, ctx) => cat(args, ctx),

    vim: (args, ctx) => {
      if (args.length === 0) {
        ctx.writeln("vim: missing file");
        return;
      }
      openVim(resolvePath(ctx.cwd, args[0]));
    },

    rm: (args, ctx) => {
      if (args.join(" ") === "-rf /" || args.join(" ") === "-rf /*") {
        rmrf(ctx);
      } else {
        ctx.writeln("rm: only 'rm -rf /' is implemented ;)");
      }
    },

    startx: () => {
      window.location.href = "/gui/";
    },
  };
}

function ls(args: string[], ctx: Ctx): void {
  const all = args.includes("-a");
  const rest = args.filter((a) => a !== "-a");
  const target = rest.length > 0 ? resolvePath(ctx.cwd, rest[0]) : ctx.cwd;
  const entries = listDir(target);
  if (!entries) {
    ctx.writeln("ls: " + target + ": No such directory");
    return;
  }
  const shown = all ? entries : entries.filter((e) => !e.name.startsWith("."));
  ctx.write(
    shown
      .map((e) =>
        e.type === "dir" ? "\x1b[1m\x1b[34m" + e.name + "\x1b[0m" : e.name,
      )
      .join("  "),
  );
}

function cd(args: string[], ctx: Ctx): void {
  const target = args.length > 0 ? resolvePath(ctx.cwd, args[0]) : "/home/simon";
  const dir = resolveDir(ctx.cwd, args.length > 0 ? args[0] : "/home/simon");
  if (!dir) {
    ctx.writeln("cd: " + target + ": No such directory");
    return;
  }
  ctx.cd(dir);
}

function cat(args: string[], ctx: Ctx): void {
  if (args.length === 0) {
    ctx.writeln("cat: missing file");
    return;
  }
  const path = resolvePath(ctx.cwd, args[0]);
  const content = readFile(path);
  if (content === undefined) {
    const dir = resolveDir(ctx.cwd, args[0]);
    if (dir) {
      ctx.writeln("cat: " + args[0] + ": Is a directory");
      return;
    }
    ctx.writeln("cat: " + args[0] + ": No such file");
    return;
  }
  ctx.write(
    content.replace(/\n/g, "\r\n") + (content.endsWith("\n") ? "" : "\r\n"),
  );
}

function rmrf(ctx: Ctx): void {
  ctx.writeln("");
  const files = [
    "/etc/passwd",
    "/etc/shadow",
    "/bin/bash",
    "/usr/lib",
    "/var/log/syslog",
    "/boot/vmlinuz",
    "/home/simon/.ssh/id_rsa",
    "/home/simon/dev",
  ];
  let i = 0;
  const interval = setInterval(() => {
    if (i < files.length) {
      ctx.writeln("rm: removing " + files[i] + " \u2026 OK");
      i++;
    } else if (i === files.length) {
      ctx.writeln("Im still standing.");
      i++;
      clearInterval(interval);
    } else {
      clearInterval(interval);
    }
  }, 120);
}
