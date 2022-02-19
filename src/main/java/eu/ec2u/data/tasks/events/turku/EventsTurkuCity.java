/*
 * Copyright © 2022 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.tasks.events.turku;

import com.metreeca.json.Frame;
import com.metreeca.json.Values;
import com.metreeca.rest.Xtream;
import com.metreeca.rest.actions.*;
import com.metreeca.text.actions.Normalize;
import com.metreeca.xml.actions.Untag;

import eu.ec2u.data.ports.Universities;
import eu.ec2u.data.terms.EC2U;
import eu.ec2u.data.terms.Schema;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.io.ByteArrayInputStream;
import java.time.*;
import java.util.*;
import java.util.function.UnaryOperator;
import java.util.stream.Stream;

import javax.json.JsonValue;

import static com.metreeca.json.Frame.frame;
import static com.metreeca.json.Values.*;
import static com.metreeca.json.shifts.Seq.seq;
import static com.metreeca.rest.formats.JSONFormat.json;
import static com.metreeca.xml.formats.HTMLFormat.html;

import static eu.ec2u.data.ports.Events.Event;
import static eu.ec2u.data.tasks.Tasks.exec;
import static eu.ec2u.data.tasks.Tasks.upload;
import static eu.ec2u.data.tasks.events.Events.synced;

import static java.nio.charset.StandardCharsets.UTF_8;
import static java.time.ZoneOffset.UTC;
import static java.time.format.DateTimeFormatter.ISO_LOCAL_DATE;
import static java.util.Arrays.stream;
import static java.util.stream.Collectors.toList;
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

		final List<Frame> events=Xtream.of(synced(Publisher.focus()))

				.flatMap(this::crawl)
				.flatMap(this::event)

				.optMap(new Validate(Event()))

				.collect(toList());

		final List<Frame> locations=Xtream.from(events)

				.optMap(event -> event.value(seq(Schema.location, Schema.url)))
				.optMap(Values::iri)
				.map(Value::stringValue)
				.distinct()

				.optMap(new GET<>(json()))

				.map(new JSONPath<>(this::location))

				.optMap(new Validate(Schema.Location()))

				.collect(toList());

		upload(EC2U.events, events);
		upload(EC2U.locations, locations);
	}


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	private Xtream<JsonValue> crawl(final Instant synced) {
		return Xtream.of(synced)

				.flatMap(new Fill<Instant>()
						.model("https://linkedevents-api.turku.fi/v1/event/"
								+"?last_modified_since={since}"
						)
						.value("since", since ->
								LocalDate.ofInstant(since, UTC).format(ISO_LOCAL_DATE)
						)
				)

				.loop(batch -> Xtream.of(batch)
						.optMap(new GET<>(json()))
						.optMap(new JSONPath<>(json -> json.string("meta.next")))
				)

				.optMap(new GET<>(json()))

				.flatMap(new JSONPath<>(json -> json.values("data.*")));
	}


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	private Xtream<Frame> event(final JsonValue value) {
		return Xtream.of(value).map(new JSONPath<>(json -> {

			final String id=json.string("@id").orElseThrow();

			final Collection<Literal> name=local(json.entries("name"));

			final Collection<Literal> description=json.entries("short_description")
					.filter(entry -> EC2U.langs.contains(entry.getKey()))
					.map(this::local)
					.flatMap(Optional::stream)
					.map(this::untag)
					.map(this::normalize)
					.collect(toSet());

			return frame(iri(EC2U.events, md5(id)))

					.value(RDF.TYPE, EC2U.Event)

					.values(RDFS.LABEL, name)
					.values(RDFS.COMMENT, description)

					.value(EC2U.university, Universities.Turku)
					.value(EC2U.updated, literal(now))

					.frame(DCTERMS.PUBLISHER, Publisher)
					.value(DCTERMS.SOURCE, iri(id))
					.value(DCTERMS.ISSUED, json.string("date_published").map(v -> literal(v, XSD.DATETIME)))
					.value(DCTERMS.CREATED, json.string("created_time").map(v -> literal(v, XSD.DATETIME)))
					.value(DCTERMS.MODIFIED, json.string("last_modified_time").map(v -> literal(v,
							XSD.DATETIME)))

					// !!! keywords

					.value(Schema.url, json.string("info_url").map(Values::iri))

					.values(Schema.name, name)
					.values(Schema.image, json.strings("images.*.url").map(Values::iri))
					.values(Schema.disambiguatingDescription, description)
					.values(Schema.description, local(json.entries("description")))

					// !!! provider
					// !!! offers

					.value(Schema.isAccessibleForFree, json.bools("offers.*.is_free")
							.filter(v -> v)
							.findFirst()
							.map(Values::literal)
					)

					.value(Schema.eventStatus, json.string("event_status")
							.filter(v -> stream(Schema.EventStatus.values()).map(Enum::name).anyMatch(v::equals))
							.map(status -> iri(Schema.Namespace, status))
					)

					// !!! is_virtualevent
					// !!! super_events
					// !!! sub_events

					.frame(Schema.location, json.string("location.@id").map(Values::iri).map(iri ->
							frame(iri(EC2U.locations, md5(iri.stringValue()))).value(Schema.url, iri)
					))

					.value(Schema.startDate, json.string("start_time").map(v -> literal(v, XSD.DATETIME)))
					.value(Schema.endDate, json.string("end_time").map(v -> literal(v, XSD.DATETIME)))

					// !!! in_language

					.values(Schema.audience, json.strings("audience.*.@id").map(Values::iri)); // !!! mapping

		}));
	}

	private Frame location(final JSONPath.Processor json) {

		final String id=json.string("@id").orElseThrow();

		return frame(iri(EC2U.locations, md5(id)))

				.value(RDF.TYPE, json.string("@type").map(Schema::term).orElse(Schema.Place))

				.value(Schema.url, iri(id))

				.values(Schema.name, local(json.entries("name")))
				.values(Schema.description, local(json.entries("description")))

				.frame(Schema.address, frame(iri())
						.values(Schema.addressCountry, local(json.entries("address_country")))
						.values(Schema.addressRegion, local(json.entries("address_region")))
						.values(Schema.addressLocality, local(json.entries("address_locality")))
						.values(Schema.postalCode, local(json.entries("postal_code")))
						.values(Schema.streetAddress, local(json.entries("street_address")))
				)

				.value(Schema.longitude, json.decimal("position.coordinates.0").map(Values::literal))
				.value(Schema.latitude, json.decimal("position.coordinates.1").map(Values::literal));
	}


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	private Set<Literal> local(final Stream<Map.Entry<String, JSONPath.Processor>> values) {
		return values
				.filter(entry -> EC2U.langs.contains(entry.getKey()))
				.map(this::local)
				.flatMap(Optional::stream)
				.map(this::normalize)
				.collect(toSet());
	}

	private Optional<Literal> local(final Map.Entry<String, JSONPath.Processor> entry) {
		return entry.getValue().string("").map(text -> literal(text, entry.getKey()));
	}


	private Literal normalize(final Literal literal) {
		return normalize(literal, new Normalize()
				.space(true)
				.smart(true)
		);
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
