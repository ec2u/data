/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.work.ewp;

import com.metreeca.json.Frame;
import com.metreeca.json.Values;
import com.metreeca.rdf4j.actions.Upload;
import com.metreeca.rest.Xtream;
import com.metreeca.rest.actions.*;
import com.metreeca.xml.actions.XPath;

import eu.ec2u.data.Data;
import org.eclipse.rdf4j.model.vocabulary.*;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.Map.Entry;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static com.metreeca.json.Frame.frame;
import static com.metreeca.json.Values.*;
import static com.metreeca.rest.Xtream.entry;
import static com.metreeca.xml.formats.XMLFormat.xml;

import static eu.ec2u.data.pipelines.Work.exec;

import static java.lang.String.format;
import static java.util.function.Function.identity;
import static java.util.stream.Collectors.toMap;

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

	private static final Pattern APIPattern=Pattern.compile(
			"https://github.com/erasmus-without-paper"
					+"/ewp-specs-api-(?<function>[-\\w]+)"
					+"/blob/(?<version>[-\\w]+)"
					+"/manifest-entry.xsd"
	);


	@Test void hosts() {
		exec(() -> Xtream

				.of(
						entry("production", "https://registry.erasmuswithoutpaper.eu/catalogue-v1.xml"),
						entry("development", "https://dev-registry.erasmuswithoutpaper.eu/catalogue-v1.xml")
				)

				.flatMap(network -> Xtream

						.of(network.getValue())

						.optMap(new Query())
						.optMap(new Fetch())
						.optMap(new Parse<>(xml()))

						.flatMap(new XPath<>(catalog -> catalog.nodes("/_:catalogue/_:host")))

						.flatMap(new XPath<>(host -> host.strings("_:institutions-covered/_:hei-id")

								.filter(Data.Universities::containsKey)

								.flatMap(hei -> host.nodes("_:apis-implemented/*")

										.map(new XPath<>(api -> host(hei, network(network),

												api(api.string("namespace-uri()").orElse("")),
												urls(api.strings("*[contains(local-name(), 'url')]/text()"))

										)))

										.flatMap(Frame::model)

								)
						))
				)

				.batch(0) // avoid multiple truth-maintenance rounds

				.forEach(new Upload()
						.clear(true)
						.contexts(iri(Data.Base, "/ewp/"))
				)

		);
	}


	private Frame host(final String hei, final Frame network, final Frame api, final Map<String, String> urls) {

		final String label=format("%s / %s / %s", hei,
				network.label().orElse("<?>"),
				api.label().orElse("<?>")
		);

		return frame(iri(format("urn:uuid:%s", uuid(label))))

				.value(RDF.TYPE, EWP.Host)
				.value(RDFS.LABEL, literal(label))

				.value(Data.university, Data.Universities.get(hei))

				.value(EWP.hei, literal(hei))
				.frame(EWP.network, network)
				.values(EWP.provider, urls.values().stream().map(Values::literal))

				.frame(EWP.api, api)
				.values(EWP.url, urls.keySet().stream().map(url -> literal(url, XSD.ANYURI)));
	}

	private Frame network(final Entry<String, String> network) {
		return frame(iri(network.getValue()))

				.value(RDF.TYPE, EWP.Network)
				.value(RDFS.LABEL, literal(network.getKey()));

	}

	private Frame api(final String specs) {
		return Optional.of(specs)

				.map(APIPattern::matcher)
				.filter(Matcher::matches)

				.map(matcher -> {

					final String function=matcher.group("function");
					final String version=matcher.group("version");

					return frame(iri(specs))

							.value(RDF.TYPE, EWP.API)
							.value(RDFS.LABEL, literal(format("%s / %s", function, version)))

							.value(EWP.function, literal(function))
							.value(EWP.version, literal(version));

				})

				.orElseThrow(() -> new RuntimeException("malformed API url"));
	}

	private Map<String, String> urls(final Stream<String> urls) {
		return urls.collect(toMap(identity(), url -> Optional.of(url)
				.map(IRIPattern::matcher)
				.filter(Matcher::matches)
				.map(m -> m.group("host"))
				.orElse("<?>")
		));
	}

}