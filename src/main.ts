import "./style.css";
import { init, Terminal, FitAddon } from "ghostty-web";
import { VimWasm, checkBrowserCompatibility } from "vim-wasm";
import { listDir, readFile, writeFile, resolvePath, resolveDir } from "./vfs.ts";

await init();

const term = new Terminal({
  fontSize: 14,
  fontFamily: '"JetBrainsMonoNFM", monospace',
  cursorBlink: true,
  theme: {
    background: "#1a1b26",
    foreground: "#a9b1d6",
    cursor: "#c0caf5",
    black: "#414868",
    red: "#f7768e",
    green: "#9ece6a",
    yellow: "#e0af68",
    blue: "#7aa2f7",
    magenta: "#bb9af7",
    cyan: "#7dcfff",
    white: "#a9b1d6",
    brightBlack: "#414868",
    brightRed: "#f7768e",
    brightGreen: "#9ece6a",
    brightYellow: "#e0af68",
    brightBlue: "#7aa2f7",
    brightMagenta: "#bb9af7",
    brightCyan: "#7dcfff",
    brightWhite: "#c0caf5",
  },
});

const el = document.getElementById("terminal")!;
term.open(el);

const fit = new FitAddon();
term.loadAddon(fit);
fit.observeResize();
fit.fit();

const vimCanvas = document.getElementById("vim-canvas") as HTMLCanvasElement;
const vimInput = document.getElementById("vim-input") as HTMLInputElement;
const vimContainer = document.getElementById("vim-container")!;
const termContainer = document.getElementById("terminal")!;

function vimSize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  vimCanvas.width = w * devicePixelRatio;
  vimCanvas.height = h * devicePixelRatio;
  vimCanvas.style.width = w + "px";
  vimCanvas.style.height = h + "px";
}

let cwd = "/home/simon";

let line = "";
let vim: VimWasm | null = null;

function w(s: string) {
  term.write(s);
}

function writeln(s: string) {
  term.write(s + "\r\n");
}

function prompt() {
  const dir = cwd.replace(/^\/home\/simon/, "~");
  w("\r\n\x1b[92m" + dir + "\x1b[0m $ ");
}

w("Type \x1b[33mhelp\x1b[0m for available commands.\r\n");
prompt();

term.onData((data) => {
  if (data === "\r") {
    w("\r\n");
    exec(line);
    line = "";
    prompt();
  } else if (data === "\x7f") {
    if (line.length > 0) {
      line = line.slice(0, -1);
      w("\b \b");
    }
  } else if (data === "\x03") {
    line = "";
    w("^C");
    prompt();
  } else if (data === "\f") {
    term.clear();
    prompt();
  } else if (data.length === 1 && data >= " ") {
    line += data;
    w(data);
  }
});

function exec(cmd: string) {
  const parts = cmd.trim().split(/\s+/);
  if (parts.length === 0 || parts[0] === "") return;
  const c = parts[0];
  const args = parts.slice(1);

  switch (c) {
    case "clear": term.clear(); break;
    case "help": help(); break;
    case "pwd": writeln(cwd); break;
    case "whoami": writeln("simon"); break;
    case "hostname": writeln("wittmann-portfolio"); break;
    case "date": writeln(new Date().toString()); break;
    case "uname": writeln("WASM v0.1 (Browser)"); break;
    case "echo": writeln(args.join(" ")); break;

    case "ls": cmdLs(args); break;
    case "cd": cmdCd(args); break;
    case "cat": cmdCat(args); break;
    case "vim": cmdVim(args); break;

    case "rm":
      if (args.join(" ") === "-rf /" || args.join(" ") === "-rf /*") {
        rmrf();
      } else {
        writeln("rm: only 'rm -rf /' is implemented ;)");
      }
      break;

    default:
      writeln(c + ": command not found");
  }
}

function help() {
  writeln("\x1b[1mAvailable commands:\x1b[0m");
  writeln("  help           - this help");
}

function cmdLs(args: string[]) {
  const target = args.length > 0 ? resolvePath(cwd, args[0]) : cwd;
  const entries = listDir(target);
  if (!entries) { writeln("ls: " + target + ": No such directory"); return; }
  const lines = entries.map((e) =>
    e.type === "dir" ? "\x1b[1m\x1b[34m" + e.name + "/\x1b[0m" : e.name,
  );
  w(lines.join("  "));
}

function cmdCd(args: string[]) {
  const target = args.length > 0 ? resolvePath(cwd, args[0]) : "/home/simon";
  const dir = resolveDir(cwd, args.length > 0 ? args[0] : "/home/simon");
  if (!dir) { writeln("cd: " + target + ": No such directory"); return; }
  cwd = dir;
}

function cmdCat(args: string[]) {
  if (args.length === 0) { writeln("cat: missing file"); return; }
  const path = resolvePath(cwd, args[0]);
  const content = readFile(path);
  if (content === undefined) {
    const dir = resolveDir(cwd, args[0]);
    if (dir) { writeln("cat: " + args[0] + ": Is a directory"); return; }
    writeln("cat: " + args[0] + ": No such file");
    return;
  }
  w(content.replace(/\n/g, "\r\n") + (content.endsWith("\n") ? "" : "\r\n"));
}

function rmrf() {
  w("\r\n");
  const files = [
    "/etc/passwd", "/etc/shadow", "/bin/bash",
    "/usr/lib", "/var/log/syslog", "/boot/vmlinuz",
    "/home/simon/.ssh/id_rsa", "/home/simon/dev",
  ];
  let i = 0;
  const interval = setInterval(() => {
    if (i < files.length) {
      writeln("rm: removing " + files[i] + " \u2026 OK");
      i++;
    } else if (i === files.length) {
      writeln("Im still standing.");
      i++;
      clearInterval(interval);
    } else {
      clearInterval(interval);
    }
  }, 120);
}

function cmdVim(args: string[]) {
  if (args.length === 0) { writeln("vim: missing file"); return; }

  const compat = checkBrowserCompatibility();
  if (compat) {
    writeln("vim: " + compat);
    return;
  }

  const path = resolvePath(cwd, args[0]);
  const content = readFile(path) ?? "";

  vimSize();
  termContainer.style.display = "none";
  vimContainer.hidden = false;

  try {
    vim = new VimWasm({
      canvas: vimCanvas,
      input: vimInput,
      workerScriptPath: "/vim/vim.js",
    });
  } catch (e) {
    writeln("vim: failed to initialize: " + (e instanceof Error ? e.message : e));
    vimContainer.hidden = true;
    termContainer.style.display = "block";
    fit.fit();
    term.focus();
    return;
  }

  vim.onFileExport = (fpath, contents) => {
    const dec = new TextDecoder();
    writeFile(fpath, dec.decode(contents));
  };

  vim.onVimInit = () => {
    vim!.cmdline("highlight Normal guibg=#1a1b26 guifg=#a9b1d6 | highlight Visual guibg=#3b4261");
  };

  vim.onError = (err) => {
    console.error("[vim] error:", err);
    vimContainer.hidden = true;
    termContainer.style.display = "block";
    fit.fit();
    term.focus();
    vim = null;
  };

  vim.onVimExit = () => {
    vimContainer.hidden = true;
    termContainer.style.display = "block";
    fit.fit();
    term.focus();
    vim = null;
  };

  const userDirs = getDirs(path).filter(
    (d) => d !== "/home" && d !== "/home/web_user",
  );

  vim.start({
    dirs: userDirs,
    files: {
      [path]: content,
      "/home/web_user/.vim/vimrc": [
        "set nocompatible laststatus=0 background=dark",
        "set expandtab tabstop=4 shiftwidth=4 softtabstop=4",
        "set guifont=JetBrainsMonoNFM:h14",
      ].join("\n"),
    },
    cmdArgs: [path],
  });
}

function getDirs(filePath: string): string[] {
  const parts = filePath.split("/").filter(Boolean);
  const dirs: string[] = [];
  for (let i = 1; i <= parts.length - 1; i++) {
    dirs.push("/" + parts.slice(0, i).join("/"));
  }
  return dirs;
}
