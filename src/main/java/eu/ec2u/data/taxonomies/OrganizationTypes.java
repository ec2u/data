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

import java.net.URI;
import java.time.LocalDate;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.toolkits.Resources.resource;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.tools.Store.Options.FORCE;
import static com.metreeca.mesh.util.Collections.*;
import static com.metreeca.mesh.util.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.COPYRIGHT;
import static eu.ec2u.data.EC2U.EC2U;
import static eu.ec2u.data.resources.Collection.CCBYNCND40;
import static eu.ec2u.data.resources.Localized.EN;
import static eu.ec2u.data.taxonomies.Taxonomies.TAXONOMIES;

/**
 * EC2U Organization Type SKOS Concept Scheme.
 * <p>
 * This taxonomy defines a hierarchical classification of organization types in the EC2U alliance context. The taxonomy
 * structure consists of:
 * <p>
 * - Top-level taxonomies (University, College, Association, City, Other) representing main organization categories -
 * University Unit as a special top-level concept with a rich hierarchy of specialized academic structures -
 * Second-level taxonomies under University Unit (Area, Network, Institute, Department, Centre, Group, Laboratory,
 * Facility) - Further specializations at the third and fourth levels (e.g., Virtual Institute, Research Centre, Library
 * Facility)
 * <p>
 * This scheme provides standardized terminology for categorizing organizations and their units within the EC2U
 * alliance, ensuring consistent classification across institutions.
 */
public final class OrganizationTypes implements Runnable {

    public static final URI ORGANIZATIONS=TAXONOMIES.resolve("organizations");


    private static final TaxonomyFrame TAXONOMY=new TaxonomyFrame()
            .id(ORGANIZATIONS)
            .title(map(entry(EN, "EC2U Organization Types")))
            .alternative(map(entry(EN, "EC2U Organizations")))
            .description(map(entry(EN,
                    "Standardized terminology for categorizing organizations and their units within the EC2U Alliance"
            )))
            .issued(LocalDate.parse("2024-01-01"))
            .rights(COPYRIGHT)
            .publisher(EC2U)
            .license(set(CCBYNCND40));


    public static final TopicFrame INSTITUTE=new TopicFrame().id(uri(
            ORGANIZATIONS+"/university-unit/institute"
    ));

    public static final TopicFrame VIRTUAL_INSTITUTE=new TopicFrame().id(uri(
            ORGANIZATIONS+"/university-unit/institute/virtual"
    ));

    public static final TopicFrame DEPARTMENT=new TopicFrame().id(uri(
            ORGANIZATIONS+"/university-unit/department"
    ));

    public static final TopicFrame SERVICE_CENTRE=new TopicFrame().id(uri(
            ORGANIZATIONS+"/university-unit/centre/service"
    ));

    public static final TopicFrame INTERDEPARTMENTAL_RESEARCH_CENTRE=new TopicFrame().id(uri(
            ORGANIZATIONS+"/university-unit/centre/research/interdepartmental"
    ));

    public static final TopicFrame RECOGNIZED_GROUP=new TopicFrame().id(uri(
            ORGANIZATIONS+"/university-unit/group/recognized"
    ));


    public static void main(final String... args) {
        exec(() -> new OrganizationTypes().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    @Override public void run() {
        service(store()).partition(ORGANIZATIONS).update(array(list(Xtream.from(

                Xtream.of(
                        TAXONOMY
                ).optMap(new Validate<>()),

                Stream.of(resource(OrganizationTypes.class, ".csv").toString())
                        .flatMap(new Topic.Loader(TAXONOMY))

        ))), FORCE);
    }

}