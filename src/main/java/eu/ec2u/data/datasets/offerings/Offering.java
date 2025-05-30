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

package eu.ec2u.data.datasets.offerings;

import com.metreeca.flow.Xtream;
import com.metreeca.mesh.meta.jsonld.Embedded;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Namespace;
import com.metreeca.mesh.meta.shacl.Pattern;

import eu.ec2u.data.datasets.Reference;
import eu.ec2u.data.datasets.Resource;
import eu.ec2u.data.datasets.organizations.Organization;
import eu.ec2u.data.datasets.taxonomies.Taxonomies;
import eu.ec2u.data.datasets.taxonomies.Topic;
import eu.ec2u.data.datasets.taxonomies.TopicsISCED2011;
import eu.ec2u.data.datasets.taxonomies.TopicsISCEDF2013;
import eu.ec2u.data.vocabularies.schema.SchemaLearningResource;
import eu.ec2u.work.ai.Embedder;

import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static com.metreeca.shim.Collections.set;

import static eu.ec2u.data.datasets.Localized.EN;
import static eu.ec2u.data.datasets.taxonomies.TopicsEC2UStakeholders.EC2U_STAKEHOLDERS;
import static eu.ec2u.data.datasets.taxonomies.TopicsISCED2011.ISCED2011;
import static eu.ec2u.data.datasets.taxonomies.TopicsISCEDF2013.ISCEDF2013;

@Frame
@Namespace("[ec2u]")
public interface Offering extends Resource, SchemaLearningResource {

    static Taxonomies.Matcher isced2011() {
        return new Taxonomies.Matcher(ISCED2011)
                .narrowing(1.1)
                .tolerance(0.1);
    }

    static Taxonomies.Matcher iscedf() {
        return new Taxonomies.Matcher(ISCEDF2013)
                .narrowing(1.1)
                .tolerance(0.1);
    }

    static Taxonomies.Matcher stakeholders() {
        return new Taxonomies.Matcher(EC2U_STAKEHOLDERS)
                .narrowing(1.1)
                .tolerance(0.1);
    }


    static String embeddable(final Offering offering) {
        return Embedder.embeddable(set(Xtream.from(
                Optional.ofNullable(offering.name().get(EN)).stream(),
                Optional.ofNullable(offering.description().get(EN)).stream(),
                Optional.ofNullable(offering.disambiguatingDescription().get(EN)).stream(),
                Optional.ofNullable(offering.teaches().get(EN)).stream()
        )));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    default Map<Locale, String> label() {
        return Reference.label(name());
    }

    @Override
    default Map<Locale, String> comment() {
        return Reference.comment(disambiguatingDescription(), description());
    }


    @Override
    @Embedded
    Organization provider();

    @Pattern("^"+TopicsISCED2011.PATH+".*$") // !!! @Prefix
    Topic educationalLevel();

    @Pattern("^"+TopicsISCEDF2013.PATH+".*$") // !!! @Prefix
    Set<Topic> about();

}
