/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.loaders;

import com.metreeca.open.actions.WikidataMirror;
import com.metreeca.rest.Xtream;

import eu.ec2u.data.Data;

import static eu.ec2u.data.loaders.Loaders.exec;

public final class Wikidata implements Runnable {

	public static void main(final String... args) {
		exec(() -> new Wikidata().run());
	}


	@Override public void run() {
		Xtream

				.of("?item wdt:P463 wd:Q105627243") // <member of> <EC2U>

				.sink(new WikidataMirror()
						.contexts(Data.wikidata)
				);
	}

}
