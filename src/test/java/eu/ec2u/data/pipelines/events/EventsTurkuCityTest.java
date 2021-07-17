/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.pipelines.events;

import com.metreeca.json.Frame;
import com.metreeca.rdf4j.actions.Upload;
import com.metreeca.rest.Xtream;
import com.metreeca.rest.actions.*;
import com.metreeca.rest.formats.JSONFormat;

import eu.ec2u.data.schemas.EC2U;
import eu.ec2u.data.schemas.Schema;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.vocabulary.*;
import org.junit.jupiter.api.Test;

import java.util.*;
import java.util.stream.Stream;

import javax.json.*;

import static com.metreeca.json.Frame.frame;
import static com.metreeca.json.Values.*;
import static com.metreeca.rest.formats.JSONFormat.json;

import static eu.ec2u.work.Work.exec;

final class EventsTurkuCityTest {

	@Test void test() {
		exec(() -> Xtream

				.of("2021-07-01") // !!! last sync

				.flatMap(new Fill<String>()
						.model("https://api.turku.fi/linkedevents/v1/event/"
								+"?last_modified_since={since}"
								+"&show_deleted=True"
						)
						.value("since", date -> date)
				)

				.loop(events -> fetch(events)

						.map(results -> results.getJsonObject("meta"))
						.map(meta -> meta.get("next"))

						.filter(JsonString.class::isInstance)
						.map(JsonString.class::cast)

						.map(JsonString::getString)

						.stream()
				)

				.flatMap(page -> fetch(page)
						.map(results -> results.getJsonArray("data"))
						.stream()
				)

				.flatMap(Collection::stream)
				.map(JsonValue::asJsonObject)

				//.limit(1) // !!!

				.map(this::convert)
				.flatMap(Frame::model)

				.batch(100_000)

				.forEach(new Upload()
						.clear(true) // !!! incremental sync
						.contexts(EC2U.events)
				)

		);
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

	private Frame convert(final JsonObject event) {

		final String id=event.getString("@id");

		return frame(iri(EC2U.events, md5(id)))

				.value(RDF.TYPE, Schema.Event)
				.value(OWL.SAMEAS, iri(id))

				.value(DCTERMS.CREATED, dateTime(event, "created_time"))
				.value(DCTERMS.MODIFIED, dateTime(event, "last_modified_time"))

				.value(EC2U.university, EC2U.Turku)

				.values(Schema.name, locals(event, "name"))
				.values(Schema.description, locals(event, "description"))

				.value(Schema.startDate, dateTime(event, "start_time"))
				.value(Schema.endDate, dateTime(event, "end_time"));
	}


	private Stream<Literal> locals(final JsonObject json, final String field) {
		return values(json, field)
				.map(entry -> literal(((JsonString)entry.getValue()).getString(), entry.getKey()));
	}

	private Optional<Literal> dateTime(final JsonObject json, final String field) {
		return string(json, field).map(modified -> literal(modified, XSD.DATETIME));
	}

	private Optional<String> string(final JsonObject json, final String field) {
		return json.get(field) instanceof JsonString
				? Optional.of(json.getString(field))
				: Optional.empty();
	}

	private Stream<Map.Entry<String, JsonValue>> values(final JsonObject json, final String field) {
		return json.get(field) instanceof JsonObject
				? json.getJsonObject(field).entrySet().stream()
				: Stream.empty();
	}

}