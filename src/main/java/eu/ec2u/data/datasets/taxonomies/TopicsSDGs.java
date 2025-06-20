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

package eu.ec2u.data.datasets.taxonomies;

import com.metreeca.flow.Xtream;
import com.metreeca.flow.services.Vault;

import eu.ec2u.data.datasets.ReferenceFrame;
import eu.ec2u.data.datasets.organizations.OrganizationFrame;

import java.net.URI;
import java.time.LocalDate;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.services.Vault.vault;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.Value.value;
import static com.metreeca.mesh.queries.Criterion.criterion;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.shim.Collections.*;
import static com.metreeca.shim.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.Localized.EN;

/**
 * United Nations Sustainable Development Goals (SDGs) SKOS Concept Scheme.
 * <p>
 * This taxonomy defines the 17 Sustainable Development Goals (SDGs) established by the United Nations in the 2030
 * Agenda for Sustainable Development. The SDGs represent an urgent call to action for all countries to address major
 * global challenges such as poverty, inequality, climate change, environmental degradation, peace, and justice.
 * <p>
 * Each goal is represented as a top-level concept in the scheme, with a short label, long label, and extended
 * description. This standardized terminology ensures consistent classification of resources related to sustainable
 * development across institutions within the EC2U alliance.
 */
public final class TopicsSDGs implements Runnable {

    private static final String DATA_URL="taxonomies-ec2u-sdgs"; // vault label

    private static final String PATH=Taxonomies.PATH+"sdgs/";


    private static final OrganizationFrame UNITED_NATIONS=new OrganizationFrame()
            .id(uri("http://un.org/"))
            .prefLabel(map(entry(EN, "United Nations")));

    public static final TaxonomyFrame SDGS=new TaxonomyFrame()
            .id(uri(PATH))
            .title(map(entry(EN, "United Nations Sustainable Development Goals")))
            .alternative(map(entry(EN, "UN SDGs")))
            .description(map(entry(EN, """
                    [The 2030 Agenda for Sustainable Development](https://sdgs.un.org/2030agenda), adopted by all \
                    United Nations Member States in 2015, provides a shared blueprint for peace and prosperity for \
                    people and the planet, now and into the future. At its heart are the 17 Sustainable Development \
                    Goals (SDGs), which are an urgent call for action by all countries - developed and developing - \
                    in a global partnership. They recognize that ending poverty and other deprivations must go \
                    hand-in-hand with strategies that improve health and education, reduce inequality, and spur \
                    economic growth – all while tackling climate change and working to preserve our oceans \
                    and forests."""
            )))
            .created(LocalDate.parse("2015-09-25"))
            .issued(LocalDate.parse("2019-12-19"))
            .rights("Copyright © 2019 United Nations")
            .accessRights(map(entry(EN, """
                    The SDG Knowledge Organization System, accessible at http://metadata.un.org/sdg, \
                    is made available free of charge and may be copied freely, duplicated and further distributed \
                    with the following citation: Amit Joshi, Luis Gonzalez Morales, Szymon Klarman, and Aaron Helton. \
                    2019. A Knowledge Organization System for the United Nations Sustainable Development Goals. \
                    New York, NY. http://metadata.un.org/sdg"""
            )))
            .publisher(UNITED_NATIONS)
            .source(new ReferenceFrame().id(uri("https://sdgs.un.org/goals")));


    public static URI code(final int code) {

        if ( code < 1 || code > 17 ) {
            throw new IllegalArgumentException(String.format("illegal SDG number <%d>", code));
        }

        return SDGS.id().resolve(String.valueOf(code));
    }


    public static void main(final String... args) {
        exec(() -> new TopicsSDGs().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Vault vault=service(vault());


    @Override public void run() {
        service(store()).modify(

                array(list(Xtream.from(
                        Stream.of(SDGS, UNITED_NATIONS),
                        Stream.of(vault.get(DATA_URL)).flatMap(new Taxonomies.Loader(SDGS))
                ))),

                value(query(new TopicFrame(true)).where("inScheme", criterion().any(SDGS)))

        );
    }

}
