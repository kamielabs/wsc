import { DisplayMode, LogLevel } from "@schemas";
import { ConfigType } from "@interfaces";

export const defaultConfig:ConfigType = {
  console: {
    quiet: true,
    mode: DisplayMode.enum.pretty
  },
  logging: {
    enabled: false,
    level: LogLevel.enum.info,
    path: "logs/wsc.log"
  }
};