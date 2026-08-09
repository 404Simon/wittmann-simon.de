import type { ITerminalOptions } from "ghostty-web";

export const termOptions: ITerminalOptions = {
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
};

export const banner =
  "not a terminal fan? try \x1b[36mstartx\x1b[0m to open the gui\r\n" +
  "Type \x1b[33mhelp\x1b[0m for available commands.\r\n";

export function promptString(cwd: string): string {
  const dir = cwd.replace(/^\/home\/simon/, "~");
  return "\x1b[92m" + dir + "\x1b[0m $ ";
}
