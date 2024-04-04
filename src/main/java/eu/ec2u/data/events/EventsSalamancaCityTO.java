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
import com.metreeca.http.rdf.Frame;
import com.metreeca.http.rdf.Values;
import com.metreeca.http.toolkits.Strings;
import com.metreeca.http.work.Xtream;
import com.metreeca.http.xml.XPath;
import com.metreeca.http.xml.actions.Untag;
import com.metreeca.http.xml.formats.XML;

import eu.ec2u.data.Data;
import eu.ec2u.data.concepts.OrganizationTypes;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.things.Schema;
import eu.ec2u.work.feeds.RSS;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.RDFS;

import java.text.ParsePosition;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.util.Locale;
import java.util.Optional;

import static com.metreeca.http.rdf.Frame.frame;
import static com.metreeca.http.rdf.Values.iri;
import static com.metreeca.http.rdf.Values.literal;
import static com.metreeca.http.toolkits.Identifiers.md5;

import static eu.ec2u.data.events.Events.startDate;
import static eu.ec2u.data.things.Schema.Organization;
import static eu.ec2u.data.universities._Universities.Salamanca;
import static java.time.ZoneOffset.UTC;
import static java.time.temporal.ChronoField.*;

public final class EventsSalamancaCityTO implements Runnable {

    private static final IRI Context=iri(Events.Context, "/salamanca/city/to");

    private static final Frame Publisher=frame(iri("https://salamanca.es/en/calendar"))
            .value(RDF.TYPE, Organization)
            .value(DCTERMS.COVERAGE, OrganizationTypes.City)
            .values(RDFS.LABEL,
                    literal("Oficina de Turismo de Salamanca", "es"),
                    literal("Salamanca Municipal Tourist Office", "en")
            );


    private static final DateTimeFormatter FeedDateTime=new DateTimeFormatterBuilder()

            .parseCaseInsensitive()
            .parseLenient()

            .appendValue(DAY_OF_MONTH)
            .appendLiteral(' ')
            .appendText(MONTH_OF_YEAR)
            .appendLiteral(' ')
            .appendValue(YEAR)
            .appendLiteral(' ')
            .appendValue(HOUR_OF_DAY)
            .appendLiteral(':')
            .appendValue(MINUTE_OF_HOUR)

            .toFormatter(Locale.ROOT);


    public static void main(final String... args) {
        Data.exec(() -> new EventsSalamancaCityTO().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Instant now=Instant.now();


    @Override public void run() {
        // Xtream.of(synced(Context, Publisher.focus()))
        //
        //         .flatMap(this::crawl)
        //         .optMap(this::event)
        //
        //         .pipe(events -> validate(Event(), Set.of(Event), events))
        //
        //         .forEach(new Events.Updater(Context));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<XPath> crawl(final Instant synced) {
        return Xtream.of(synced)

                .flatMap(new Fill<Instant>()
                        .model("https://www.salamanca.es/es/?option=com_jevents&task=modlatest.rss&format=feed&type=rss")
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


            return frame(iri(Events.Context, md5(url)))

                    .values(RDF.TYPE, Events.Event)

                    .value(Resources.owner, Salamanca.Id)

                    .value(DCTERMS.SOURCE, iri(url))
                    .frame(DCTERMS.PUBLISHER, Publisher)
                    .value(DCTERMS.CREATED, pubDate)
                    .value(DCTERMS.MODIFIED, pubDate.orElseGet(() -> literal(now.atOffset(UTC))))

                    .value(Schema.url, iri(url))
                    .value(Schema.name, name)
                    .value(Schema.description, description)
                    .value(Schema.disambiguatingDescription, disambiguatingDescription)

                    .value(startDate, item.string("title")
                            .map(v -> FeedDateTime.parse(v, new ParsePosition(0)))
                            .map(v -> LocalDateTime.from(v).atOffset(Salamanca.TimeZone.getRules().getOffset(now)))
                            .map(Values::literal)
                    );

        });
    }

}
