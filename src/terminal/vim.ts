import type { Terminal } from "ghostty-web";
import { VimWasm, checkBrowserCompatibility } from "vim-wasm";
import { readFile, writeFile } from "../vfs.ts";

export function createVim(
  term: Terminal,
  fit: () => void,
): (path: string) => void {
  const canvas = document.getElementById("vim-canvas") as HTMLCanvasElement;
  const input = document.getElementById("vim-input") as HTMLInputElement;
  const container = document.getElementById("vim-container")!;
  const termEl = document.getElementById("terminal")!;

  function size() {
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
  }

  function showTerminal() {
    container.hidden = true;
    termEl.style.display = "block";
    fit();
    term.focus();
  }

  return (path) => {
    const compat = checkBrowserCompatibility();
    if (compat) {
      term.write("vim: " + compat + "\r\n");
      return;
    }

    const content = readFile(path) ?? "";

    size();
    termEl.style.display = "none";
    container.hidden = false;

    let vim: VimWasm;
    try {
      vim = new VimWasm({
        canvas,
        input,
        workerScriptPath: "/vim/vim.js",
      });
    } catch (e) {
      term.write(
        "vim: failed to initialize: " + (e instanceof Error ? e.message : e) + "\r\n",
      );
      showTerminal();
      return;
    }

    vim.onFileExport = (fpath, contents) => {
      writeFile(fpath, new TextDecoder().decode(contents));
    };

    vim.onVimInit = () => {
      vim.cmdline(
        "highlight Normal guibg=#1a1b26 guifg=#a9b1d6 | highlight Visual guibg=#3b4261",
      );
    };

    vim.onError = (err) => {
      console.error("[vim] error:", err);
      showTerminal();
    };

    vim.onVimExit = () => {
      showTerminal();
    };

    const userDirs = dirsOf(path).filter(
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
  };
}

function dirsOf(filePath: string): string[] {
  const parts = filePath.split("/").filter(Boolean);
  const dirs: string[] = [];
  for (let i = 1; i <= parts.length - 1; i++) {
    dirs.push("/" + parts.slice(0, i).join("/"));
  }
  return dirs;
}
