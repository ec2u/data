/*
 * Copyright © 2021 EC2U Consortium
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

import com.metreeca.rdf4j.actions.Upload;
import com.metreeca.rest.Xtream;
import com.metreeca.rest.actions.*;
import com.metreeca.xml.actions.XPath;

import eu.ec2u.data.schemas.EC2U;
import eu.ec2u.data.schemas.EWP;
import org.eclipse.rdf4j.model.vocabulary.*;
import org.junit.jupiter.api.Test;

import static com.metreeca.json.Frame.frame;
import static com.metreeca.json.Values.*;
import static com.metreeca.rest.Xtream.entry;
import static com.metreeca.xml.formats.XMLFormat.xml;
import static eu.ec2u.work.Work.exec;
import static java.lang.String.format;

final class Crawl {

	@Test void echo() {
		exec(() -> Xtream

				.of("https://ewp.demo.usos.edu.pl/ewp/echo") // demo.usos.edu.pl

				.optMap(new Query())
				.optMap(new Fetch())
				.optMap(new Parse<>(xml()))

				.forEach(System.out::println)

		);

	}


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	@Test void hosts() {
		exec(() -> Xtream

				.of(
						entry("production", "https://registry.erasmuswithoutpaper.eu/catalogue-v1.xml"),
						entry("development", "https://dev-registry.erasmuswithoutpaper.eu/catalogue-v1.xml")
				)

				.flatMap(manifest -> Xtream

						.of(manifest.getValue())

						.optMap(new Query())
						.optMap(new Fetch())
						.optMap(new Parse<>(xml()))

						.flatMap(new XPath<>(catalog -> catalog.nodes("/_:catalogue/_:host")))

						.flatMap(new XPath<>(host -> host

								.strings("_:institutions-covered/_:hei-id")

								.filter(EC2U.Universities::containsKey)

								.flatMap(hei -> host

										.nodes("_:apis-implemented/*")

										.flatMap(new XPath<>(api -> api

												.strings("*[contains(local-name(), 'url')]/text()")

												.bagMap(url -> { // !!! refactor

															final String specs=api
																	.string("namespace-uri()")
																	.orElse("");

															final String qname=api.string("name()")
																	.orElse("");

															final String label=format("%s / %s", hei, qname);

															return frame(iri(format("urn:uuid:%s", uuid(label))))

																	.set(RDF.TYPE).value(EWP.Host)
																	.set(RDFS.LABEL).value(literal(label))

																	.set(EC2U.university).value(EC2U.university(hei))

																	.set(EWP.network).frame(frame(iri(manifest.getValue()))
																			.set(RDFS.LABEL).value(literal(manifest.getKey()))
																	)

																	.set(EWP.api).frame(frame(iri(specs))
																			.set(RDF.TYPE).value(EWP.API)
																			.set(RDFS.LABEL).value(literal(qname))
																	)

																	.set(EWP.url).value(literal(url, XSD.ANYURI))

																	.model();
														}
												)
										))

								)
						)))

				.batch(0) // avoid multiple truth-maintenance rounds

				.forEach(new Upload()
						.clear(true)
						.contexts(iri(EC2U.Base, "/ewp/"))
				)

		);
	}

}
