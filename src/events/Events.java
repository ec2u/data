/*
 * Copyright © 2020-2026 EC2U Alliance
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

package eu.ec2u.data.datasets.events;

import com.metreeca.flow.http.actions.GET;
import com.metreeca.flow.http.handlers.Delegator;
import com.metreeca.flow.http.handlers.Router;
import com.metreeca.flow.json.handlers.Driver;
import com.metreeca.flow.xml.actions.Untag;
import com.metreeca.flow.xml.formats.HTML;
import com.metreeca.mesh.Valuable;
import com.metreeca.mesh.Value;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.pipe.Store;
import com.metreeca.shim.Locales;

import eu.ec2u.data.Data;
import eu.ec2u.data.datasets.Dataset;
import eu.ec2u.data.datasets.Datasets;
import eu.ec2u.data.datasets.organizations.OrganizationFrame;
import eu.ec2u.data.datasets.organizations.Organizations;
import eu.ec2u.data.datasets.taxonomies.Topic;
import eu.ec2u.data.datasets.universities.University;
import eu.ec2u.data.vocabularies.schema.SchemaEvent.EventAttendanceModeEnumeration;
import eu.ec2u.data.vocabularies.schema.*;
import eu.ec2u.work.Page;
import eu.ec2u.work.PageFrame;
import eu.ec2u.work.ai.Analyzer;

import java.net.URI;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.*;
import java.util.function.BiFunction;
import java.util.function.Function;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.async;
import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.Value.value;
import static com.metreeca.mesh.Value.zonedDateTime;
import static com.metreeca.mesh.queries.Criterion.criterion;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.shim.Collections.*;
import static com.metreeca.shim.Futures.joining;
import static com.metreeca.shim.Lambdas.lenient;
import static com.metreeca.shim.Streams.concat;
import static com.metreeca.shim.Streams.optional;
import static com.metreeca.shim.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.Datasets.DATASETS;
import static eu.ec2u.data.datasets.Localized.EN;
import static eu.ec2u.data.datasets.events.Event.review;
import static eu.ec2u.data.datasets.universities.University.uuid;
import static eu.ec2u.work.ai.Analyzer.analyzer;
import static java.lang.String.format;
import static java.time.ZoneOffset.UTC;
import static java.util.Locale.ROOT;
import static java.util.Map.entry;
import static java.util.function.Predicate.not;

@Frame
public interface Events extends Dataset {

    EventsFrame EVENTS=new EventsFrame()
            .id(Data.DATA.resolve("events/"))
            .isDefinedBy(Data.DATA.resolve("datasets/events"))
            .title(map(entry(EN, "EC2U Academic and Local Events")))
            .alternative(map(entry(EN, "EC2U Events")))
            .description(map(entry(EN, """
                    Information about events at EC2U partner universities and associated local organizations.
                    """)))
            .publisher(Organizations.EC2U)
            .rights(Datasets.COPYRIGHT)
            .license(set(Datasets.CCBYNCND40))
            .issued(LocalDate.parse("2022-01-01"));


    static void main(final String... args) {
        exec(() -> service(store()).insert(EVENTS));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    default Datasets dataset() {
        return DATASETS;
    }

    @Override
    Set<Event> members();


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    final class Reaper implements Runnable {

        private final Store store=service(store());


        public static void main(final String... args) {
            exec(() -> new Reaper().run());
        }


        @Override public void run() {
            store.delete(value(query()
                    .model(new EventFrame(true).id(uri()))
                    .where("validDate", criterion().lt(zonedDateTime(LocalDate.now().atStartOfDay(UTC))))

            ));
        }

    }

}
