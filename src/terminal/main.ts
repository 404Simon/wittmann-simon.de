import "../style.css";
import { init, Terminal, FitAddon } from "ghostty-web";
import { banner, termOptions } from "./config.ts";
import { createCommands } from "./commands.ts";
import { createVim } from "./vim.ts";
import { Repl } from "./repl.ts";

await init();

const term = new Terminal(termOptions);

const el = document.getElementById("terminal")!;
term.open(el);

const fit = new FitAddon();
term.loadAddon(fit);
fit.observeResize();
fit.fit();

const openVim = createVim(term, () => fit.fit());
const commands = createCommands(openVim);
const repl = new Repl(term, commands);

term.write(banner);
repl.prompt();
term.onData((data) => repl.handle(data));
