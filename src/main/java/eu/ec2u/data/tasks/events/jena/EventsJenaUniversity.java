/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.tasks.events.jena;

import com.metreeca.json.Frame;
import com.metreeca.json.Values;
import com.metreeca.rdf.actions.Localize;
import com.metreeca.rdf.actions.Normalize;
import com.metreeca.rest.Xtream;
import com.metreeca.rest.actions.*;
import com.metreeca.xml.actions.XPath;

import eu.ec2u.data.ports.Universities;
import eu.ec2u.data.terms.EC2U;
import eu.ec2u.data.terms.Schema;
import org.eclipse.rdf4j.model.vocabulary.*;
import org.eclipse.rdf4j.rio.jsonld.JSONLDParser;

import java.io.ByteArrayInputStream;
import java.time.*;
import java.util.Collection;

import static com.metreeca.json.Frame.frame;
import static com.metreeca.json.Values.*;
import static com.metreeca.rdf.formats.RDFFormat.rdf;
import static com.metreeca.xml.formats.HTMLFormat.html;

import static eu.ec2u.data.ports.Events.Event;
import static eu.ec2u.data.tasks.events.Events.synced;

import static java.nio.charset.StandardCharsets.UTF_8;
import static java.time.ZoneOffset.UTC;

public final class EventsJenaUniversity implements Runnable {

    private static final Frame Publisher=frame(iri("https://www.uni-jena.de/veranstaltungskalender"))
            .value(RDF.TYPE, EC2U.Publisher)
            .value(DCTERMS.COVERAGE, EC2U.University)
            .values(RDFS.LABEL,
                    literal("Upcoming Events", "en"),
                    literal("Kommende Veranstaltungen", "de")
            );


    public static void main(final String... args) {
        exec(() -> new EventsJenaUniversity().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final ZonedDateTime now=ZonedDateTime.now(UTC);


    @Override public void run() {
        Xtream.of(synced(Publisher.focus()))

                .flatMap(this::crawl)
                .map(this::event)

                .optMap(new Validate(Event()))

                .sink(events -> upload(EC2U.events, events));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<Frame> crawl(final Instant synced) {
        return Xtream.of(synced)

                .flatMap(new Fill<Instant>()
                        .model("https://www.uni-jena.de/veranstaltungskalender")
                )


                // paginate through catalog

                .loop(batch -> Xtream.of(batch)
                        .optMap(new GET<>(html()))
                        .filter(new XPath<>(xpath -> xpath

                                // ;( pagination links are disabled under javascript control: test for page links

                                .link("//div[@class='entry_wrapper unijena']//a[@class='link']/@href")
                                .isPresent()

                        )::apply)
                        .flatMap(new XPath<>(xpath -> xpath
                                .links("//div[@class='pagination']//li[last()]/a/@href")
                        ))
                )

                // extract detail links

                .optMap(new GET<>(html()))

                .flatMap(new XPath<>(xpath -> xpath
                        .links("//div[@class='entry_wrapper unijena']//a[@class='link']/@href")
                ))


                // extract JSON-LD

                .optMap(new GET<>(html()))

                .optMap(new XPath<>(xpath -> xpath
                        .string("//script[@type='application/ld+json']")
                ))

                .flatMap(json -> rdf(new ByteArrayInputStream(json.getBytes(UTF_8)), null, new JSONLDParser())
                        .get()
                        .stream()
                        .flatMap(Collection::stream)
                )

                .map(com.metreeca.rdf.schemas.Schema::normalize)

                .map(new Normalize(
                        value -> literal(value)

                                .filter(object -> object.getDatatype().equals(iri("http://schema.org/Date")))

                                .map(date -> date.stringValue().replaceFirst("\\+\\d{2}", "$0:"))
                                .map(date -> OffsetDateTime.parse(date).toZonedDateTime().withZoneSameInstant(UTC))

                                .map(Values::literal)
                ))

                .map(new Localize("de"))

                .batch(0)

                .flatMap(model -> frame(Schema.Event, model)
                        .values(inverse(RDF.TYPE))
                        .map(event -> frame(event, model))
                );
    }

    private Frame event(final Frame frame) {
        return frame
                .value(RDF.TYPE, Schema.Event)
                .frame(DCTERMS.PUBLISHER, Publisher)
                .value(EC2U.university, Universities.Jena)
                .value(EC2U.updated, literal(now));
    }

}
