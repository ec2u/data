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

package eu.ec2u.data.events;

import com.metreeca.flow.actions.Fill;
import com.metreeca.flow.http.actions.GET;
import com.metreeca.flow.ical.formats.iCal;
import com.metreeca.flow.work.Xtream;
import com.metreeca.mesh.util.URIs;

import net.fortuna.ical4j.model.component.VEvent;
import net.fortuna.ical4j.model.property.Url;

import java.net.URI;
import java.time.*;
import java.time.temporal.TemporalAccessor;
import java.time.temporal.TemporalQueries;
import java.util.Optional;

import static com.metreeca.flow.toolkits.Identifiers.AbsoluteIRIPattern;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.universities.University.PAVIA;
import static net.fortuna.ical4j.model.Component.VEVENT;

public final class EventsPaviaBorromeo implements Runnable {

    public static void main(final String... args) {
        exec(() -> new EventsPaviaBorromeo().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        Xtream.of(Instant.now())

                .flatMap(this::crawl)
                .optMap(this::event)

                .forEach(uri -> System.out.println(uri));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<VEvent> crawl(final Instant updated) {
        return Xtream.of(updated)

                .flatMap(new Fill<Instant>() // !!! available only on a month-by-month basis
                        .model("https://calendar.google.com/calendar/ical"
                               +"/r29fcga7liott32oskul1k3tjep2gaiu%40import.calendar.google.com/public/basic.ics"
                        )
                )

                .optMap(new GET<>(new iCal()))

                .flatMap(calendar -> calendar.getComponents(VEVENT).stream().map(VEvent.class::cast));
    }

    private Optional<URI> event(final VEvent event) {
        return event.getUrl()
                .map(Url::getValue)
                .filter(AbsoluteIRIPattern.asMatchPredicate())
                .map(URIs::uri)

                .map(url -> {

                    final Optional<OffsetDateTime> startDate=event.getDateTimeStart()
                            .map(start -> toOffsetDateTime(start.getDate()));

                    final Optional<OffsetDateTime> endDate=event.getDateTimeEnd()
                            .map(end -> toOffsetDateTime(end.getDate()));

                    System.out.println(endDate);

                    return url;

                });
    }


    private OffsetDateTime toOffsetDateTime(final TemporalAccessor temporal) {

        final LocalDate date=TemporalQueries.localDate().queryFrom(temporal);
        final LocalTime time=TemporalQueries.localTime().queryFrom(temporal);
        final ZoneOffset offset=TemporalQueries.offset().queryFrom(temporal);

        return OffsetDateTime.of(
                LocalDateTime.of(date, time != null ? time : LocalTime.of(0, 0)),
                offset != null ? offset : PAVIA.zone().getRules().getOffset(Instant.now())
        );
    }
}
