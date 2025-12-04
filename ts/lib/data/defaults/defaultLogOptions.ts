import { LogOptionsType } from "@interfaces";
import path from "path";
import os from "os";

/** Default configuration */
export const defaultLogOptions: LogOptionsType = {
  path: path.join(os.homedir(), "logs", "pmgr.log"),
  level: "info",
  rootScope: "main",
  showTS: true,
  formatTS: "YYYY-MM-DD HH:mm:ssZ",
  showLvl: true,
  showColors: true,
};