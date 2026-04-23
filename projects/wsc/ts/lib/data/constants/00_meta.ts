// ts/lib/constants/meta.ts

import { getTimestamp } from "@tools";

/** 📚 Métadonnées du projet */
export const APP_NAME = "pmgr";
export const APP_VERSION = "1.4.0";
export const APP_AUTHOR = "Kame";
export const APP_DESCRIPTION =
  "Kame Project Manager CLI — modular workspace & core orchestrator";

/** 📅 Généré dynamiquement si besoin */
export const BUILD_DATE = getTimestamp();
