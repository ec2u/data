/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.pipelines.events.turku;

import com.metreeca.json.Frame;
import com.metreeca.json.Values;
import com.metreeca.rdf4j.actions.Upload;
import com.metreeca.rest.Xtream;
import com.metreeca.rest.actions.*;
import com.metreeca.rest.formats.JSONFormat;

import eu.ec2u.data.Data;
import eu.ec2u.work.link.*;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.vocabulary.*;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.*;

import javax.json.JsonObject;

import static com.metreeca.json.Frame.frame;
import static com.metreeca.json.Values.*;
import static com.metreeca.rest.formats.JSONFormat.json;

import static eu.ec2u.work.Work.exec;

import static java.time.format.DateTimeFormatter.ISO_LOCAL_DATE;
import static java.util.Arrays.stream;
import static java.util.stream.Collectors.toSet;

final class EventsTurkuCityTest {

	private static final IRI Publisher=iri("https://kalenteri.turku.fi/en/events/calendar");


	@Test void test() {
		exec(() -> Xtream

				.of(LocalDate.of(2021, 8, 1).format(ISO_LOCAL_DATE)) // !!! last update

				.flatMap(new Fill<String>()
						.model("https://api.turku.fi/linkedevents/v1/event/"
								+"?last_modified_since={since}"
								+"&show_deleted=True"
						)
						.value("since", date -> date)
				)

				.loop(events -> fetch(events)
						.flatMap(new JSONPath<>(json -> json.string("meta.next")))
						.stream()
				)

				.optMap(this::fetch)
				.flatMap(new JSONPath<>(json -> json.values("data.*")))

				.map(new JSONPath<>(this::convert))

				.flatMap(Frame::model)

				.batch(100_000)

				.peek(new Report())

				.forEach(new Upload()
						.clear(true) // !!! incremental sync
						.contexts(Data.events)
				)

		);
	}


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	private Frame convert(final JSONPath.Processor event) {

		final String id=event.string("@id").orElseThrow();

		final Collection<Literal> name=event.entries("name").map(this::local).collect(toSet());
		final Collection<Literal> description=event.entries("short_description").map(this::local).collect(toSet());

		return frame(iri(Data.events, md5(id)))

				.value(RDF.TYPE, Data.Event)
				.values(RDFS.LABEL, name)
				.values(RDFS.COMMENT, description)

				.value(Data.university, Data.Turku)

				.value(DCTERMS.PUBLISHER, Publisher)
				.value(DCTERMS.SOURCE, iri(id))
				.value(DCTERMS.ISSUED, event.string("date_published").map(this::dateTime))
				.value(DCTERMS.CREATED, event.string("created_time").map(this::dateTime))
				.value(DCTERMS.MODIFIED, event.string("last_modified_time").map(this::dateTime))

				// !!! keywords

				.value(Schema.url, event.string("info_url").map(Values::iri))

				.values(Schema.name, name)
				.values(Schema.disambiguatingDescription, description)
				.values(Schema.description, event.entries("description").map(this::local))
				.values(Schema.image, event.strings("images.*.url").map(Values::iri))

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

				.value(Schema.startDate, event.string("start_time").map(this::dateTime))
				.value(Schema.endDate, event.string("end_time").map(this::dateTime))

				// !!! in_language
				// !!! audience

				;
	}


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	private Optional<JsonObject> fetch(final String page) {
		return Optional.of(page)

				.flatMap(new Query(request -> request
						.header("Accept", JSONFormat.MIME)
				))

				.flatMap(new Fetch())
				.flatMap(new Parse<>(json()));
	}

	private Literal local(final Map.Entry<String, JSONPath.Processor> entry) {
		return literal(entry.getValue().string("").orElseThrow(), entry.getKey());
	}

	private Literal dateTime(final String value) {
		return literal(value, XSD.DATETIME);
	}

}