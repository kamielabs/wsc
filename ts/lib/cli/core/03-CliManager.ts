import { 
    ModuleInterface, ActionInterface, OptionInterface,
    ParsedCLI, ParsedOptionValue 
} from "@interfaces";

import { tokenize, parseOptionToken } from "@tools";

export class CliManager {

    private _name: string;
    private _version: string = "0.0.1";
    private _description: string = "";

    private _globalOptions: OptionInterface[] = [];
    private _modules: ModuleInterface[] = [];

    private _parsed?: ParsedCLI;
    private _parsedValidated = false;

    constructor(name: string) {
        this._name = name;
    }

    // ---------------------------------------------------------------------
    // DECLARATION PHASE
    // ---------------------------------------------------------------------

    name() : string {
        return this._name;
    }

    version(ver: string): this {
        this._version = ver;
        return this;
    }

    description(desc: string): this {
        this._description = desc;
        return this;
    }

    option(opt: OptionInterface): this {
        this._globalOptions.push(opt);
        return this;
    }

    module(mod: ModuleInterface): this {
        this._modules.push(mod);
        return this;
    }

    modules(): ModuleInterface[] {
        return this._modules;
    }

    globals(): OptionInterface[] {
        return this._globalOptions;
    }

    parsed(): ParsedCLI|undefined {
        return this._parsed;
    }

    // ---------------------------------------------------------------------
    // INTERNAL RESOLUTION HELPERS
    // ---------------------------------------------------------------------

    private matchModuleName(mod: ModuleInterface, name: string) {
        return mod.name === name || (mod.aliases?.includes(name));
    }

    private matchActionName(act: ActionInterface, name: string) {
        return act.name === name || (act.aliases?.includes(name));
    }

    private matchOptionName(opt: OptionInterface, name: string) {
        return (
            opt.short === name ||
            opt.long === name ||
            (opt.aliases && opt.aliases.includes(name))
        );
    }

    private findModule(name: string): ModuleInterface | undefined {
        return this._modules.find(m => this.matchModuleName(m, name));
    }

    private findAction(mod: ModuleInterface, name: string): ActionInterface | undefined {
        return mod.actions?.find(a => this.matchActionName(a, name));
    }

    private resolveOption(
        scope: "global" | "module" | "action",
        name: string,
        module: ModuleInterface | undefined,
        action: ActionInterface | undefined
    ): OptionInterface | undefined {

        const match = (opt: OptionInterface) => this.matchOptionName(opt, name);
        
        if (scope === "global") return this._globalOptions.find(match);
        if (scope === "module" && module) return module.options?.find(match);
        if (scope === "action" && action) return action.options?.find(match);

        return undefined;
    }

    private setParsedOption(
        bucket: Record<string, ParsedOptionValue>,
        opt: OptionInterface,
        value: ParsedOptionValue
    ) {
        const key = opt.name;

        // Si déjà défini → conflit garanti
        if (bucket[key] !== undefined) {
            throw new Error(
                `Conflicting values for option '${key}' (flag: '${opt.long || opt.short}')`
            );
        }

        // Cas 1 : negative flag → store `false`
        if (opt.long && opt.long.startsWith("no-")) {
            bucket[key] = false;
            return;
        }

        // Cas 2 : option avec valeur explicite → `string`
        if (opt.expectsValue) {
            // value DOIT être un string
            if (typeof value !== "string") {
                throw new Error(`Option '${opt.long}' expects a value`);
            }
            bucket[key] = value;
            return;
        }

        // Cas 3 : simple flag → canonical value = longName
        // ex: --trace → "trace"
        if (opt.long) {
            bucket[key] = opt.long;
        } else if (opt.short) {
            // fallback exceptionnel : on ne devrait jamais arriver ici
            bucket[key] = opt.short;
        }
    }





    // ---------------------------------------------------------------------
    // PARSING
    // ---------------------------------------------------------------------
    private parseOptionForScope(
        scope: "global" | "module" | "action",
        token: string,
        parsed: ParsedCLI,
        currentModule?: ModuleInterface,
        currentAction?: ActionInterface,
        read?: () => string,
        peek?: () => string | undefined
    ) {
        const parsedTok = parseOptionToken(token);

        for (const name of parsedTok.names) {
            const opt = this.resolveOption(scope, name, currentModule, currentAction);

            if (!opt)
                throw new Error(`Unknown option '${token}' in scope ${scope}`);

            const bucket =
                scope === "global"
                    ? parsed.globalOptions
                    : scope === "module"
                        ? parsed.moduleOptions
                        : parsed.actionOptions;

            // NEGATED FLAG
            if (opt.negated) {
                this.setParsedOption(bucket, opt, false);
                continue;
            }

            // VALUE FLAG
            if (opt.expectsValue) {
                const val = peek!();
                if (!val || val.startsWith("-"))
                    throw new Error(`Option '${token}' expects a value`);
                read!();
                this.setParsedOption(bucket, opt, val);
                continue;
            }

            // BOOL FLAG
            this.setParsedOption(bucket, opt, true);
        }
    }



    parse(argv: string[]): ParsedCLI {

        const tokens = tokenize(argv);

        const parsed: ParsedCLI = {
            globalOptions: {},
            moduleOptions: {},
            actionOptions: {},
            args: []
        };

        let index = 0;
        let scope: "global" | "module" | "action" = "global";

        let currentModule: ModuleInterface | undefined = undefined;
        let currentAction: ActionInterface | undefined = undefined;

        const read = () => tokens[index++]!;
        const peek = () => tokens[index];

        while (index < tokens.length) {
            const t = read();

            // OPTION ?
            if (t.startsWith("-")) {
                this.parseOptionForScope(scope, t, parsed, currentModule, currentAction, read, peek);
                continue;
            }

            // MODULE ?
            if (scope === "global") {
                const mod = this.findModule(t);
                if (!mod) throw new Error(`Unknown module '${t}'`);
                parsed.module = mod.name;
                currentModule = mod;
                scope = "module";
                continue;
            }

            // ACTION ?
            if (scope === "module") {
                const act = this.findAction(currentModule!, t);
                if (!act) throw new Error(`Unknown action '${t}'`);
                parsed.action = act.name;
                currentAction = act;
                scope = "action";
                continue;
            }

            // ARGS
            if (scope === "action") {
                parsed.args.push(t);
                continue;
            }
        }

        this._parsed = parsed;
        return parsed;
    }

    // ---------------------------------------------------------------------
    // VALIDATION
    // ---------------------------------------------------------------------

    private validateArgsForAction(action: ActionInterface, args: string[]) {
        const sig = action.signature ?? [];
        let required = sig.filter(s => s.startsWith("<")).length;

        if (args.length < required)
            throw new Error(`Missing required arguments. Expected: ${sig.join(" ")}`);

        if (args.length > sig.length)
            throw new Error(`Too many arguments. Expected: ${sig.join(" ")}`);
    }



    validate(): boolean {
        if (!this._parsed) throw new Error("CLI not parsed");

        // TODO: add future validation rules (signature, required args...)

        const { module, action, args } = this._parsed;

        if (!module || !action) throw new Error("Module and/or Action is/are missing"); // no module/action → nothing to validate

        const mod = this.findModule(module)!;
        const act = this.findAction(mod, action)!;

        this.validateArgsForAction(act, args);

        this._parsedValidated = true;
        return true;
    }

    // ---------------------------------------------------------------------
    // EXECUTE
    // ---------------------------------------------------------------------

    exec(): boolean {
        if (!this._parsed) throw new Error("CLI not parsed");
        if (!this._parsedValidated) throw new Error("CLI not validated");

        const mod = this._modules.find(m => m.name === this._parsed!.module);
        if (!mod) throw new Error("Module missing");

        const act = mod.actions?.find(a => a.name === this._parsed!.action);
        if (!act) throw new Error("Action missing");

        act.run(
            this._parsed.actionOptions,
            this._parsed.args
        );

        return true;
    }


    private static validateSignatureDefinition(sig: string[]) {
        let optionalFound = false;

        for (const s of sig) {
            const isOpt = s.startsWith("[") && s.endsWith("]");
            const isReq = s.startsWith("<") && s.endsWith(">");

            if (!isOpt && !isReq)
                throw new Error(`Invalid signature token '${s}'. Use <arg> or [arg].`);

            if (optionalFound && isReq)
                throw new Error(`Invalid signature: required arg '${s}' cannot follow optional args.`);

            if (isOpt) optionalFound = true;
        }
    }

    static createModule(
        spec: ModuleInterface
    ): ModuleInterface {
        return {
            name: spec.name,
            description: spec.description || "",
            aliases: spec.aliases || [],
            options: spec.options || [],
            actions: spec.actions || []
        };
    }

    static createAction(
        spec: ActionInterface
    ): ActionInterface {
        if (spec.signature) this.validateSignatureDefinition(spec.signature);
        return {
            name: spec.name,
            aliases: spec.aliases || [],
            signature: spec.signature || [],
            description: spec.description || '',
            options: spec.options || [],
            daemon: spec.daemon || false,
            run: spec.run
        };
    }



}
