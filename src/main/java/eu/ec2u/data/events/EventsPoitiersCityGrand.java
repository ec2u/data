/*
 * Copyright © 2020-2024 EC2U Alliance
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

import com.metreeca.http.actions.Fill;
import com.metreeca.http.actions.GET;
import com.metreeca.http.toolkits.Strings;
import com.metreeca.http.work.Xtream;
import com.metreeca.http.xml.XPath;
import com.metreeca.http.xml.actions.Untag;
import com.metreeca.http.xml.formats.XML;
import com.metreeca.link.Frame;

import eu.ec2u.data.EC2U;
import eu.ec2u.data.concepts.OrganizationTypes;
import eu.ec2u.data.things.Schema;
import eu.ec2u.work.feeds.RSS;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.SKOS;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.Optional;

import static com.metreeca.http.toolkits.Identifiers.md5;
import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.update;
import static eu.ec2u.data.events.Events.*;
import static eu.ec2u.data.events.Events_.updated;
import static eu.ec2u.data.resources.Resources.partner;
import static eu.ec2u.data.things.Schema.Organization;
import static eu.ec2u.data.universities._Universities.Poitiers;
import static java.time.ZoneOffset.UTC;

public final class EventsPoitiersCityGrand implements Runnable {

    private static final IRI Context=iri(Events.Context, "/poitiers/city/grand");

    private static final com.metreeca.link.Frame Publisher=com.metreeca.link.Frame.frame(

            field(ID, iri("https://sortir.grandpoitiers.fr/")),
            field(TYPE, Organization),

            field(partner, Poitiers.Id),

            field(Schema.name,
                    literal("Grand Poitiers / Events", "en"),
                    literal("Grand Poitiers / Sortir", Poitiers.Language)
            ),

            field(Schema.about, OrganizationTypes.City)

    );


    public static void main(final String... args) {
        exec(() -> new EventsPoitiersCityGrand().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final OffsetDateTime now=Instant.now().atOffset(UTC);


    @Override public void run() {
        update(connection -> Xtream.of(updated(Context, Publisher.id().orElseThrow()))

                .flatMap(this::crawl)
                .optMap(this::event)

                .flatMap(Frame::stream)
                .batch(0)

                .forEach(new Events_.Loader(Context))
        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<XPath> crawl(final Instant updated) {
        return Xtream.of(updated)

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
                    .map(Frame::literal);


            return frame(

                    field(ID, iri(Events.Context, md5(url))),

                    field(RDF.TYPE, Events.Event),

                    field(Schema.url, iri(url)),
                    field(Schema.name, name),
                    field(Schema.image, item.link("enclosure/@url").map(Frame::iri)),
                    field(Schema.description, description),
                    field(Schema.disambiguatingDescription, disambiguatingDescription),

                    field(startDate, datetime(item, "ev:startdate")),
                    field(endDate, datetime(item, "ev:enddate")),

                    // field(DCTERMS.CREATED, pubDate),
                    // field(DCTERMS.MODIFIED, pubDate.orElseGet(() -> literal(now))),

                    field(Schema.about, category(item)),

                    field(partner, Poitiers.Id),
                    field(publisher, Publisher)

            );
        });
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Optional<Literal> datetime(final XPath xml, final String xpath) {
        return xml.string(xpath)
                .map(OffsetDateTime::parse)
                .map(OffsetDateTime::toLocalDateTime)
                .map(v -> v.atOffset(Poitiers.TimeZone.getRules().getOffset(v)))
                .map(Frame::literal);
    }

    private Optional<Frame> category(final XPath item) {
        return item.string("category").map(category -> {

            final Literal label=literal(category, Poitiers.Language);

            return frame(

                    field(ID, EC2U.item(Events.Topics, category)),

                    field(RDF.TYPE, SKOS.CONCEPT),
                    field(SKOS.TOP_CONCEPT_OF, Events.Topics),
                    field(SKOS.PREF_LABEL, label)

            );

        });
    }

}
