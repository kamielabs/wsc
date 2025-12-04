import { CliManager } from "@core";



export function command(cli: CliManager): CliManager {
    cli
    .version("0.0.1")
    .description("Workspace CLI core (config + doc)")
    .option({
        name: "LogLevel",
        description: "Runtime override: Log level to trace",
        group: "Runtime overrides",
        short: "T",
        long: "trace"
    })
    .option({
        name: "LogLevel",
        description: "Runtime override: Log level to debug",
        group: "Runtime overrides",
        short: "D",
        long: "debug"
    })
    .option({
        name: "LogLevel",
        description: "Runtime override: Log level to info",
        group: "Runtime overrides",
        short: "I",
        long: "info"
    })
    .option({
        name: "LogLevel",
        description: "Runtime override: Log level to warn",
        group: "Runtime overrides",
        short: "W",
        long: "warn"
    })
    .option({
        name: "LogLevel",
        description: "Runtime override: Log level to error",
        group: "Runtime overrides",
        short: "E",
        long: "error"
    })
    .option({
        name: "LogLevel",
        description: "Runtime override: Log level to fatal",
        group: "Runtime overrides",
        short: "F",
        long: "fatal"
    })
    .option({
        name: "LogFile",
        description: "Runtime override: set logfile",
        group: "Runtime overrides",
        expectsValue: true,
        short: "l",
        long: "logfile",
        value: "[filepath]"
    })
    .option({
        name: "LogFile",
        description: "Runtime override: disable file logging entirely",
        group: "Runtime overrides",
        short: "L",
        long: "no-logfile",
    })
    .option({
        name: "PrintMode",
        description: "Runtime override: mode: raw|pretty (default raw)",
        group: "Runtime overrides",
        short: "p",
        long: "print",
        expectsValue: true
    })
    .option({
        name: "Verbosity",
        description: "Runtime override: Force header/footer/results/logs display, useful for debugging/user interactions",
        group: "Runtime overrides",
        short: "v",
        long: "verbose",
    })
    .option({
        name: "Verbosity",
        description: "Runtime override: Disable header/footer/results/logs display, useful for raw prints and scripts",
        group: "Runtime overrides",
        short: "q",
        long: "quiet",
    })
    .option({
        name: "Scripting",
        description: "Run CLI without any interactive prompts (for scripts)",
        group: "automation",
        short: "s",
        long: "script",
    });
    return cli;
}