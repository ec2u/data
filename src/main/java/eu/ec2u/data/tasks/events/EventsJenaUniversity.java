/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.tasks.events;

import com.metreeca.json.Frame;
import com.metreeca.json.Values;
import com.metreeca.rest.Xtream;
import com.metreeca.rest.actions.GET;
import com.metreeca.rest.actions.Validate;
import com.metreeca.xml.actions.XPath;

import eu.ec2u.data.ports.Universities;
import eu.ec2u.data.terms.EC2U;
import eu.ec2u.data.terms.Schema;
import eu.ec2u.data.work.Work;
import eu.ec2u.data.work.locations.Jena;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.vocabulary.*;
import org.eclipse.rdf4j.rio.jsonld.JSONLDParser;

import java.io.ByteArrayInputStream;
import java.time.*;
import java.util.*;

import static com.metreeca.json.Frame.frame;
import static com.metreeca.json.Values.*;
import static com.metreeca.rdf.formats.RDFFormat.rdf;
import static com.metreeca.xml.formats.HTMLFormat.html;

import static eu.ec2u.data.ports.Events.Event;
import static eu.ec2u.data.tasks.Tasks.exec;
import static eu.ec2u.data.tasks.Tasks.upload;
import static eu.ec2u.data.tasks.events.Events.synced;
import static eu.ec2u.data.work.Work.location;

import static java.nio.charset.StandardCharsets.UTF_8;
import static java.time.ZoneOffset.UTC;

public final class EventsJenaUniversity implements Runnable {

    private static final Frame Publisher=frame(iri("https://www.uni-jena.de/veranstaltungskalender"))
            .value(RDF.TYPE, EC2U.Publisher)
            .value(DCTERMS.COVERAGE, EC2U.University)
            .values(RDFS.LABEL,
                    literal("Upcoming Events", "en"),
                    localize("Kommende Veranstaltungen", "de")
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
        return Xtream

                .of(
                        "https://www.uni-jena.de/veranstaltungskalender",
                        "https://www.uni-jena.de/international/veranstaltungskalender",
                        "https://www.uni-jena.de/kalenderstudiuminternational",
                        "https://www.uni-jena.de/ec2u-veranstaltungen",
                        "https://www.uni-jena.de/promotion-events"
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

                .batch(0)

                .flatMap(model -> frame(Schema.Event, model)
                        .values(inverse(RDF.TYPE))
                        .map(event -> frame(event, model))
                );
    }

    private Frame event(final Frame frame) {

        final Optional<Literal> label=frame.string(Schema.name)
                .map(text -> localize(text, "de"));

        final Optional<Literal> brief=frame.string(Schema.disambiguatingDescription)
                .or(() -> frame.string(Schema.description))
                .map(text -> localize(text, "de"));

        return frame(iri(EC2U.events, frame.skolemize(Schema.url)))

                .value(RDF.TYPE, EC2U.Event)
                .value(RDFS.LABEL, label)
                .value(RDFS.COMMENT, label)

                .value(EC2U.university, Universities.Jena)
                .value(EC2U.updated, literal(now))

                .value(DCTERMS.SOURCE, frame.value(Schema.url))
                // !!! dct:issued/created/modified
                .frame(DCTERMS.PUBLISHER, Publisher)
                // !!! dct:subject

                .value(RDF.TYPE, Schema.Event)

                .value(Schema.name, label)
                .value(Schema.disambiguatingDescription, brief)

                .value(Schema.description, frame.string(Schema.description)
                        .or(() -> frame.string(Schema.disambiguatingDescription))
                        .map(text -> localize(text, "de"))
                )

                .value(Schema.image, frame.value(Schema.image))
                .value(Schema.url, frame.value(Schema.url))

                // !!! schema:typicalAgeRange

                .bool(Schema.isAccessibleForFree, frame.bool(Schema.isAccessibleForFree))

                .string(Schema.inLanguage, frame.string(Schema.inLanguage) // retain only language
                        .map(tag -> tag.toLowerCase(Locale.ROOT).replaceAll("^([a-z]+).*$", "$1"))
                )

                .value(Schema.startDate, datetime(frame.string(Schema.startDate)))
                .value(Schema.endDate, datetime(frame.string(Schema.endDate)))

                .frame(Schema.organizer, frame.frame(Schema.organizer)
                        .map(organizer -> Work.organizer(organizer, "de"))
                )

                .frame(Schema.location, frame.frame(Schema.location)
                        .map(location -> location(location, frame(bnode())
                                .value(Schema.addressCountry, Jena.Germany)
                                .value(Schema.addressLocality, Jena.Jena)))

                );

    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static Literal localize(final String text, final String lang) {
        return literal(text, lang);
    }

    private Optional<Literal> datetime(final Optional<String> datetime) {
        return datetime
                .map(date -> date.replaceFirst("\\+\\d{2}", "$0:")) // fix broken zone
                .map(OffsetDateTime::parse)
                .map(Values::literal);
    }

}