// ts/lib/services/watchers/engines/PathsEngine.ts
import path from "path";
import { BaseEngine } from "./00-BaseEngine";
import { PathsScannerService } from "@services/projects";
import { PathsScan } from "@interfaces";
import { TSCONFIGPATHS_FILE } from "@constants";
import { ConsoleManager } from "@core";

export class PathsEngine extends BaseEngine {

  private console = ConsoleManager.getInstance();

  /**
   * 🎯 On match UNIQUEMENT un fichier tsconfig.paths.json
   */
  match(file: string): boolean {
    return file.endsWith(TSCONFIGPATHS_FILE);
  }

  /**
   * 🚀 Retourne un PathsScan basé sur le fichier modifié.
   * Le Router décidera si on doit régénérer paths.ts
   */
  handle(event: string, file: string): PathsScan | void {
    if (!this.exists(file)) return;
    try {
      const scan = PathsScannerService.getInstance().scan(file);
      return scan;
    } catch (err) {
      this.console.error(`[PathsEngine] Impossible de scanner : ${file}`);
      this.console.error(err as any);
      return;
    }
  }
}
