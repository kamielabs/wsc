import { WatcherOrchestrator } from "@services";
import { CliManager } from "@core";


export const WatcherModule = CliManager.createModule({
	name: "watcher",
	description: "Watcher: Background processes for tools",
	aliases: ["watch", "w"],
	actions: [
		CliManager.createAction({
			name: "start",
			aliases: ["st"],
			description: "",
			run: () => new WatcherOrchestrator().start()
		}),
		CliManager.createAction({
			name: "stop",
			aliases: ["sp"],
			description: "",
			run: () => new WatcherOrchestrator().stop()
		}),
		CliManager.createAction({
			name: "status",
			aliases: ["ss"],
			description: "",
			run: () => new WatcherOrchestrator().status()
		}),
		CliManager.createAction({
			name: "restart",
			aliases: ["rs"],
			description: "",
			run: () => new WatcherOrchestrator().restart()
		}),
	]
});
