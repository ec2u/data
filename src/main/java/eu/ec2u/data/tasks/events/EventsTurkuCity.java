/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.tasks.events;

import com.metreeca.json.Frame;
import com.metreeca.json.Values;
import com.metreeca.rest.Xtream;
import com.metreeca.rest.actions.Clean;
import com.metreeca.rest.actions.Fill;
import com.metreeca.xml.actions.Untag;

import eu.ec2u.data.Data;
import eu.ec2u.work.*;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.io.ByteArrayInputStream;
import java.time.*;
import java.util.Collection;
import java.util.Map;
import java.util.function.UnaryOperator;

import static com.metreeca.json.Frame.frame;
import static com.metreeca.json.Values.*;
import static com.metreeca.rest.formats.JSONFormat.json;
import static com.metreeca.xml.formats.HTMLFormat.html;

import static eu.ec2u.data.tasks.Tasks.exec;
import static eu.ec2u.data.tasks.events.EventsAll.synced;

import static java.nio.charset.StandardCharsets.UTF_8;
import static java.time.ZoneOffset.UTC;
import static java.time.format.DateTimeFormatter.ISO_LOCAL_DATE;
import static java.util.Arrays.stream;
import static java.util.stream.Collectors.toSet;

public final class EventsTurkuCity implements Runnable {

	private static final Frame Publisher=frame(iri("https://kalenteri.turku.fi/"))
			.values(RDFS.LABEL,
					literal("City of Turku Event's Calendar", "en"),
					literal("Turun kaupungin tapahtumakalenteri", "fi")
			);


	public static void main(final String... args) {
		exec(() -> new EventsTurkuCity().run());
	}


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	private final ZonedDateTime now=ZonedDateTime.now(UTC);

	@Override public void run() {
		Xtream.of(synced(Publisher.focus()))

				.flatMap(new Fill<Instant>()
						.model("https://api.turku.fi/linkedevents/v1/event/"
								+"?last_modified_since={since}"
						)
						.value("since", synced ->
								LocalDate.ofInstant(synced, UTC).format(ISO_LOCAL_DATE)
						)
				)

				.loop(events -> Xtream.of(events)
						.optMap(new GET<>(json()))
						.optMap(new JSONPath<>(json -> json.string("meta.next")))
				)

				.optMap(new GET<>(json()))
				.flatMap(new JSONPath<>(json -> json.values("data.*")))

				.map(new JSONPath<>(this::convert))

				.sink(EventsAll::upload);
	}


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	private Frame convert(final JSONPath.Processor event) {

		final String id=event.string("@id").orElseThrow();

		final Collection<Literal> name=event.entries("name")
				.filter(entry -> Data.langs.contains(entry.getKey()))
				.map(this::local)
				.map(this::normalize)
				.collect(toSet());

		final Collection<Literal> description=event.entries("short_description")
				.filter(entry -> Data.langs.contains(entry.getKey()))
				.map(this::local)
				.map(this::untag)
				.map(this::normalize)
				.collect(toSet());

		return frame(iri(Data.events, md5(id)))

				.value(RDF.TYPE, Data.Event)
				.values(RDFS.LABEL, name)
				.values(RDFS.COMMENT, description)

				.value(Data.university, Data.Turku)
				.value(Data.retrieved, literal(now))

				.frame(DCTERMS.PUBLISHER, Publisher)
				.value(DCTERMS.SOURCE, iri(id))
				.value(DCTERMS.ISSUED, event.string("date_published").map(v -> literal(v, XSD.DATETIME)))
				.value(DCTERMS.CREATED, event.string("created_time").map(v -> literal(v, XSD.DATETIME)))
				.value(DCTERMS.MODIFIED, event.string("last_modified_time").map(v -> literal(v, XSD.DATETIME)))

				// !!! keywords

				.value(Schema.url, event.string("info_url").map(Values::iri))

				.values(Schema.name, name)
				.values(Schema.image, event.strings("images.*.url").map(Values::iri))
				.values(Schema.disambiguatingDescription, description)

				.values(Schema.description, event.entries("description")
						.filter(entry -> Data.langs.contains(entry.getKey()))
						.map(this::local)
						.map(this::untag)
				)

				// !!! provider
				// !!! offers

				.value(Schema.isAccessibleForFree, event.bools("offers.*.is_free")
						.filter(v -> v)
						.findFirst()
						.map(Values::literal)
				)

				.value(Schema.eventStatus, event.string("event_status")
						.filter(v -> stream(Schema.EventStatus.values()).map(Enum::name).anyMatch(v::equals))
						.map(status -> iri(Schema.Name, status))
				)

				// !!! super_events
				// !!! sub_events

				// !!! location
				// !!! is_virtualevent

				.value(Schema.startDate, event.string("start_time").map(v -> literal(v, XSD.DATETIME)))
				.value(Schema.endDate, event.string("end_time").map(v -> literal(v, XSD.DATETIME)))

				// !!! in_language

				.values(Schema.audience, event.strings("audience.*.@id").map(Values::iri)) // !!! mapping

				;
	}


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	private Literal local(final Map.Entry<String, JSONPath.Processor> entry) {
		return literal(entry.getValue().string("").orElseThrow(), entry.getKey());
	}


	private Literal normalize(final Literal literal) {
		return normalize(literal, Clean::normalize);
	}

	private Literal normalize(final Literal literal, final UnaryOperator<String> normalizer) {
		return literal.getLanguage()
				.map(lang -> literal(normalizer.apply(literal.stringValue()), lang))
				.orElseGet(() -> literal(normalizer.apply(literal.stringValue()), literal.getDatatype()));
	}


	private Literal untag(final Literal literal) {
		return normalize(literal, text -> html(new ByteArrayInputStream(text.getBytes(UTF_8)), UTF_8.name(), "").fold(

				error -> text, value -> new Untag().apply(value)

		));
	}

}
