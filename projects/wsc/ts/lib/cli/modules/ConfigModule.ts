import { CliManager, ConsoleManager, RuntimeManager } from "@core";
import { ConfigOrchestrator } from "@services";


const getAction = CliManager.createAction({
    name: "get",
    aliases: ["g", "show"],
    signature: ["[key]"],
    description: "Read a value from the global config file",
    run: (_opts, args) => {
        const runtime = RuntimeManager.getInstance().all();
        const service = new ConfigOrchestrator(runtime);
        const Console = ConsoleManager.getInstance();
        try {
            const result = service.show(args[0]);
            if (result.success) Console.printObject(result.message);
            else Console.error(result.message);
        } catch (err: any) {
            Console.error(err.message || err);
        }
    }
});

const setAction = CliManager.createAction({
    name: "set",
    aliases: ["s"],
    signature: ["<key>", "<value>"],
    description: "Modify a configuration key or object",
    options: [
        {
            name: "Append",
            short: "a",
            long: "append",
            description: "Append a value to an array key"
        },
        {
            name: "Remove",
            short: "r",
            long: "remove",
            description: "Remove a value from an array key"
        },
        {
            name: "Deep",
            short: "d",
            long: "deep",
            description: "Allow overwriting nested objects (validated)"
        }
    ],
    run: (opts, args) => {
        if(!args || args.length !== 2) throw new Error ("Key and value has to be set (shoudn't happened, already validated before");
        const runtime = RuntimeManager.getInstance().all();
        const service = new ConfigOrchestrator(runtime);
        const Console = ConsoleManager.getInstance();

        try {
            const result = service.set(args[0]!, args[1], {
                append: opts["Append"] === true,
                remove: opts["Remove"] === true,
                deep:   opts["Deep"]   === true
            });
            if (result.success) Console.success(result.message);
            else Console.error(result.message);
        } catch (err: any) {
            Console.error(err.message || err);
        }
    }
});

const resetAction = CliManager.createAction({
    name: "reset",
    aliases: ["r", "rst"],
    signature: [],
    description: "Reset configuration to defaults",
    options: [],
    run: () => {
        // check if opts.DryRun is set and just console.log if yes
        const runtime = RuntimeManager.getInstance().all();
        const service = new ConfigOrchestrator(runtime);
        const Console = ConsoleManager.getInstance();

        const result = service.reset();
        if (result.success)
            Console.success(result.message || "Configuration reset to defaults.");
        else Console.error(result.message);
    }
})


export const ConfigModule = CliManager.createModule({
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
            getAction,
            setAction,
            resetAction
        ]
    });