import fs from "fs";
import { ExecManager } from "@core";

export abstract class BaseEngine {
  protected exec = ExecManager.getInstance().context;

  abstract match(file: string): boolean;
  abstract handle(event: string, file: string): void;

  protected exists(p: string): boolean {
    try { return fs.existsSync(p); }
    catch { return false; }
  }
}
