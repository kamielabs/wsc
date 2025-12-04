import { ToolsOrchestrator } from "@services";
import { CliManager } from "@core";

export const ToolsModule = CliManager.createModule({
        name: "tools",
        description: "Utilities: index, docs",
        aliases: ["t", "utils"],
        actions: [
            CliManager.createAction({
                name: "index",
                aliases: ["i"],
                description: "",
                run: () => new ToolsOrchestrator().generateIndexes()
            }),
            CliManager.createAction({
                name: "paths",
                aliases: ["p"],
                description: "",
                run: () => new ToolsOrchestrator().generatePaths()
            }),
            CliManager.createAction({
                name: "all",
                aliases: ["a"],
                description: "",
                run: () => new ToolsOrchestrator().generateAll()
            })
        ]
});