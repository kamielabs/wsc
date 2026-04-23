import { command } from "@cli";
import { CliManager, ConsoleManager, RuntimeManager } from "@core";
import { ConfigModule, ToolsModule, WatcherModule } from "@modules";
import { printFooter, printHeader } from "@tools";


export function bootStrap() {
    // Init CliManager very first to get access to CLI parsing and tools
    const wsc = new CliManager("wsc")
    // Declare all commands specs and options
    command(wsc);
    // define modules here
    wsc.module(ConfigModule);
    wsc.module(WatcherModule);
    wsc.module(ToolsModule);
    // Init Done

    // parsing command line
    wsc.parse(process.argv);
    // Init the runtime, it inits every needed instances : ExecManager,LogManager,ConsoleManager
    RuntimeManager.init(wsc.parsed()?.globalOptions);
    // validate it
    wsc.validate();
    // Debug info
    const Console = ConsoleManager.getInstance();
    Console.debug("🚀 wsc initialized with runtime environment.");
    // Print Header
    printHeader();
    // Execute Command
    wsc.exec();
    // PrintFooter
    printFooter();
}

