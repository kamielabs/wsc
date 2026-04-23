import chalk from "chalk";
import { RuntimeManager, ConsoleManager } from "@core";

export function printFooter(): void {
  const runtime = RuntimeManager.getInstance();
  const console = ConsoleManager.getInstance();
  if (runtime.get("quiet")) return; // même flag pour header/footer

  console.raw(chalk.gray("\n───────────────────────────────────────────────────────────────"));
  console.success("WSC execution finished successfully.");
  console.raw(chalk.gray("───────────────────────────────────────────────────────────────"));
}
