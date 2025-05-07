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
import com.metreeca.flow.services.Logger;
import com.metreeca.flow.work.Xtream;
import com.metreeca.flow.xml.XPath;
import com.metreeca.flow.xml.formats.HTML;
import com.metreeca.mesh.tools.Store;

import eu.ec2u.data.organizations.OrganizationFrame;
import eu.ec2u.data.taxonomies.EC2UOrganizations;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.util.Collections.*;
import static com.metreeca.mesh.util.Loggers.time;
import static com.metreeca.mesh.util.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.resources.Localized.EN;
import static eu.ec2u.data.universities.University.IASI;
import static java.lang.String.format;
import static java.util.Map.entry;

public final class EventsIasiUniversity360 implements Runnable {

    private static final OrganizationFrame PUBLISHER=new OrganizationFrame()

            .id(uri("https://360.uaic.ro/blog/category/evenimente/"))
            .university(IASI)

            .prefLabel(map(
                    entry(EN, "University of Iasi / 360 Events"),
                    entry(IASI.locale(), "Universitatea din Iași / 360 Evenimente")
            ))

            .about(set(EC2UOrganizations.UNIVERSITY));


    public static void main(final String... args) {
        exec(() -> new EventsIasiUniversity360().run());
    }


    //̸////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Store store=service(store());
    private final Logger logger=service(logger());


    @Override
    public void run() {
        time(() -> store.insert(array(list(Xtream

                .of(PUBLISHER.id().toString())

                .flatMap(home -> Xtream.of(home).crawl(url -> Xtream.of(url)

                        .optMap(new GET<>(new HTML()))
                        .map(XPath::new)

                        .map(path -> entry(
                                path.links("//div[@class='archive-pagination']/a[contains(@class,'page-numbers')]/@href"),
                                path.links("//article[contains(@class, 'category-evenimente')]/h2[@class='entry-title']/a[@rel='bookmark']/@href")
                        ))

                ))

                .pipe(new Events.Scanner(IASI, PUBLISHER))

        )))).apply((elapsed, count) -> logger.info(EventsIasiUniversity360.class, format(
                "inserted <%,d> resources in <%,d> ms", count, elapsed
        )));
    }

}
