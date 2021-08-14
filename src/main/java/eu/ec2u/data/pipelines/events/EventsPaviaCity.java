/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.pipelines.events;

import com.metreeca.json.Frame;
import com.metreeca.rdf4j.actions.Upload;
import com.metreeca.rest.Xtream;
import com.metreeca.rest.actions.Fill;

import eu.ec2u.data.Data;
import eu.ec2u.work.link.*;
import org.eclipse.rdf4j.model.*;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import static com.metreeca.json.Frame.frame;
import static com.metreeca.json.Values.*;
import static com.metreeca.json.shifts.Seq.seq;
import static com.metreeca.xml.formats.HTMLFormat.html;

import static java.time.ZoneOffset.UTC;
import static java.util.stream.Collectors.toList;

public final class EventsPaviaCity implements Runnable {

	private static final Frame Publisher=frame(iri("http://www.vivipavia.it/site/home/eventi.html"))
			.values(RDFS.LABEL,
					literal("ViviPavia", "en"),
					literal("ViviPavia", "it")
			);


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	private final Instant updated;


	public EventsPaviaCity(final Instant updated) {

		if ( updated == null ) {
			throw new NullPointerException("null updated");
		}

		this.updated=updated;
	}


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	@Override public void run() {
		Xtream

				.of(LocalDate.ofInstant(updated, UTC).format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))

				.flatMap(new Fill<String>()
						.model("http://www.vivipavia.it/site/cdq/listSearchArticle.jsp"
								+"?new=yes"
								+"&instance=10"
								+"&channel=34"
								+"&size=9999"
								+"&node=4613"
								+"&fromDate=%{date}"
						)
						.value("date")
				)

				.optMap(new GET<>(html()))
				.flatMap(new Microdata())
				.map(Schema::normalize)
				.batch(0)

				.flatMap(model -> frame(Schema.Event, model)
						.strings(seq(inverse(RDF.TYPE), Schema.url))
				)

				.flatMap(url -> Xtream.of(url)

						.optMap(new GET<>(html()))
						.flatMap(new Microdata())

						.map(Schema::normalize)
						.map(new DateNormalize())
						.map(new DateExtend())

						.batch(0)

						.flatMap(model -> frame(Schema.Event, model) // !!! skolemize references
								.frames(inverse(RDF.TYPE))
								.map(event -> refocus(event, iri(Data.events, md5(url)))
										.value(RDF.TYPE, Data.Event)
										.values(RDFS.LABEL, event.values(Schema.name))
										.frame(DCTERMS.PUBLISHER, Publisher)
										.value(DCTERMS.SOURCE, iri(url))
										.value(Data.university, Data.Pavia)
								)
						)
				)

				.flatMap(Frame::model)
				.batch(100_000)

				.peek(new Report()) // !!!

				.forEach(new Upload()
						// .clear(true) // !!! incremental sync
						.contexts(Data.events)
				);
	}


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	private Frame refocus(final Frame frame, final IRI target) {
		return frame(target, frame.model()
				.map(statement -> rewrite(frame.focus(), target, statement))
				.collect(toList())
		);
	}

	private Statement rewrite(final Value source, final IRI target, final Statement statement) {
		return statement(
				rewrite(source, target, statement.getSubject()),
				rewrite(source, target, statement.getPredicate()),
				rewrite(source, target, statement.getObject())
		);
	}

	private Value rewrite(final Value source, final Value target, final Value value) {
		return value.equals(source) ? target : value;
	}

	private Resource rewrite(final Value source, final Resource target, final Resource value) {
		return value.equals(source) ? target : value;
	}

	private IRI rewrite(final Value source, final IRI target, final IRI value) {
		return value.equals(source) ? target : value;
	}

}
