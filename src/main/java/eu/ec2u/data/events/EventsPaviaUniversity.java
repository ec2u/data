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

import com.metreeca.flow.http.actions.GET;
import com.metreeca.flow.work.Xtream;
import com.metreeca.flow.xml.XPath;
import com.metreeca.flow.xml.formats.HTML;
import com.metreeca.mesh.Valuable;

import eu.ec2u.data.organizations.OrganizationFrame;
import eu.ec2u.data.taxonomies.EC2UOrganizations;

import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.Value.value;
import static com.metreeca.mesh.queries.Criterion.criterion;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.mesh.util.Collections.*;
import static com.metreeca.mesh.util.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.events.Event.review;
import static eu.ec2u.data.resources.Localized.EN;
import static eu.ec2u.data.universities.University.PAVIA;
import static java.util.Map.entry;

public final class EventsPaviaUniversity implements Runnable {

    private static final OrganizationFrame PUBLISHER=new OrganizationFrame()

            .id(uri("https://www.unipv.news/eventi"))
            .university(PAVIA)

            .prefLabel(map(
                    entry(EN, "University of Pavia / Events"),
                    entry(PAVIA.locale(), "Università di Pavia / Eventi")
            ))

            .about(set(EC2UOrganizations.UNIVERSITY));


    public static void main(final String... args) {
        exec(() -> new EventsPaviaUniversity().run());
    }


    //̸////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    @Override
    public void run() {
        service(store()).modify(

                array(list(Stream

                        .of("https://www.unipv.news/eventi")
                        .flatMap(this::events)
                        .flatMap(this::event)

                )),

                value(query(new EventFrame(true)).where("university", criterion().any(PAVIA)))

        );
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<String> events(final String home) {
        return Xtream.of(home).crawl(url -> Xtream.of(url)

                .optMap(new GET<>(new HTML()))
                .map(XPath::new)

                .map(path -> entry(
                        path.links("//a[contains(concat(' ', normalize-space(@class), ' '), ' page-link ')]/@href"),
                        path.links("//*[contains(concat(' ', normalize-space(@class), ' '), ' eventi-card ')]//a//@href")
                ))
        );
    }

    private Stream<Valuable> event(final String url) {
        return Xtream.of(url)

                .optMap(new Events.Scanner(PAVIA))

                .optMap(event -> review(event, PAVIA.locale()))

                .flatMap(event -> Stream.of(
                        event.publisher(PUBLISHER),
                        PUBLISHER
                ));
    }

}
