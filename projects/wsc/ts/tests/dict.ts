export type StagesEnum = 'dev' | 'build' | 'release';
export type NodeEnvEnum = 'dev' | 'prod';

interface BuiltinCLIOption {
  short?: string;
  long?: string;
  aliases?: string[];

  expectsValue?: boolean;
  valueHint?: string;
}

export interface BuiltinOption<
  Env extends string,
  Default
> {
  group?: string;
  env: Env;
  default: Default;
  cli?: BuiltinCLIOption[];
  description?: string;
}

export type StagesInterface  = {
    [K in StagesEnum]: {
        file: string;
        props: Record<string, BuiltinOption<any, any>>;
    }
}

/**
 * Defines Enum types for builtin options first
 */
export type ConsoleMode = 'quiet' | 'normal' | 'full';

export type ConsoleOutput = 'raw' | 'pretty';

export type Logginglevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Console Runtime Builtin Options
 */
type ConsoleModeOption = BuiltinOption<'CLI_CONSOLE_MODE', ConsoleMode>;
type ConsoleColorsOption = BuiltinOption<'CLI_CONSOLE_COLORS', boolean>;
type ConsoleOutputOption = BuiltinOption<'CLI_CONSOLE_OUTPUT', ConsoleOutput>;
/**
 * Logging Runtime Builtin Options
 */
type LoggingEnabledOption = BuiltinOption<'CLI_LOGGING_ENABLED', boolean>;
type LoggingLevelOption = BuiltinOption<'CLI_LOGGING_LEVEL', Logginglevel>;
type LoggingColorsOption = BuiltinOption<'CLI_LOGGING_COLORS', boolean>;
type LoggingPathOption = BuiltinOption<'CLI_LOGGING_PATH', string>;


export interface BuiltinConsoleInterface {
    mode: ConsoleModeOption,
    colors: ConsoleColorsOption,
    output: ConsoleOutputOption
}
export interface BuiltinLoggingInterface {
  enabled: LoggingEnabledOption,
  level: LoggingLevelOption,
  colors: LoggingColorsOption,
  path: LoggingPathOption
}

export interface CLIDaemon {
  enabled: boolean;
  pidFile: string;
  env: string;
}


export interface BuiltinGlobals {
    stages: StagesInterface,
    runtime: {
        daemon: CLIDaemon,
        console: BuiltinConsoleInterface,
        logging: BuiltinLoggingInterface
    }
}

export interface BuiltinModules {
    env: {},
    help: {}
}

export interface Dict {
    builtins: {
        globals: BuiltinGlobals,
        modules: BuiltinModules
    },
    custom?: {
        globals: {
            stages: {
                [K in StagesEnum]: {
                    file: string;
                    props: Record<string, BuiltinOption<any, any>>;
                }
            },
        },
        modules: {}
    },
    defaults?: {
        globals: {},
        modules: {}
    },
    runtime: {
        node: string;
        tsx?: string|undefined;
        tsup?: string|undefined;
        exe: string;
        cwd: string;
        script: {
            raw: string;
            name: string;
            path: string;
            file: string;
            ext: string;
        },
        env: string;
        stage: StagesEnum;
        envFile?: string;
        props?: Record<string, any>;
    }
}