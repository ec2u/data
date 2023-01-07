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
import com.metreeca.core.toolkits.Identifiers;
import com.metreeca.core.toolkits.Strings;
import com.metreeca.http.actions.GET;
import com.metreeca.ical.codecs.iCal;
import com.metreeca.link.Frame;
import com.metreeca.link.Values;
import com.metreeca.xml.actions.Untag;

import eu.ec2u.data.Data;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.things.Schema;
import eu.ec2u.data.universities.Universities;
import eu.ec2u.work.validation.Validators;
import net.fortuna.ical4j.model.Date;
import net.fortuna.ical4j.model.TimeZone;
import net.fortuna.ical4j.model.component.VEvent;
import net.fortuna.ical4j.model.property.*;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.time.*;
import java.util.Optional;
import java.util.Set;

import static com.metreeca.core.toolkits.Identifiers.AbsoluteIRIPattern;
import static com.metreeca.core.toolkits.Strings.TextLength;
import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.iri;
import static com.metreeca.link.Values.literal;

import static eu.ec2u.data.events.Events.Event;
import static eu.ec2u.data.events._Events.synced;
import static eu.ec2u.data.events._Uploads.upload;
import static eu.ec2u.data.resources.Resources.Universities.Salamanca;
import static net.fortuna.ical4j.model.Component.VEVENT;

import static java.time.ZoneOffset.UTC;
import static java.util.function.Predicate.not;

public final class EventsSalamancaUniversity implements Runnable {

    private static final Frame Publisher=frame(iri("https://sac.usal.es/programacion/"))
            .value(RDF.TYPE, Resources.Publisher)
            .value(DCTERMS.COVERAGE, Universities.University)
            .values(RDFS.LABEL,
                    literal("University of Salamanca / Cultural Activities Service", "en"),
                    literal("Universidad de Salamanca / Servicio de Actividades Culturales", "es")
            );


    public static void main(final String... args) {
        Data.exec(() -> new EventsSalamancaUniversity().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Instant now=Instant.now();


    @Override public void run() {
        Xtream.of(synced(Publisher.focus()))

                .flatMap(this::crawl)
                .map(this::event)

                .sink(events -> upload(Events.Context,
                        Validators._validate(Event(), Set.of(Events.Event), events)
                ));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<VEvent> crawl(final Instant synced) {
        return Xtream.of(synced)

                .flatMap(new Fill<Instant>()
                        .model("https://calendar.google.com/calendar/ical"
                                +"/c_jd0an7mstid1af3do1ija5flsk%40group.calendar.google.com/public/basic.ics"
                        )
                )

                .optMap(new GET<>(new iCal()))

                .flatMap(calendar -> calendar.getComponents(VEVENT).stream().map(VEvent.class::cast));
    }

    private Frame event(final VEvent event) {

        final Optional<String> uid=Optional.ofNullable(event.getUid())
                .map(Uid::getValue)
                .filter(not(String::isEmpty));


        final Optional<IRI> url=Optional.ofNullable(event.getLocation())
                .map(Location::getValue)
                .filter(not(String::isEmpty))
                .map(s -> s.startsWith("sac.usal.es/") ? String.format("https://%s", s) : s)
                .filter(AbsoluteIRIPattern.asMatchPredicate())
                .map(Values::iri);

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
                .map(Values::literal);

        final Optional<Value> lastModified=Optional.ofNullable(event.getLastModified())
                .map(LastModified::getDateTime)
                .map(Date::toInstant)
                .map(instant -> OffsetDateTime.ofInstant(instant, UTC))
                .map(Values::literal);

        final Optional<Value> startDate=Optional.ofNullable(event.getStartDate())
                .map(start -> toOffsetDateTime(start.getDate(), start.getTimeZone()))
                .map(Values::literal);

        final Optional<Value> endDate=Optional.ofNullable(event.getEndDate())
                .map(end -> toOffsetDateTime(end.getDate(), end.getTimeZone()))
                .map(Values::literal);

        return frame(iri(Events.Context, url.map(Value::stringValue).or(() -> uid)
                .map(Identifiers::md5)
                .orElseGet(Identifiers::md5)
        ))

                .values(RDF.TYPE, Events.Event)

                .value(Resources.university, Salamanca.Id)

                .frame(DCTERMS.PUBLISHER, Publisher)
                .value(DCTERMS.SOURCE, url)

                .value(DCTERMS.CREATED, created)
                .value(DCTERMS.MODIFIED, lastModified.orElseGet(() -> literal(now)))

                .value(Schema.url, url)
                .value(Schema.name, label)
                .value(Schema.disambiguatingDescription, disambiguatingDescription)
                .value(Schema.description, description)

                .value(Schema.startDate, startDate)
                .value(Schema.endDate, endDate);

    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private OffsetDateTime toOffsetDateTime(final Date date, final TimeZone zone) {
        return OffsetDateTime.ofInstant(date.toInstant(), zone != null
                ? ZoneOffset.ofTotalSeconds(zone.getOffset(now.toEpochMilli()))
                : Salamanca.TimeZone.getRules().getOffset(now)
        );
    }

}
