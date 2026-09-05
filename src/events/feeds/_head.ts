import { execute } from "@/index.core.js";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { each } from "@metreeca/flow/sinks";
import { fetch } from "@metreeca/gear-url";
import { focus, html, untag } from "@metreeca/gear-xml";

await execute(async () => pipe(
	items("https://agenda.coimbra.pt/event/2i52kwbxqg3i9xt5")
	(fetch())
	(html())
	(focus())
	(untag())
	(each(page => console.log("HEAD", JSON.stringify(page.slice(0, 200)))))
));
