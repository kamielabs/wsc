import { CliManager } from "@core";


const wsc = new CliManager("wsc")
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

    const config = CliManager.createModule({
        name: "config",
        description: "Manage global WSC configuration",
        aliases: ["cfg"],

        options: [
            {
                name: "dryRun",
                short: "n",
                long: "dry-run",
                description: "Simulate changes without writing"
            }
        ],

        actions: [
            CliManager.createAction({
                name: "get",
                aliases: ["g"],
                signature: ["[key]"],
                description: "Read a value from the global config file",
                run: (opts, args) => {
                    console.log("GET CONFIG", opts, args);
                }
            }),

            CliManager.createAction({
                name: "set",
                aliases: ["s"],
                signature: ["<key>", "<value>"],
                description: "Modify a configuration entry",
                options: [
                    {
                        name: "Deep",
                        short: "d",
                        long: "deep",
                        description: "Allow overwriting objects"
                    }
                ],
                run: (opts, args) => {
                    console.log("SET CONFIG", opts, args);
                }
            })
        ]
    });

    wsc.module(config);

    wsc.parse(process.argv);

    console.log(wsc.parsed());

    wsc.validate();

    wsc.exec();