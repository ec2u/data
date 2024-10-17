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
import com.metreeca.http.ical.formats.iCal;
import com.metreeca.http.toolkits.Identifiers;
import com.metreeca.http.toolkits.Strings;
import com.metreeca.http.work.Xtream;
import com.metreeca.http.xml.actions.Untag;
import com.metreeca.link.Frame;

import eu.ec2u.data.Data;
import eu.ec2u.data.concepts.OrganizationTypes;
import eu.ec2u.data.things.Schema;
import net.fortuna.ical4j.model.component.VEvent;
import net.fortuna.ical4j.model.property.*;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.RDF;

import java.time.*;
import java.time.temporal.TemporalAccessor;
import java.time.temporal.TemporalQueries;
import java.util.Optional;

import static com.metreeca.http.toolkits.Identifiers.AbsoluteIRIPattern;
import static com.metreeca.http.toolkits.Strings.TextLength;
import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.EC2U.update;
import static eu.ec2u.data.events.Events.*;
import static eu.ec2u.data.events.Events_.updated;
import static eu.ec2u.data.resources.Resources.university;
import static eu.ec2u.data.resources.Resources.updated;
import static eu.ec2u.data.things.Schema.Organization;
import static eu.ec2u.data.universities.University.Salamanca;
import static java.time.ZoneOffset.UTC;
import static java.util.function.Predicate.not;
import static net.fortuna.ical4j.model.Component.VEVENT;

public final class EventsSalamancaUniversity implements Runnable {

    private static final IRI Context=iri(Events.Context, "/salamanca/university");


    private static final Frame Publisher=Frame.frame(

            field(ID, iri("https://sac.usal.es/programacion/")),
            field(TYPE, Organization),

            field(university, Salamanca.id),

            field(Schema.name,
                    literal("University of Salamanca / Cultural Activities Service", "en"),
                    literal("Universidad de Salamanca / Servicio de Actividades Culturales", Salamanca.language)
            ),

            field(Schema.about, OrganizationTypes.University)

    );


    public static void main(final String... args) {
        Data.exec(() -> new EventsSalamancaUniversity().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Instant now=Instant.now();


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

    private Xtream<VEvent> crawl(final Instant updated) {
        return Xtream.of(updated)

                .flatMap(new Fill<Instant>()
                        .model("https://calendar.google.com/calendar/ical"
                                +"/c_jd0an7mstid1af3do1ija5flsk%40group.calendar.google.com/public/basic.ics"
                        )
                )

                .optMap(new GET<>(new iCal()))

                .flatMap(calendar -> calendar.getComponents(VEVENT).stream().map(VEvent.class::cast));
    }

    private Optional<Frame> event(final VEvent event) {
        return event.getLocation()
                .map(Location::getValue)
                .filter(not(String::isEmpty))
                .map(s -> s.startsWith("sac.usal.es/") ? String.format("https://%s", s) : s)
                .filter(AbsoluteIRIPattern.asMatchPredicate())
                .map(Frame::iri)

                .map(url -> {

                    final Optional<String> uid=event.getUid()
                            .map(Uid::getValue)
                            .filter(not(String::isEmpty));

                    final Optional<Literal> label=event.getSummary()
                            .map(Summary::getValue)
                            .filter(not(String::isEmpty))
                            .map(value -> literal(value, Salamanca.language));

                    final Optional<Literal> description=event.getDescription()
                            .map(Description::getValue)
                            .filter(not(String::isEmpty))
                            .map(Untag::untag)
                            .map(value -> literal(value, Salamanca.language));

                    final Optional<Literal> disambiguatingDescription=description
                            .map(Value::stringValue)
                            .map(text -> Strings.clip(text, TextLength))
                            .map(value -> literal(value, Salamanca.language));

                    final Optional<Literal> created=event.getCreated()
                            .map(Created::getDate)
                            .map(instant -> OffsetDateTime.ofInstant(instant, UTC))
                            .map(Frame::literal);

                    final Optional<Literal> lastModified=event.getLastModified()
                            .map(LastModified::getDate)
                            .map(instant -> OffsetDateTime.ofInstant(instant, UTC))
                            .map(Frame::literal);

                    final Optional<Literal> startDate=event.getDateTimeStart()
                            .map(start -> toOffsetDateTime(start.getDate()))
                            .map(Frame::literal);

                    final Optional<Literal> endDate=event.getDateTimeEnd()
                            .map(end -> toOffsetDateTime(end.getDate()))
                            .map(Frame::literal);

                    return frame(

                            field(ID, iri(Events.Context, Optional.of(url).map(Value::stringValue).or(() -> uid)
                                    .map(Identifiers::md5)
                                    .orElseGet(Identifiers::md5)
                            )),

                            field(RDF.TYPE, Event),

                            field(Schema.url, url),
                            field(Schema.name, label),
                            field(Schema.disambiguatingDescription, disambiguatingDescription),
                            field(Schema.description, description),

                            field(Events.startDate, startDate),
                            field(Events.endDate, endDate),

                            field(dateCreated, created),
                            field(dateModified, lastModified),
                            field(updated, literal(lastModified.map(Literal::temporalAccessorValue).map(Instant::from).orElse(now))),

                            field(university, Salamanca.id),
                            field(publisher, Publisher)

                    );

                });
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private OffsetDateTime toOffsetDateTime(final TemporalAccessor temporal) {

        final LocalDate date=TemporalQueries.localDate().queryFrom(temporal);
        final LocalTime time=TemporalQueries.localTime().queryFrom(temporal);
        final ZoneOffset offset=TemporalQueries.offset().queryFrom(temporal);

        return OffsetDateTime.of(
                LocalDateTime.of(date, time != null ? time : LocalTime.of(0, 0)),
                offset != null ? offset : Salamanca.zone.getRules().getOffset(now)
        );
    }

}
