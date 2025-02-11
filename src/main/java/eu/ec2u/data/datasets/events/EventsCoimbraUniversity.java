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

package eu.ec2u.data.datasets.events;

import com.metreeca.flow.Xtream;
import com.metreeca.flow.http.actions.GET;
import com.metreeca.flow.json.formats.JSON;
import com.metreeca.mesh.tools.Store;

import eu.ec2u.data.datasets.organizations.OrganizationFrame;

import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.shim.Collections.map;
import static com.metreeca.shim.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.Localized.EN;
import static eu.ec2u.data.datasets.universities.University.COIMBRA;
import static java.lang.String.format;
import static java.util.Map.entry;

public final class EventsCoimbraUniversity implements Runnable {

    private static final OrganizationFrame PUBLISHER=new OrganizationFrame()

            .id(uri("https://www.uc.pt/dri/noticias/eventos"))
            .university(COIMBRA)

            .prefLabel(map(
                    entry(EN, "Coimbra Agenda"),
                    entry(COIMBRA.locale(), "Agenda Coimbra")
            ));


    public static void main(final String... args) {
        exec(() -> new EventsCoimbraUniversity().run());
    }


    //̸////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Store store=service(store());


    @Override
    public void run() {

        final String search="https://content.fw.uc.pt/v1/agenda/events/search";
        final String event="https://agenda.coimbra.pt/event/%s";

        store.insert(array(Xtream.of(search)

                .crawl(url -> Xtream.of(url)

                        .optMap(new GET<>(new JSON()))

                        .map(json -> {

                            final long current=json.select("pagination.current_page").integral().orElse(0L);
                            final long total=json.select("pagination.total_pages").integral().orElse(0L);

                            return entry(
                                    current < total ? Stream.of(format("%s?page=%d", search, current+1)) : Stream.empty(),
                                    json.select("events.*.key").strings()
                            );
                        })

                )

                .map(event::formatted)

                .pipe(new Events.Scanner(COIMBRA, PUBLISHER))));
    }

}
