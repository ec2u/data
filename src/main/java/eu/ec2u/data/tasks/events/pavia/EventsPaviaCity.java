/*
 * Copyright © 2022 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.tasks.events.pavia;

import com.metreeca.json.Frame;
import com.metreeca.rdf.actions.Localize;
import com.metreeca.rdf.actions.Normalize;
import com.metreeca.rdf.actions.Normalize.DateToDateTime;
import com.metreeca.rdf.actions.Normalize.StringToDate;
import com.metreeca.rdf.schemas.Schema;
import com.metreeca.rdf4j.actions.Microdata;
import com.metreeca.rest.Xtream;
import com.metreeca.rest.actions.*;

import eu.ec2u.data.Data;
import eu.ec2u.data.ports.Universities;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.time.*;
import java.time.format.DateTimeFormatter;

import static com.metreeca.json.Frame.frame;
import static com.metreeca.json.Values.*;
import static com.metreeca.json.shifts.Seq.seq;
import static com.metreeca.xml.formats.HTMLFormat.html;

import static eu.ec2u.data.ports.Events.Event;
import static eu.ec2u.data.tasks.Tasks.exec;
import static eu.ec2u.data.tasks.events.Events.synced;
import static eu.ec2u.data.tasks.events.Events.upload;

import static java.time.ZoneOffset.UTC;

public final class EventsPaviaCity implements Runnable {

	private static final Frame Publisher=frame(iri("http://www.vivipavia.it/site/home/eventi.html"))
			.values(RDFS.LABEL,
					literal("ViviPavia", "en"),
					literal("ViviPavia", "it")
			);


	public static void main(final String... args) {
		exec(() -> new EventsPaviaCity().run());
	}


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	private final ZonedDateTime now=ZonedDateTime.now(UTC);


	@Override public void run() {
		Xtream.of(synced(Publisher.focus()))

				.flatMap(this::crawl)
				.flatMap(this::event)

				.sink(events -> upload(Data.events, events));
	}


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	private Xtream<String> crawl(final Instant synced) {
		return Xtream.of(synced)

				.flatMap(new Fill<Instant>()
						.model("http://www.vivipavia.it/site/cdq/listSearchArticle.jsp"
								+"?new=yes"
								+"&instance=10"
								+"&channel=34"
								+"&size=9999"
								+"&node=4613"
								+"&fromDate=%{date}"
						)
						.value("date", date -> LocalDate.ofInstant(date, UTC)
								.atStartOfDay(UTC)
								.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
						)
				)

				.optMap(new GET<>(html()))
				.flatMap(new Microdata())
				.map(Schema::normalize)
				.batch(0)

				.flatMap(model -> frame(Schema.Event, model)
						.strings(seq(inverse(RDF.TYPE), Schema.url))
				);
	}


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	private Xtream<Frame> event(final String url) {
		return Xtream.of(url)

				.optMap(new GET<>(html()))
				.flatMap(new Microdata())

				.map(new Normalize(
						new StringToDate(),
						new DateToDateTime()
				))

				.map(new Localize("it"))

				.batch(0)

				.flatMap(model -> frame(Schema.Event, model)

						.frames(inverse(RDF.TYPE))
						.map(frame -> event(frame.value(DCTERMS.SOURCE, iri(url))))

				)

				.optMap(new Validate(Event()));
	}

	private Frame event(final Frame frame) {
		return frame(iri(Data.events, frame.skolemize(DCTERMS.SOURCE)))

				.values(RDF.TYPE, Data.Event, Schema.Event)
				.values(RDFS.LABEL, frame.values(Schema.name))

				.value(Data.university, Universities.Pavia)
				.value(Data.retrieved, literal(now))

				.frame(DCTERMS.PUBLISHER, Publisher)
				.value(DCTERMS.SOURCE, frame.value(DCTERMS.SOURCE))

				.values(Schema.name, frame.values(Schema.name))
				.values(Schema.description, frame.values(Schema.description))
				.values(Schema.disambiguatingDescription, frame.values(Schema.disambiguatingDescription))
				.values(Schema.image, frame.values(Schema.image))
				.values(Schema.url, frame.values(Schema.url))

				.value(Schema.startDate, frame.value(Schema.startDate))
				.value(Schema.endDate, frame.value(Schema.endDate))
				.value(Schema.eventStatus, frame.value(Schema.eventStatus))
				.value(Schema.typicalAgeRange, frame.value(Schema.typicalAgeRange))

				.frame(Schema.location, frame.frame(Schema.location).map(this::location));
	}

	private Frame location(final Frame frame) {
		return frame(iri(Data.locations, md5(frame.skolemize(Schema.name))))

				.values(RDF.TYPE, frame.values(RDF.TYPE))
				.values(RDFS.LABEL, frame.values(Schema.name))

				.value(Schema.name, frame.value(Schema.name))
				.frame(Schema.address, frame.frame(Schema.address).map(this::address));
	}

	private Frame address(final Frame frame) {
		return frame(iri(Data.locations, frame.skolemize(Schema.addressLocality, Schema.streetAddress)))

				.values(RDF.TYPE, frame.values(RDF.TYPE))

				.value(Schema.addressCountry, frame.value(Schema.addressCountry)) // !!! default
				.value(Schema.addressRegion, frame.value(Schema.addressRegion)) // !!! default
				.value(Schema.addressLocality, frame.value(Schema.addressLocality)) // !!! default
				.value(Schema.postalCode, frame.value(Schema.postalCode).orElseGet(() -> literal("27100")))

				.value(Schema.email, frame.value(Schema.email))
				.value(Schema.telephone, frame.value(Schema.telephone))
				.value(Schema.faxNumber, frame.value(Schema.faxNumber))
				.value(Schema.streetAddress, frame.value(Schema.streetAddress));
	}

}
