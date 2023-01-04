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

package eu.ec2u.data._tasks.events;

import com.metreeca.core.Xtream;
import com.metreeca.core.actions.Fill;
import com.metreeca.core.toolkits.Strings;
import com.metreeca.http.actions.GET;
import com.metreeca.link.Frame;
import com.metreeca.link.Values;
import com.metreeca.xml.XPath;
import com.metreeca.xml.actions.Untag;
import com.metreeca.xml.codecs.XML;

import eu.ec2u.data._cities.Salamanca;
import eu.ec2u.data._terms.EC2U;
import eu.ec2u.data._terms.Schema;
import eu.ec2u.data._work.RSS;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.time.Instant;
import java.util.Optional;
import java.util.Set;

import static com.metreeca.core.toolkits.Identifiers.md5;
import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.iri;
import static com.metreeca.link.Values.literal;

import static eu.ec2u.data._ports.Events.Event;
import static eu.ec2u.data._tasks.Tasks.*;
import static eu.ec2u.data._tasks.events.Events.synced;

import static java.time.ZoneOffset.UTC;

public final class EventsSalamancaCitySACIS implements Runnable {

    private static final Frame Publisher=frame(iri("https://www.salamanca.com/actividades-eventos-propuestas-agenda"
            +"-salamanca/"))
            .value(RDF.TYPE, EC2U.Publisher)
            .value(DCTERMS.COVERAGE, EC2U.City)
            .values(RDFS.LABEL,
                    literal("SACIS - Salamanca Cooperative Society of Social Initiative", "en"),
                    literal("SACIS - Salamanca Sociedad Cooperativa de Iniciativa Social", Salamanca.Language)
            );


    public static void main(final String... args) {
        exec(() -> new EventsSalamancaCitySACIS().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Instant now=Instant.now();


    @Override public void run() {
        Xtream.of(synced(Publisher.focus()))

                .flatMap(this::crawl)
                .optMap(this::event)

                .sink(events -> upload(EC2U.events,
                        validate(Event(), Set.of(EC2U.Event), events)
                ));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<XPath> crawl(final Instant synced) {
        return Xtream.of(synced)

                .flatMap(new Fill<Instant>()
                        .model("https://www.salamanca.com/events/feed/")
                )

                .optMap(new GET<>(new XML()))

                .map(XPath::new)
                .flatMap(xml -> xml.paths("/rss/channel/item"));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Optional<Frame> event(final XPath item) {

        return item.link("link").map(url -> {

            final Optional<Literal> name=item.string("title")
                    .map(text -> literal(text, Salamanca.Language));

            final Optional<Literal> description=item.string("description")
                    .map(Untag::untag)
                    .map(text -> literal(text, Salamanca.Language));

            final Optional<Literal> disambiguatingDescription=description
                    .map(Value::stringValue)
                    .map(Strings::clip)
                    .map(text -> literal(text, Salamanca.Language));

            final Optional<Literal> pubDate=RSS.pubDate(item)
                    .map(Values::literal);


            return frame(iri(EC2U.events, md5(url)))

                    .values(RDF.TYPE, EC2U.Event)

                    .value(EC2U.university, Salamanca.University)

                    .value(DCTERMS.SOURCE, iri(url))
                    .frame(DCTERMS.PUBLISHER, Publisher)
                    .value(DCTERMS.CREATED, pubDate)
                    .value(DCTERMS.MODIFIED, pubDate.orElseGet(() -> literal(now.atOffset(UTC))))

                    .value(Schema.url, iri(url))
                    .value(Schema.name, name)
                    .value(Schema.description, description)
                    .value(Schema.disambiguatingDescription, disambiguatingDescription);

        });
    }

}
