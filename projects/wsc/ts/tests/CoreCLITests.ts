import { CLI } from "@kamie-oss/core";

async function main() {

	const cli = CLI.init({
		modules: {
			test: {
				actions: {
					test: {},
					test2: {}
				}
			}
		}

	});



	cli.hooks().onModuleAction("test", 'test', async ({ runtime }) => {
		console.log("Hook test OK ! ")
		console.log(runtime.globals);
	})
	cli.hooks().onModuleAction("test", "test2", async () => {
		console.log("Hook test2 ok also !")
	})

	cli.run();

}

main();
