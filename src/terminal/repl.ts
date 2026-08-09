import type { Terminal } from "ghostty-web";
import { promptString } from "./config.ts";
import { complete } from "./completion.ts";
import type { Command, Ctx } from "./commands.ts";

export class Repl implements Ctx {
  private term: Terminal;
  private commands: Record<string, Command>;
  private line = "";
  private _cwd = "/home/simon";

  constructor(term: Terminal, commands: Record<string, Command>) {
    this.term = term;
    this.commands = commands;
  }

  get cwd(): string {
    return this._cwd;
  }

  write(s: string): void {
    this.term.write(s);
  }

  writeln(s: string): void {
    this.term.write(s + "\r\n");
  }

  clear(): void {
    this.term.clear();
  }

  cd(dir: string): void {
    this._cwd = dir;
  }

  private get promptStr(): string {
    return promptString(this._cwd);
  }

  handle(data: string): void {
    if (data === "\r") {
      this.term.write("\r\n");
      this.exec(this.line);
      this.line = "";
      this.prompt();
    } else if (data === "\x7f") {
      if (this.line.length > 0) {
        this.line = this.line.slice(0, -1);
        this.term.write("\b \b");
      }
    } else if (data === "\x03") {
      this.line = "";
      this.term.write("^C");
      this.prompt();
    } else if (data === "\f") {
      this.term.clear();
      this.prompt();
    } else if (data === "\t") {
      this.handleTab();
    } else if (data.length === 1 && data >= " ") {
      this.line += data;
      this.term.write(data);
    }
  }

  prompt(): void {
    this.term.write("\r\n" + this.promptStr);
  }

  private handleTab(): void {
    const result = complete(this.line, this._cwd, Object.keys(this.commands));
    if (result.matches) {
      this.writeln(result.matches.map((m) => "  " + m).join(""));
      this.write(this.promptStr + this.line);
      return;
    }
    this.line = result.line;
    this.write("\r\x1b[2K" + this.promptStr + this.line);
  }

  private exec(cmd: string): void {
    const parts = cmd.trim().split(/\s+/);
    if (parts.length === 0 || parts[0] === "") return;
    const name = parts[0];
    const args = parts.slice(1);
    const command = this.commands[name];
    if (command) command(args, this);
    else this.writeln(name + ": command not found");
  }
}
