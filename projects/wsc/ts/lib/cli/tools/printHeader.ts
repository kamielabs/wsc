import chalk from "chalk";
import { RuntimeManager, ConsoleManager } from "@core";

export function printHeader(): void {
  const runtime = RuntimeManager.getInstance();
  if (runtime.get("quiet")) return;

  const console = ConsoleManager.getInstance();

  const displayMode = runtime.get("displayMode");
  const level = runtime.get("logLevel").toUpperCase();
  const quiet = runtime.get("quiet");
  const script = runtime.get("script");

  console.raw(chalk.bold.cyan("═══════════════════════════════════════════════════════════════"));
  console.raw(chalk.cyanBright(" 🧩  Kame WorkSpace Manager CLI — (WSC)"));
  console.raw(chalk.gray("───────────────────────────────────────────────────────────────"));
  console.raw(
    chalk.whiteBright(
      ` Mode: ${script ? "Script" : "Interactive"} | Log: ${level.padEnd(5)} | Output: ${displayMode}${
        quiet ? " | Silent" : ""
      }`
    )
  );
  console.raw(chalk.bold.cyan("═══════════════════════════════════════════════════════════════\n"));
}
