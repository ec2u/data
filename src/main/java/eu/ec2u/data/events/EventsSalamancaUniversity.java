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
import net.fortuna.ical4j.model.Date;
import net.fortuna.ical4j.model.TimeZone;
import net.fortuna.ical4j.model.component.VEvent;
import net.fortuna.ical4j.model.property.*;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.RDF;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

import static com.metreeca.http.toolkits.Identifiers.AbsoluteIRIPattern;
import static com.metreeca.http.toolkits.Strings.TextLength;
import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.EC2U.update;
import static eu.ec2u.data.events.Events.publisher;
import static eu.ec2u.data.events.Events_.updated;
import static eu.ec2u.data.resources.Resources.partner;
import static eu.ec2u.data.things.Schema.Organization;
import static eu.ec2u.data.universities._Universities.Salamanca;
import static java.time.ZoneOffset.UTC;
import static java.util.function.Predicate.not;
import static net.fortuna.ical4j.model.Component.VEVENT;

public final class EventsSalamancaUniversity implements Runnable {

    private static final IRI Context=iri(Events.Context, "/salamanca/university");


    private static final Frame Publisher=Frame.frame(

            field(ID, iri("https://sac.usal.es/programacion/")),
            field(TYPE, Organization),

            field(partner, Salamanca.Id),

            field(Schema.name,
                    literal("University of Salamanca / Cultural Activities Service", "en"),
                    literal("Universidad de Salamanca / Servicio de Actividades Culturales", Salamanca.Language)
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
        return Optional

                .ofNullable(event.getLocation())
                .map(Location::getValue)
                .filter(not(String::isEmpty))
                .map(s -> s.startsWith("sac.usal.es/") ? String.format("https://%s", s) : s)
                .filter(AbsoluteIRIPattern.asMatchPredicate())
                .map(Frame::iri)

                .map(url -> {

                    final Optional<String> uid=Optional.ofNullable(event.getUid())
                            .map(Uid::getValue)
                            .filter(not(String::isEmpty));

                    final Optional<Value> label=Optional.ofNullable(event.getSummary())
                            .map(Summary::getValue)
                            .filter(not(String::isEmpty))
                            .map(value -> literal(value, Salamanca.Language));

                    final Optional<Value> description=Optional.ofNullable(event.getDescription())
                            .map(Description::getValue)
                            .filter(not(String::isEmpty))
                            .map(Untag::untag)
                            .map(value -> literal(value, Salamanca.Language));

                    final Optional<Value> disambiguatingDescription=description
                            .map(Value::stringValue)
                            .map(text -> Strings.clip(text, TextLength))
                            .map(value -> literal(value, Salamanca.Language));


                    final Optional<Value> created=Optional.ofNullable(event.getCreated())
                            .map(Created::getDateTime)
                            .map(Date::toInstant)
                            .map(instant -> OffsetDateTime.ofInstant(instant, UTC))
                            .map(Frame::literal);

                    final Optional<Value> lastModified=Optional.ofNullable(event.getLastModified())
                            .map(LastModified::getDateTime)
                            .map(Date::toInstant)
                            .map(instant -> OffsetDateTime.ofInstant(instant, UTC))
                            .map(Frame::literal);

                    final Optional<Value> startDate=Optional.ofNullable(event.getStartDate())
                            .map(start -> toOffsetDateTime(start.getDate(), start.getTimeZone()))
                            .map(Frame::literal);

                    final Optional<Value> endDate=Optional.ofNullable(event.getEndDate())
                            .map(end -> toOffsetDateTime(end.getDate(), end.getTimeZone()))
                            .map(Frame::literal);

                    return frame(

                            field(ID, iri(Events.Context, Optional.of(url).map(Value::stringValue).or(() -> uid)
                                    .map(Identifiers::md5)
                                    .orElseGet(Identifiers::md5)
                            )),

                            field(RDF.TYPE, Events.Event),

                            field(Schema.url, url),
                            field(Schema.name, label),
                            field(Schema.disambiguatingDescription, disambiguatingDescription),
                            field(Schema.description, description),

                            field(Events.startDate, startDate),
                            field(Events.endDate, endDate),

                            // field(DCTERMS.CREATED, created),
                            // field(DCTERMS.MODIFIED, lastModified.orElseGet(() -> literal(now))),

                            field(partner, Salamanca.Id),
                            field(publisher, Publisher)

                    );

                });
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private OffsetDateTime toOffsetDateTime(final Date date, final TimeZone zone) {
        return OffsetDateTime.ofInstant(date.toInstant(), zone != null
                ? ZoneOffset.ofTotalSeconds(zone.getOffset(now.toEpochMilli()))
                : Salamanca.TimeZone.getRules().getOffset(now)
        );
    }

}
