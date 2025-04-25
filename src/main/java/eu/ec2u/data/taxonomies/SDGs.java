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

package eu.ec2u.data.taxonomies;

import com.metreeca.flow.json.actions.Validate;
import com.metreeca.flow.work.Xtream;

import eu.ec2u.data.organizations.OrgOrganizationFrame;
import eu.ec2u.data.resources.ReferenceFrame;
import eu.ec2u.work.CSVProcessor;
import org.apache.commons.csv.CSVRecord;

import java.net.URI;
import java.time.LocalDate;
import java.util.Collection;
import java.util.Optional;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.toolkits.Resources.resource;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.tools.Store.Options.FORCE;
import static com.metreeca.mesh.util.Collections.*;
import static com.metreeca.mesh.util.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.resources.Localized.EN;
import static eu.ec2u.data.taxonomies.Taxonomies.TAXONOMIES;

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
public final class SDGs implements Runnable {

    private static final URI SDGS=TAXONOMIES.resolve("sdgs");


    private static final OrgOrganizationFrame UNITED_NATIONS=new OrgOrganizationFrame()
            .id(uri("http://un.org/"))
            .prefLabel(map(entry(EN, "United Nations")));

    private static final TaxonomyFrame TAXONOMY=new TaxonomyFrame()
            .id(SDGS)
            .title(map(entry(EN, "United Nations Sustainable Development Goals")))
            .alternative(map(entry(EN, "UN SDGs")))
            .description(map(entry(EN,
                    """
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
            .source(new ReferenceFrame()
                    .id(uri("https://sdgs.un.org/goals")));


    public static void main(final String... args) {
        exec(() -> new SDGs().run());
    }


    @Override public void run() {
        service(store()).partition(SDGS).update(array(list(Xtream

                .from(

                        Stream.of(
                                TAXONOMY,
                                UNITED_NATIONS
                        ),

                        Stream.of(resource(SDGs.class, ".csv").toString())
                                .flatMap(new Loader())

                )

                .optMap(new Validate<>())

        )), FORCE);
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static final class Loader extends CSVProcessor<TopicFrame> {

        @Override protected Optional<TopicFrame> process(final CSVRecord record, final Collection<CSVRecord> records) {
            return value(record, "Goal Number").map(number -> new TopicFrame()

                    .id(uri(SDGS+"/"+number))
                    .notation(number)

                    .prefLabel(value(record, "Short Label").map(v -> map(entry(EN, v))).orElse(null))
                    .definition(value(record, "Extended Description").map(v -> map(entry(EN, v))).orElse(null))

                    .inScheme(TAXONOMY)
                    .topConceptOf(TAXONOMY));
        }

    }

}