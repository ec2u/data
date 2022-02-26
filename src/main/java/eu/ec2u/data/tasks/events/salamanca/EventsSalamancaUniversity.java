/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.tasks.events.salamanca;

import com.metreeca.json.Frame;
import com.metreeca.json.Values;
import com.metreeca.rest.Xtream;
import com.metreeca.rest.actions.*;
import com.metreeca.xml.actions.Untag;
import com.metreeca.xml.actions.XPath;
import com.metreeca.xml.formats.HTMLFormat;

import eu.ec2u.data.ports.Events;
import eu.ec2u.data.ports.Universities;
import eu.ec2u.data.terms.EC2U;
import eu.ec2u.data.terms.Schema;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.io.ByteArrayInputStream;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.Optional;

import static com.metreeca.json.Frame.frame;
import static com.metreeca.json.Values.*;
import static com.metreeca.rest.Toolbox.service;
import static com.metreeca.rest.services.Logger.logger;
import static com.metreeca.xml.formats.XMLFormat.xml;

import static eu.ec2u.data.tasks.Tasks.exec;
import static eu.ec2u.data.tasks.Tasks.upload;
import static eu.ec2u.data.tasks.events.Events.synced;
import static eu.ec2u.data.terms.Schema.Event;

import static java.nio.charset.StandardCharsets.UTF_8;
import static java.time.ZoneOffset.UTC;
import static java.time.format.DateTimeFormatter.RFC_1123_DATE_TIME;

public final class EventsSalamancaUniversity implements Runnable {

    private static final IRI Title=term("title");
    private static final IRI Link=term("link");
    private static final IRI PubDate=term("pubDate");
    private static final IRI Description=term("description");
    private static final IRI Encoded=iri("http://purl.org/rss/1.0/modules/content/", "encoded");


    private static final Frame Publisher=frame(iri("https://sac.usal.es/"))
            .value(RDF.TYPE, EC2U.Publisher)
            .value(DCTERMS.COVERAGE, EC2U.University)
            .values(RDFS.LABEL,
                    literal("Cultural Activities Services", "en"),
                    literal("Servicio de Actividades Culturales", "es")
            );


    public static void main(final String... args) {
        exec(() -> new EventsSalamancaUniversity().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final ZonedDateTime now=ZonedDateTime.now(UTC);


    @Override public void run() {
        Xtream.of(synced(Publisher.focus()))

                .flatMap(this::crawl)
                .map(this::event)

                .optMap(new Validate(Events.Event()))

                .sink(events -> upload(EC2U.events, events));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<Frame> crawl(final Instant synced) {
        return Xtream.of(synced)

                .flatMap(new Fill<Instant>()
                        .model("https://sac.usal.es/role-member/feed/")
                )

                .optMap(new GET<>(xml()))

                .flatMap(new XPath<>(xpath -> xpath.elements("/rss/channel/item")))

                .map(new XPath<>(item -> frame(bnode())

                        .string(Title, item.string("title"))
                        .value(Link, item.link("link").map(Values::iri))
                        .string(DC.CREATOR, item.string("dc:creator"))

                        .value(PubDate, item.string("pubDate")
                                .map(RFC_1123_DATE_TIME::parse)
                                .map(ZonedDateTime::from)
                                .map(Values::literal)
                        )

                        .string(Description, item.string("description"))
                        .string(Encoded, item.string("content:encoded")

                                .map(html -> HTMLFormat.html(new ByteArrayInputStream(html.getBytes(UTF_8)),
                                        UTF_8.name(), ""))

                                .flatMap(either -> either.fold(

                                        error -> {

                                            service(logger()).warning(this, String.format(
                                                    "malformed content / %s", error.getMessage()
                                            ));

                                            return Optional.empty();

                                        },

                                        Optional::of

                                ))

                                .map(new Untag())
                        )
                ));
    }

    private Frame event(final Frame frame) {

        final Optional<Value> label=frame.value(Title).map(value -> localize(value, "es"));
        final Optional<Value> brief=frame.value(Encoded).map(value -> localize(value, "es"));

        return frame(iri(EC2U.events, frame.skolemize(Link)))

                .values(RDF.TYPE, EC2U.Event, Event)
                .value(RDFS.LABEL, label)
                .value(RDFS.COMMENT, brief)

                .value(DCTERMS.ISSUED, frame.value(PubDate))
                .value(EC2U.university, Universities.Salamanca)
                .value(EC2U.updated, literal(now))

                .frame(DCTERMS.PUBLISHER, Publisher)
                .value(DCTERMS.SOURCE, frame.value(Link))

                .value(Schema.name, label)
                .value(Schema.description, brief)
                .value(Schema.url, frame.value(Link))

                ;
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Value localize(final Value value, final String lang) {
        return literal(value)

                .filter(object -> object.getDatatype().equals(XSD.STRING))

                .map(Value::stringValue)
                .map(text -> literal(text, lang))
                .map(Value.class::cast)

                .orElse(value);
    }

}
