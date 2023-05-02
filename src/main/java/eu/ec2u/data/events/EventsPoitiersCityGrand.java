/*
 * Copyright © 2020-2023 EC2U Alliance
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package eu.ec2u.data.events;

import com.metreeca.core.Xtream;
import com.metreeca.core.actions.Fill;
import com.metreeca.core.toolkits.Strings;
import com.metreeca.http.actions.GET;
import com.metreeca.rdf.Frame;
import com.metreeca.rdf.Values;
import com.metreeca.xml.XPath;
import com.metreeca.xml.actions.Untag;
import com.metreeca.xml.formats.XML;

import eu.ec2u.data.Data;
import eu.ec2u.data.EC2U;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.things.Schema;
import eu.ec2u.work.feeds.RSS;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.RDFS;
import org.eclipse.rdf4j.model.vocabulary.SKOS;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.Set;

import static com.metreeca.core.toolkits.Identifiers.md5;
import static com.metreeca.rdf.Frame.frame;
import static com.metreeca.rdf.Values.iri;
import static com.metreeca.rdf.Values.literal;

import static eu.ec2u.data.EC2U.University.Poitiers;
import static eu.ec2u.data.events.Events.Event;
import static eu.ec2u.data.events.Events.synced;
import static eu.ec2u.work.validation.Validators.validate;
import static java.time.ZoneOffset.UTC;

public final class EventsPoitiersCityGrand implements Runnable {

    private static final IRI Context=iri(Events.Context, "/poitiers/city/grand");

    private static final Frame Publisher=frame(iri("https://sortir.grandpoitiers.fr/"))
            .value(RDF.TYPE, Resources.Publisher)
            .value(DCTERMS.COVERAGE, EC2U.City)
            .values(RDFS.LABEL,
                    literal("Grand Poitiers / Events", "en"),
                    literal("Grand Poitiers / Sortir", Poitiers.Language)
            );


    public static void main(final String... args) {
        Data.exec(() -> new EventsPoitiersCityGrand().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final OffsetDateTime now=Instant.now().atOffset(UTC);


    @Override public void run() {
        Xtream.of(synced(Context, Publisher.focus()))

                .flatMap(this::crawl)
                .optMap(this::event)

                .pipe(events -> validate(Event(), Set.of(Event), events))

                .forEach(new Events.Updater(Context));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<XPath> crawl(final Instant synced) {
        return Xtream.of(synced)

                .flatMap(new Fill<Instant>()
                        .model("https://sortir.grandpoitiers.fr/agenda/rss")
                )

                .optMap(new GET<>(new XML()))

                .map(XPath::new)
                .flatMap(xml -> xml.paths("/rss/channel/item"));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Optional<Frame> event(final XPath item) {

        return item.link("link").map(url -> {

            final Optional<Literal> name=item.string("title")
                    .map(XPath::decode)
                    .map(text -> literal(text, Poitiers.Language));

            final Optional<Literal> description=item.string("description")
                    .map(XPath::decode)
                    .map(Untag::untag)
                    .map(text -> literal(text, Poitiers.Language));

            final Optional<Literal> disambiguatingDescription=description
                    .map(Value::stringValue)
                    .map(Strings::clip)
                    .map(text -> literal(text, Poitiers.Language));

            final Optional<Literal> pubDate=RSS.pubDate(item)
                    .map(Values::literal);


            return frame(iri(Events.Context, md5(url)))

                    .values(RDF.TYPE, Events.Event)

                    .frame(DCTERMS.SUBJECT, category(item))

                    .value(Resources.university, Poitiers.Id)

                    .value(DCTERMS.SOURCE, iri(url))
                    .frame(DCTERMS.PUBLISHER, Publisher)
                    .value(DCTERMS.CREATED, pubDate)
                    .value(DCTERMS.MODIFIED, pubDate.orElseGet(() -> literal(now)))

                    .value(Schema.url, iri(url))
                    .value(Schema.name, name)
                    .value(Schema.image, item.link("enclosure/@url").map(Values::iri))
                    .value(Schema.description, description)
                    .value(Schema.disambiguatingDescription, disambiguatingDescription)

                    .value(Schema.startDate, datetime(item, "ev:startdate"))
                    .value(Schema.endDate, datetime(item, "ev:enddate"));

        });
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Optional<Literal> datetime(final XPath xml, final String xpath) {
        return xml.string(xpath)
                .map(OffsetDateTime::parse)
                .map(OffsetDateTime::toLocalDateTime)
                .map(v -> v.atOffset(Poitiers.TimeZone.getRules().getOffset(v)))
                .map(Values::literal);
    }

    private Optional<Frame> category(final XPath item) {
        return item.string("category").map(category -> {

            final Literal label=literal(category, Poitiers.Language);

            return frame(EC2U.item(Events.Scheme, category))
                    .value(RDF.TYPE, SKOS.CONCEPT)
                    .value(SKOS.TOP_CONCEPT_OF, Events.Scheme)
                    .value(RDFS.LABEL, label)
                    .value(SKOS.PREF_LABEL, label);

        });
    }

}
