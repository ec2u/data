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
import com.metreeca.link.Frame;
import com.metreeca.link.Values;
import com.metreeca.xml.XPath;
import com.metreeca.xml.actions.Untag;
import com.metreeca.xml.codecs.XML;

import eu.ec2u.data.Data;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.things.Schema;
import eu.ec2u.work.feeds.RSS;
import eu.ec2u.work.validation.Validators;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.text.ParsePosition;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.util.*;

import static com.metreeca.core.toolkits.Identifiers.md5;
import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.iri;
import static com.metreeca.link.Values.literal;

import static eu.ec2u.data.EC2U.University.Salamanca;
import static eu.ec2u.data.events.Events.Event;
import static eu.ec2u.data.events._Events.synced;
import static eu.ec2u.data.events._Uploads.upload;

import static java.time.ZoneOffset.UTC;
import static java.time.temporal.ChronoField.*;

public final class EventsSalamancaCityTO implements Runnable {

    private static final Frame Publisher=frame(iri("https://salamanca.es/en/calendar"))
            .value(RDF.TYPE, Resources.Publisher)
            .value(DCTERMS.COVERAGE, Events.City)
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
        Xtream.of(synced(Publisher.focus()))

                .flatMap(this::crawl)
                .optMap(this::event)

                .sink(events -> upload(Events.Context,
                        Validators._validate(Event(), Set.of(Events.Event), events)
                ));
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

                    .value(Resources.university, Salamanca.Id)

                    .value(DCTERMS.SOURCE, iri(url))
                    .frame(DCTERMS.PUBLISHER, Publisher)
                    .value(DCTERMS.CREATED, pubDate)
                    .value(DCTERMS.MODIFIED, pubDate.orElseGet(() -> literal(now.atOffset(UTC))))

                    .value(Schema.url, iri(url))
                    .value(Schema.name, name)
                    .value(Schema.description, description)
                    .value(Schema.disambiguatingDescription, disambiguatingDescription)

                    .value(Schema.startDate, item.string("title")
                            .map(v -> FeedDateTime.parse(v, new ParsePosition(0)))
                            .map(v -> LocalDateTime.from(v).atOffset(Salamanca.TimeZone.getRules().getOffset(now)))
                            .map(Values::literal)
                    );

        });
    }

}
