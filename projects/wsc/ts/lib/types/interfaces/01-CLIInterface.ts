// ---------------------------------------------------------------------
// Daemon Commands
// --------------------------------------------------------------------
export interface DaemonInstance {
    name: string // "watch", "serve", "queue", etc.
}

export interface DaemonOptions {
    pidFile: string;              // "/full/path/to/my.pid"
    envVar: string;               // "MYCLI_WATCH_DAEMON"
    command: () => void;          // fonction métier à exécuter en mode daemon
}

export interface DaemonSpec extends DaemonInstance, DaemonOptions {}



// ---------------------------------------------------------------------
// OPTION (déclaration des options globales/module/action)
// ---------------------------------------------------------------------
export interface OptionInterface {
    name: string;               // internal key (canonical)
    short?: string;             // "-q"
    long?: string;              // "quiet" (without '--')
    aliases?: string[];
    description?: string;
    value?: string;             // <path> (optional)
    group?: string;             // future: grouping in help
    expectsValue?: boolean;     // does it require a value?
    negated?: boolean;          // is this a --no- option?
}

// ---------------------------------------------------------------------
// PARSED OPTIONS (runtime values)
// ---------------------------------------------------------------------
export type ParsedOptionValue = string | boolean | undefined;

// ---------------------------------------------------------------------
// ACTION
// ---------------------------------------------------------------------
export interface ActionInterface {
    name: string;                     // "set"
    description?: string;
    aliases?: string[];
    signature?: string[];             // ["<key>", "<value>"]
    options?: OptionInterface[];
    daemon?: boolean;
    run: (opts: Record<string, ParsedOptionValue>, args: string[]) => any;
}

// ---------------------------------------------------------------------
// MODULE
// ---------------------------------------------------------------------
export interface ModuleInterface {
    name: string;
    description?: string;
    aliases?: string[];
    options?: OptionInterface[];
    actions?: ActionInterface[];
}

// ---------------------------------------------------------------------
// PARSED CLI
// ---------------------------------------------------------------------
export interface ParsedCLI {
    module?: string;
    action?: string;
    globalOptions: Record<string, ParsedOptionValue>;
    moduleOptions: Record<string, ParsedOptionValue>;
    actionOptions: Record<string, ParsedOptionValue>;
    args: string[];
}
