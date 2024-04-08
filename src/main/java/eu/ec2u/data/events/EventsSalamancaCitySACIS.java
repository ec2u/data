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

import eu.ec2u.data.Data;
import eu.ec2u.data.concepts.OrganizationTypes;
import eu.ec2u.data.things.Schema;
import eu.ec2u.work.feeds.RSS;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.RDF;

import java.time.Instant;
import java.util.Optional;

import static com.metreeca.http.toolkits.Identifiers.md5;
import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.EC2U.update;
import static eu.ec2u.data.events.Events.publisher;
import static eu.ec2u.data.events.Events_.synced;
import static eu.ec2u.data.resources.Resources.owner;
import static eu.ec2u.data.things.Schema.Organization;
import static eu.ec2u.data.universities._Universities.Salamanca;

public final class EventsSalamancaCitySACIS implements Runnable {

    private static final IRI Context=iri(Events.Context, "/salamanca/city/sacis");

    private static final Frame Publisher=Frame.frame(

            field(ID, iri("https://www.salamanca.com/actividades-eventos-propuestas-agenda-salamanca/")),
            field(TYPE, Organization),

            field(owner, Salamanca.Id),

            field(Schema.name,
                    literal("SACIS - Salamanca Cooperative Society of Social Initiative", "en"),
                    literal("SACIS - Salamanca Sociedad Cooperativa de Iniciativa Social", Salamanca.Language)
            ),

            field(Schema.about, OrganizationTypes.City)

    );


    public static void main(final String... args) {
        Data.exec(() -> new EventsSalamancaCitySACIS().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        update(connection -> Xtream.of(synced(Context, Publisher.id().orElseThrow()))

                .flatMap(this::crawl)
                .optMap(this::event)

                .flatMap(Frame::stream)
                .batch(0)

                .forEach(new Events_.Loader(Context))

        );
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
                    .map(Frame::literal);


            return frame(

                    field(ID, iri(Events.Context, md5(url))),

                    field(RDF.TYPE, Events.Event),

                    field(Schema.url, iri(url)),
                    field(Schema.name, name),
                    field(Schema.description, description),
                    field(Schema.disambiguatingDescription, disambiguatingDescription),

                    // field(DCTERMS.CREATED, pubDate),
                    // field(DCTERMS.MODIFIED, pubDate.orElseGet(() -> literal(now.atOffset(UTC)))),

                    field(owner, Salamanca.Id),
                    field(publisher, Publisher)
            );

        });
    }

}
