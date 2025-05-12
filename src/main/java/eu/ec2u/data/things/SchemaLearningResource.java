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

package eu.ec2u.data.things;

import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.shacl.MinInclusive;

import eu.ec2u.data.organizations.Organization;
import eu.ec2u.data.resources.Localized;
import eu.ec2u.data.taxonomies.Topic;

import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Frame
public interface SchemaLearningResource extends SchemaThing {

    @Override
    default Map<Locale, String> description() { return teaches(); }


    @Localized
    Map<Locale, String> teaches();

    @Localized
    Map<Locale, String> assesses();


    @MinInclusive("0.0")
    double numberOfCredits();


    @Localized
    Map<Locale, String> educationalCredentialAwarded();

    @Localized
    Map<Locale, String> occupationalCredentialAwarded();


    Organization provider();

    Topic educationalLevel();


    Set<Topic> about(); // !!! EuroSciVoc

    Set<Topic> occupationalCategory(); // !!! ESCO Occupations

    Set<Topic> competencyRequired(); // !!! ESCO SKills

}