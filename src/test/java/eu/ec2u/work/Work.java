/*
 * Copyright © 2021-2021 EC2U Consortium
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package eu.ec2u.work;

import com.metreeca.rest.Context;
import com.metreeca.rest.Xtream;
import com.metreeca.rest.actions.*;
import com.metreeca.rest.assets.Fetcher.CacheFetcher;

import org.junit.jupiter.api.Test;

import static com.metreeca.rest.assets.Fetcher.fetcher;
import static com.metreeca.xml.actions.XPath.XPath;
import static com.metreeca.xml.formats.XMLFormat.xml;

public final class Work {

	@Test void manifest() {
		new Context()

				.set(fetcher(), CacheFetcher::new)

				.exec(() -> Xtream

						.of("https://registry.erasmuswithoutpaper.eu/catalogue-v1.xml")

						.optMap(new Query())
						.optMap(new Fetch())
						.optMap(new Parse<>(xml()))

						.flatMap(XPath(path -> path.nodes("/_:catalogue/_:host[_:institutions-covered/_:hei-id[text()"
								+ "='unipv.it']]")))

						.forEach(System.out::println)

				);
	}

	@Test void echo() {
		new Context()

				.set(fetcher(), CacheFetcher::new)

				.exec(() -> Xtream

						.of("https://ewp.demo.usos.edu.pl/ewp/echo") // demo.usos.edu.pl

						.optMap(new Query())
						.optMap(new Fetch())
						.optMap(new Parse<>(xml()))

						.forEach(System.out::println)

				);

	}
}
