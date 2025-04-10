/*
 * Copyright © 2020-2025 EC2U Alliance
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

package eu.ec2u.data.events.cities;

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
import eu.ec2u.data.events.Events;
import eu.ec2u.data.events.Events_;
import eu.ec2u.data.things.Schema;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.RDF;

import java.text.ParsePosition;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.util.Locale;
import java.util.Optional;

import static com.metreeca.http.rdf.Values.guarded;
import static com.metreeca.http.toolkits.Identifiers.md5;
import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.EC2U.update;
import static eu.ec2u.data.events.Events.publisher;
import static eu.ec2u.data.events.Events.startDate;
import static eu.ec2u.data.resources.Resources.university;
import static eu.ec2u.data.things.Schema.Organization;
import static eu.ec2u.data.universities.University.Salamanca;
import static java.time.temporal.ChronoField.*;

public final class EventsSalamancaCityTO implements Runnable {

    private static final IRI Context=Frame.iri(Events.Context, "/salamanca/city/to");

    private static final Frame Publisher=Frame.frame(

            field(ID, iri("https://salamanca.es/en/calendar")),
            field(TYPE, Organization),

            field(university, Salamanca.id),

            field(Schema.name,
                    literal("Salamanca Municipal Tourist Office", "en"),
                    literal("Oficina de Turismo de Salamanca", Salamanca.language)
            ),

            field(Schema.about, OrganizationTypes.City)

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


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Instant now=Instant.now();


    @Override public void run() {
        update(connection -> Xtream.of(now)

                .flatMap(this::crawl)
                .optMap(this::event)

                .filter(frame -> frame.value(startDate).isPresent())

                .flatMap(Frame::stream)
                .batch(0)

                .forEach(new Events_.Loader(Context))

        );
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<XPath> crawl(final Instant now) {
        return Xtream.of(now)

                .flatMap(new Fill<Instant>()
                        .model("https://www.salamanca.es/es/?option=com_jevents&task=modlatest.rss&format=feed&type=rss")
                )

                .optMap(new GET<>(new XML()))

                .map(XPath::new)
                .flatMap(xml -> xml.paths("/rss/channel/item"));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Optional<Frame> event(final XPath item) {

        return item.link("link").map(url -> {

            final Optional<Literal> name=item.string("title")
                    .map(text -> literal(text, Salamanca.language));

            final Optional<Literal> description=item.string("description")
                    .map(Untag::untag)
                    .map(text -> literal(text, Salamanca.language));

            final Optional<Literal> disambiguatingDescription=description
                    .map(Value::stringValue)
                    .map(Strings::clip)
                    .map(text -> literal(text, Salamanca.language));

            return frame(

                    field(ID, iri(Events.Context, md5(url))),

                    field(RDF.TYPE, Events.Event),

                    field(Schema.url, iri(url)),
                    field(Schema.name, name),
                    field(Schema.description, description),
                    field(Schema.disambiguatingDescription, disambiguatingDescription),

                    field(startDate, item.string("title")
                            .map(guarded(v -> FeedDateTime.parse(v, new ParsePosition(0))))
                            .map(v -> LocalDateTime.from(v).atOffset(Salamanca.zone.getRules().getOffset(now)))
                            .map(Frame::literal)
                    ),

                    field(university, Salamanca.id),
                    field(publisher, Publisher)

            );

        });
    }

}
