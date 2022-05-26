/*
 * Copyright © 2021-2022 EC2U Consortium
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

package eu.ec2u.data.tasks.events;

import com.metreeca.core.Strings;
import com.metreeca.json.Frame;
import com.metreeca.json.Values;
import com.metreeca.rest.Xtream;
import com.metreeca.rest.actions.*;
import com.metreeca.xml.actions.Untag;
import com.metreeca.xml.actions.XPath;

import eu.ec2u.data.cities.Poitiers;
import eu.ec2u.data.terms.EC2U;
import eu.ec2u.data.terms.Schema;
import eu.ec2u.data.work.RSS;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.Optional;

import static com.metreeca.core.Identifiers.md5;
import static com.metreeca.json.Frame.frame;
import static com.metreeca.json.Values.iri;
import static com.metreeca.json.Values.literal;
import static com.metreeca.xml.formats.XMLFormat.xml;

import static eu.ec2u.data.ports.Events.Event;
import static eu.ec2u.data.tasks.Tasks.exec;
import static eu.ec2u.data.tasks.Tasks.upload;
import static eu.ec2u.data.tasks.events.Events.synced;

import static java.time.ZoneOffset.UTC;

public final class EventsPoitiersCityGrand implements Runnable {

    private static final Frame Publisher=frame(iri("https://sortir.grandpoitiers.fr/"))
            .value(RDF.TYPE, EC2U.Publisher)
            .value(DCTERMS.COVERAGE, EC2U.City)
            .values(RDFS.LABEL,
                    literal("Grand Poitiers / Events", "en"),
                    literal("Grand Poitiers / Sortir", Poitiers.Language)
            );


    public static void main(final String... args) {
        exec(() -> new EventsPoitiersCityGrand().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final OffsetDateTime now=Instant.now().atOffset(UTC);


    @Override public void run() {
        Xtream.of(synced(Publisher.focus()))

                .flatMap(this::crawl)
                .optMap(this::event)

                .optMap(new Validate(Event()))

                .sink(events -> upload(EC2U.events, events));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<XPath.Processor> crawl(final Instant synced) {
        return Xtream.of(synced)

                .flatMap(new Fill<Instant>()
                        .model("https://sortir.grandpoitiers.fr/agenda/rss")
                )

                .optMap(new GET<>(xml()))

                .flatMap(new XPath<>(xml -> xml.paths("/rss/channel/item")));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Optional<Frame> event(final XPath.Processor item) {

        return item.link("link").map(url -> {

            final Optional<Literal> name=item.string("title")
                    .map(text -> literal(text, Poitiers.Language));

            final Optional<Literal> description=item.string("description")
                    .map(Untag::untag)
                    .map(text -> literal(text, Poitiers.Language));

            final Optional<Literal> disambiguatingDescription=description
                    .map(Value::stringValue)
                    .map(Strings::clip)
                    .map(text -> literal(text, Poitiers.Language));

            final Optional<Literal> pubDate=RSS.pubDate(item)
                    .map(Values::literal);


            return frame(iri(EC2U.events, md5(url)))

                    .values(RDF.TYPE, EC2U.Event, Schema.Event)
                    .value(RDFS.LABEL, name)
                    .value(RDFS.COMMENT, disambiguatingDescription)

                    .value(DCTERMS.TITLE, name)
                    .value(DCTERMS.DESCRIPTION, disambiguatingDescription)
                    .frame(DCTERMS.SUBJECT, category(item))

                    .value(EC2U.university, Poitiers.University)

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
                    .value(Schema.endDate, datetime(item, "ev:enddate"))

                    .value(Schema.inLanguage, literal(Poitiers.Language));

        });
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Optional<Literal> datetime(final XPath.Processor xml, final String xpath) {
        return xml.string(xpath)
                .map(OffsetDateTime::parse)
                .map(OffsetDateTime::toLocalDateTime)
                .map(v -> v.atOffset(Poitiers.TimeZone.getRules().getOffset(v)))
                .map(Values::literal);
    }

    private Optional<Frame> category(final XPath.Processor item) {
        return item.string("category").map(category -> {

            final Literal label=literal(category, Poitiers.Language);

            return frame(iri(EC2U.concepts, md5(category)))
                    .value(RDFS.LABEL, label)
                    .value(SKOS.PREF_LABEL, label);

        });
    }

}
