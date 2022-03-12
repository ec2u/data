/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.tasks.events;

import com.metreeca.json.Frame;
import com.metreeca.json.Values;
import com.metreeca.rest.Xtream;
import com.metreeca.rest.actions.*;
import com.metreeca.xml.actions.Untag;
import com.metreeca.xml.actions.XPath;

import eu.ec2u.data.ports.Universities;
import eu.ec2u.data.terms.EC2U;
import eu.ec2u.data.terms.Schema;
import eu.ec2u.data.work.Work;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.time.*;
import java.util.Optional;

import static com.metreeca.json.Frame.frame;
import static com.metreeca.json.Values.*;
import static com.metreeca.rest.formats.JSONFormat.json;

import static eu.ec2u.data.ports.Events.Event;
import static eu.ec2u.data.tasks.Tasks.exec;
import static eu.ec2u.data.tasks.Tasks.upload;
import static eu.ec2u.data.tasks.events.Events.synced;
import static eu.ec2u.data.work.Work.clip;
import static eu.ec2u.data.work.Work.*;

import static java.time.ZoneOffset.UTC;
import static java.util.function.Function.identity;
import static java.util.stream.Collectors.joining;

public final class EventsCoimbraUniversity implements Runnable {

    private static final String Language="pt";

    private static final Frame Publisher=frame(iri("https://agenda.uc.pt/"))
            .value(RDF.TYPE, EC2U.Publisher)
            .value(DCTERMS.COVERAGE, EC2U.University)
            .values(RDFS.LABEL,
                    localize("Agenda UC", "en"),
                    localize("Agenda UC", Language)
            );


    public static void main(final String... args) {
        exec(() -> new EventsCoimbraUniversity().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final ZonedDateTime now=ZonedDateTime.now(UTC);


    @Override public void run() {
        Xtream.of(synced(Publisher.focus()))

                .flatMap(this::crawl)
                .optMap(this::event)

                .optMap(new Validate(Event()))

                .sink(events -> upload(EC2U.events, events));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<JSONPath.Processor> crawl(final Instant synced) {
        return Xtream.of(synced)

                .flatMap(new Fill<Instant>()

                        .model("https://agenda.uc.pt/wp-json/tribe/events/v1/events/"
                                +"?per_page=100"
                                +"&start_date={page}"
                                +"&page={page}"
                        )

                        .value("start", LocalDateTime.now())
                        .value("page", 1)

                )

                .optMap(new GET<>(json()))

                .flatMap(new JSONPath<>(json -> json
                        .paths("events.*")
                ));
    }


    private Optional<Frame> event(final JSONPath.Processor event) {

        final Optional<Literal> title=event.string("title")
                .map(XPath::decode)
                .map(localize(Language));

        final Optional<Literal> excerpt=event.string("excerpt")
                .or(() -> event.string("description"))
                .map(Untag::untag)
                .map(v -> clip(v, TextSize))
                .map(localize(Language));

        final Optional<Literal> description=event.string("description")
                .map(Untag::untag)
                .map(localize(Language));

        return event.string("url").map(id -> frame(iri(EC2U.events, md5(id)))

                .value(RDF.TYPE, EC2U.Event)

                .value(RDFS.LABEL, title)
                .value(RDFS.COMMENT, description)

                .value(EC2U.university, Universities.Coimbra)
                .value(EC2U.updated, literal(now))

                .frame(DCTERMS.PUBLISHER, Publisher)
                .value(DCTERMS.SOURCE, event.string("url").flatMap(Work::url).map(Values::iri))

                .value(DCTERMS.CREATED, event.string("date_utc").map(Work::timestamp))
                .value(DCTERMS.MODIFIED, event.string("modified_utc").map(Work::timestamp))

                .frames(DCTERMS.SUBJECT, event.paths("categories.*").optMap(this::category))

                .value(Schema.url, event.string("url").flatMap(Work::url).map(Values::iri))
                .value(Schema.name, title)
                .value(Schema.image, event.string("image.url").flatMap(Work::url).map(Values::iri))
                .value(Schema.description, description)
                .value(Schema.disambiguatingDescription, excerpt)

                .value(Schema.startDate, event.string("utc_start_date").map(Work::timestamp))
                .value(Schema.endDate, event.string("utc_end_date").map(Work::timestamp))

                .bool(Schema.isAccessibleForFree, event
                        .string("cost").filter(v -> v.equalsIgnoreCase("livre")) // !!! localize
                        .isPresent()
                )

                .frame(Schema.location, event.path("venue").flatMap(this::location))
                .frames(Schema.organizer, event.paths("organizer.*").optMap(this::organizer))

        );

    }

    private Optional<Frame> category(final JSONPath.Processor category) {
        return category.string("urls.self").map(self -> {

            final Optional<Literal> name=category.string("name").map(localize(Language));

            return frame(iri(EC2U.concepts, md5(self)))

                    .value(RDFS.LABEL, name)
                    .value(SKOS.PREF_LABEL, name);

        });
    }

    private Optional<Frame> organizer(final JSONPath.Processor organizer) {
        return organizer.string("url").map(id -> frame(iri(EC2U.organizations, md5(id)))

                .value(Schema.url, organizer.string("website").flatMap(Work::url).map(Values::iri))
                .value(Schema.name, organizer.string("organizer").map(XPath::decode).map(localize(Language)))
                .value(Schema.email, organizer.string("email").map(Values::literal))
                .value(Schema.telephone, organizer.string("phone").map(Values::literal))

        );
    }

    private Optional<Frame> location(final JSONPath.Processor location) {
        return location.string("url").map(id -> {

            // !!! lookup by name

            final Frame defaults=EventsCoimbra.Defaults;

            final Optional<Value> addressCountry=defaults.value(Schema.addressCountry);
            final Optional<Value> addressLocality=defaults.value(Schema.addressLocality);
            final Optional<Value> postalCode=defaults.value(Schema.postalCode);
            final Optional<Value> streetAddress=location.string("address").map(Values::literal);

            return frame(iri(EC2U.locations, md5(id)))

                    .value(Schema.url, location.string("url").map(Values::iri))
                    .value(Schema.name, location.string("venue").map(localize(Language)))

                    .value(Schema.latitude, location.decimal("geo_lat").map(Values::literal))
                    .value(Schema.longitude, location.decimal("geo_lng").map(Values::literal))

                    .frame(Schema.address, frame(iri(EC2U.locations, md5(Xtream

                                    .of(addressCountry, addressLocality, postalCode, streetAddress)

                                    .optMap(identity())
                                    .map(Value::stringValue)
                                    .collect(joining("\n"))

                            )))

                                    .value(Schema.addressCountry, addressCountry)
                                    .value(Schema.addressLocality, addressLocality)
                                    .value(Schema.postalCode, postalCode)
                                    .value(Schema.streetAddress, streetAddress)

                                    .value(Schema.url, location.string("website").flatMap(Work::url).map(Values::iri))
                                    .value(Schema.email, location.string("email").map(Values::literal))
                                    .value(Schema.telephone, location.string("phone").map(Values::literal))
                    );

        });

    }

}
