import fs from "fs";
import path from "path";
import readlineSync from "readline-sync";
import { ManagerResultType, ManagerRuntimeContextType } from "@interfaces";

/**
 * @module JsonManager
 * @version 1.4
 * @description
 *  Generic JSON file manager for pmgr CLI.
 *  Provides synchronous read/write and deep key manipulation for structured JSON files.
 *  Implements a clear separation between public CRUD methods and the internal `_mutate()` core:
 *  - `_mutate()` performs in-memory changes only (no confirmation, no write).
 *  - `add`, `set`, `del`, `reset` handle confirmations, validations, and persistence.
 *
 * @author Kame
 * @created 2025-10-27
 * @modified 2025-11-12
 *
 * @remarks
 *  - Handles automatic file creation if missing.
 *  - Supports dot-notation for nested keys.
 *  - All operations are synchronous for deterministic CLI behavior.
 *  - `script: true` disables all confirmations for automation mode.
 *
 * @example
 * ```ts
 * const mgr = new JsonManager("./conf/example.json", { script: true });
 * mgr.add("project.name", "pmgr");
 * mgr.set("project.version", "1.0");
 * mgr.del("deprecated", { deep: true });
 * ```
 */
export class JsonManager<T = any> {
  protected filePath: string;
  protected data: T | null = null;
  protected runtimeCtx: ManagerRuntimeContextType;

  constructor(filePath: string, runtimeCtx?: Partial<ManagerRuntimeContextType>) {
    this.filePath = path.resolve(filePath);
    this.runtimeCtx = runtimeCtx || {};
    this.load();
  }

  /* -------------------------------------------------------
   * 🔒 Confirmation Helper
   * ----------------------------------------------------- */

  protected confirmActionSync(action: string, keyPath?: string): boolean {
    if (this.runtimeCtx.script) return true;
    const label = keyPath ? ` "${keyPath}"` : "";
    const question = `⚠️  Action irréversible ! Voulez-vous vraiment ${action}${label} ? (y/N) `;
    const answer = readlineSync.question(question).trim().toLowerCase();
    const confirmed = answer === "y" || answer === "yes";
    if (!confirmed) console.log("🚫 Action annulée.");
    return confirmed;
  }

  /* -------------------------------------------------------
   * 🔄 File Operations
   * ----------------------------------------------------- */

  public load(): T {
    try {
      if (!fs.existsSync(this.filePath)) {
        this.data = {} as T;
        this.write();
      } else {
        const content = fs.readFileSync(this.filePath, "utf-8");
        this.data = JSON.parse(content) as T;
      }
    } catch {
      this.data = {} as T;
    }
    return this.data!;
  }

  public write(): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 4));
  }

  public save(): void {
    this.write();
  }

  /* -------------------------------------------------------
   * 📖 Data Access
   * ----------------------------------------------------- */

  public getAll(): T {
    return this.data!;
  }

  public get(keyPath: string): any {
    const keys = keyPath.split(".");
    let current: any = this.data;
    for (const key of keys) {
      if (current[key] === undefined) return undefined;
      current = current[key];
    }
    return current;
  }

  /* -------------------------------------------------------
   * 🧩 Internal Core Mutator (no I/O, no confirmation)
   * ----------------------------------------------------- */

  /**
   * Internal method performing in-memory operations.
   * - Does NOT prompt confirmation or write to disk.
   * - Used by public CRUD methods after validation.
   */
  protected _mutate(
    action: "add" | "set" | "delete",
    keyPath: string,
    value?: any,
    opts?: { deep?: boolean }
  ): ManagerResultType {
    const keys = keyPath.split(".");
    let current: any = this.data;

    // traverse / create
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]!;
      if (!current[key] || typeof current[key] !== "object") {
        if (action === "add") current[key] = {};
        else return { success: false, message: `Clé '${key}' inexistante.` };
      }
      current = current[key];
    }

    const lastKey = keys[keys.length - 1]!;

    switch (action) {
      case "add":
        if (current[lastKey] !== undefined)
          return { success: false, message: `La clé '${keyPath}' existe déjà.` };
        current[lastKey] = value;
        break;

      case "set":
        if (!(lastKey in current))
          return { success: false, message: `Clé '${keyPath}' inexistante.` };
        if (!opts?.deep && typeof current[lastKey] === "object" && typeof value === "object") {
          return {
            success: false,
            message: `La clé '${keyPath}' est un objet. Utilisez { deep: true } pour écraser.`,
          };
        }
        current[lastKey] = value;
        break;

      case "delete":
        if (!(lastKey in current))
          return { success: false, message: `Clé '${keyPath}' inexistante.` };
        delete current[lastKey];
        break;
    }

    return { success: true, message: `Action '${action}' appliquée sur '${keyPath}'.` };
  }

  /* -------------------------------------------------------
   * ✏️ Public CRUD Methods
   * ----------------------------------------------------- */

  /** Sets an existing key’s value (fails if key missing). */
  public set(keyPath: string, value: any, opts?: { deep?: boolean }): ManagerResultType {
    if (!this.confirmActionSync("modifier", keyPath))
      return { success: false, message: "Action annulée par l’utilisateur." };
    const result = this._mutate("set", keyPath, value, opts);
    if (result.success) this.write();
    return result;
  }

  /** Adds a new key (creates missing parent branches). */
  public add(keyPath: string, value: any, opts?: { deep?: boolean }): ManagerResultType {
    if (!this.confirmActionSync("ajouter", keyPath))
      return { success: false, message: "Action annulée par l’utilisateur." };
    const result = this._mutate("add", keyPath, value, opts);
    if (result.success) this.write();
    return result;
  }

  /** Deletes an existing key. */
  public del(keyPath: string, opts?: { deep?: boolean }): ManagerResultType {
    if (!this.confirmActionSync("supprimer", keyPath))
      return { success: false, message: "Action annulée par l’utilisateur." };
    const result = this._mutate("delete", keyPath, undefined, opts);
    if (result.success) this.write();
    return result;
  }

  /** Resets the JSON file entirely, optionally with default data. */
  public reset(data?: T): ManagerResultType {
    if (!this.confirmActionSync("réinitialiser le fichier entier"))
      return { success: false, message: "Action annulée par l’utilisateur." };
    this.data = data ? JSON.parse(JSON.stringify(data)) : ({} as T);
    this.write();
    return { success: true, message: "Fichier réinitialisé." };
  }

  /* -------------------------------------------------------
   * ➕ Array Helpers
   * ----------------------------------------------------- */

  /** Adds a value to an array key. */
  public addTo(keyPath: string, value: any): ManagerResultType {
    if (!this.confirmActionSync("ajouter à", keyPath))
      return { success: false, message: "Action annulée par l’utilisateur." };
    const arr = this.get(keyPath);
    if (!Array.isArray(arr))
      return { success: false, message: `'${keyPath}' n’est pas un tableau.` };
    if (arr.includes(value))
      return { success: false, message: `'${value}' existe déjà dans '${keyPath}'.` };
    arr.push(value);
    this.write();
    return { success: true, message: `'${value}' ajouté à '${keyPath}'.` };
  }

  /** Removes a value from an array key. */
  public delFrom(keyPath: string, value: any): ManagerResultType {
    if (!this.confirmActionSync("supprimer de", keyPath))
      return { success: false, message: "Action annulée par l’utilisateur." };
    const arr = this.get(keyPath);
    if (!Array.isArray(arr))
      return { success: false, message: `'${keyPath}' n’est pas un tableau.` };
    const index = arr.indexOf(value);
    if (index === -1)
      return { success: false, message: `'${value}' introuvable dans '${keyPath}'.` };
    arr.splice(index, 1);
    this.write();
    return { success: true, message: `'${value}' supprimé de '${keyPath}'.` };
  }
}
