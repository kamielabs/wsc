// ts/lib/services/watchers/engines/WorkspaceEngine.ts
import { WorkspaceScannerService } from "@services/workspace";
import { BaseEngine } from "./00-BaseEngine";
import { WorkspaceScan } from "@interfaces";
import { PNPM_WORKSPACE_YAML } from "@constants";

export class WorkspaceEngine extends BaseEngine {

  /**
   * 🎯 Match :
   *  - pnpm-workspace.yaml
   *  - tout fichier dans .ws/   (config interne)
   *  - mais ignore .ws/watchers.pid (éviter les boucles infinies)
   */
  match(file: string): boolean {
    const normalized = file.replace(/\\/g, "/");

    
    // Match principal
    if (normalized.endsWith(PNPM_WORKSPACE_YAML)) return true;
    // if (normalized.includes("/.ws/")) {
    //   // Ignore watchers pid
    //   if (normalized.endsWith("watchers.pid")) return false;
    //   return true;
    // }

    return false;
  }

  /**
   * 🚀 Handler :
   *  Retourne le WorkspaceScan pour tous les cas utiles.
   */
  handle(event: string, file: string): WorkspaceScan | void {   
    if (!this.exists(file)) return;
    // Pas d’effet secondaire : on délègue au Scanner
    const scan = WorkspaceScannerService.getInstance().scan();

    // Le router décidera quoi faire :
    // - regenerate paths ?
    // - regenerate indexes ?
    // - restart watchers ?
    // etc.
    return scan;
  }
}
