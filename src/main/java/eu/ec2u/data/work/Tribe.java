package eu.ec2u.data.work;

import com.metreeca.core.Strings;
import com.metreeca.json.Frame;
import com.metreeca.json.Values;
import com.metreeca.rest.Xtream;
import com.metreeca.rest.actions.*;
import com.metreeca.xml.actions.Untag;
import com.metreeca.xml.actions.XPath;

import eu.ec2u.data.terms.EC2U;
import eu.ec2u.data.terms.Schema;
import org.eclipse.rdf4j.model.*;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.time.*;
import java.util.Optional;
import java.util.function.Function;

import static com.metreeca.core.Identifiers.md5;
import static com.metreeca.core.Strings.TextLength;
import static com.metreeca.json.Frame.frame;
import static com.metreeca.json.Values.iri;
import static com.metreeca.json.Values.literal;
import static com.metreeca.rest.formats.JSONFormat.json;

import static java.util.Map.entry;
import static java.util.function.Function.identity;
import static java.util.function.Predicate.not;
import static java.util.stream.Collectors.joining;


public final class Tribe implements Function<Instant, Xtream<Frame>> {

    private static final Period Delta=Period.ofDays(90);


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final String base;

    private IRI country;
    private IRI locality;
    private String language; // !!! as IRI


    public Tribe(final String base) {

        if ( base == null ) {
            throw new NullPointerException("null base");
        }

        this.base=base.endsWith("/") ? base.substring(0, base.length()-1) : base;
    }


    public Tribe country(final IRI country) {

        if ( country == null ) {
            throw new NullPointerException("null country");
        }

        this.country=country;

        return this;
    }

    public Tribe locality(final IRI locality) {

        if ( locality == null ) {
            throw new NullPointerException("null locality");
        }

        this.locality=locality;

        return this;
    }

    public Tribe language(final String language) {

        if ( language == null ) {
            throw new NullPointerException("null language"); // !!! well-formedness
        }

        this.language=language;

        return this;
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public Xtream<Frame> apply(final Instant instant) {

        if ( instant == null ) {
            throw new NullPointerException("null instant");
        }

        return crawl(instant).optMap(this::event);
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<JSONPath.Processor> crawl(final Instant synced) {
        return Xtream.of(synced)

                .flatMap(new Fill<Instant>()

                        .model(base+"/wp-json/tribe/events/v1/events/"
                                +"?per_page=100"
                                +"&start_date={start}"
                                +"&page={page}"
                        )

                        .value("start", LocalDate.now().minus(Delta))
                        .value("page", 1)

                )

                .scan(page -> Xtream.of(page)

                        .optMap(new GET<>(json()))
                        .map(JSONPath.Processor::new)

                        .map(path -> entry(
                                path.strings("next_rest_url"),
                                path.paths("events.*")
                        ))

                );
    }

    private Optional<Frame> event(final JSONPath.Processor event) {

        final Optional<Literal> title=event.string("title")
                .map(XPath::decode)
                .map(text -> literal(text, language));

        final Optional<Literal> excerpt=event.string("excerpt")
                .or(() -> event.string("description"))
                .map(Untag::untag)
                .filter(not(String::isEmpty)) // eg single image link
                .map(v -> Strings.clip(v, TextLength))
                .map(text -> literal(text, language));

        final Optional<Literal> description=event.string("description")
                .map(Untag::untag)
                .filter(not(String::isEmpty)) // eg single image link
                .map(text -> literal(text, language));

        return event.string("url").map(id -> frame(iri(EC2U.events, md5(id)))

                .value(RDF.TYPE, EC2U.Event)

                .value(RDFS.LABEL, title)
                .value(RDFS.COMMENT, excerpt)

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

            final Optional<Literal> name=category.string("name").map(text -> literal(text, language));

            return frame(iri(EC2U.concepts, md5(self)))

                    .value(RDFS.LABEL, name)
                    .value(SKOS.PREF_LABEL, name);

        });
    }

    private Optional<Frame> organizer(final JSONPath.Processor organizer) {
        return organizer.string("url").map(id -> frame(iri(EC2U.organizations, md5(id)))

                .value(Schema.url, organizer.string("website").flatMap(Work::url).map(Values::iri))
                .value(Schema.name, organizer.string("organizer").map(XPath::decode).map(text -> literal(text,
                        language)))
                .value(Schema.email, organizer.string("email").map(Values::literal))
                .value(Schema.telephone, organizer.string("phone").map(Values::literal))

        );
    }

    private Optional<Frame> location(final JSONPath.Processor location) {
        return location.string("url").map(id -> {

            // !!! lookup by name

            final Optional<Value> addressCountry=Optional.ofNullable(country);
            final Optional<Value> addressLocality=Optional.ofNullable(locality);
            final Optional<Value> streetAddress=location.string("address").map(Values::literal);

            return frame(iri(EC2U.locations, md5(id)))

                    .value(Schema.url, location.string("url").map(Values::iri))
                    .value(Schema.name, location.string("venue").map(text -> literal(text, language)))

                    .value(Schema.latitude, location.decimal("geo_lat").map(Values::literal))
                    .value(Schema.longitude, location.decimal("geo_lng").map(Values::literal))

                    .frame(Schema.address, frame(iri(EC2U.locations, md5(Xtream

                                    .of(addressCountry, addressLocality, streetAddress)

                                    .optMap(identity())
                                    .map(Value::stringValue)
                                    .collect(joining("\n"))

                            )))

                                    .value(Schema.addressCountry, addressCountry)
                                    .value(Schema.addressLocality, addressLocality)
                                    .value(Schema.streetAddress, streetAddress)

                                    .value(Schema.url, location.string("website").flatMap(Work::url).map(Values::iri))
                                    .value(Schema.email, location.string("email").map(Values::literal))
                                    .value(Schema.telephone, location.string("phone").map(Values::literal))
                    );

        });

    }

}
