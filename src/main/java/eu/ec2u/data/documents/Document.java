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

package eu.ec2u.data.documents;

import com.metreeca.mesh.meta.jsonld.Class;
import com.metreeca.mesh.meta.jsonld.Forward;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Namespace;
import com.metreeca.mesh.meta.shacl.MaxLength;
import com.metreeca.mesh.meta.shacl.Required;

import eu.ec2u.data.organizations.OrgOrganization;
import eu.ec2u.data.persons.Person;
import eu.ec2u.data.resources.Localized;
import eu.ec2u.data.resources.Reference;
import eu.ec2u.data.resources.Resource;
import eu.ec2u.data.taxonomies.Topic;

import java.time.LocalDate;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Frame
@Class("ec2u:")
@Namespace(prefix="[dct]", value="http://purl.org/dc/terms/")
@Namespace(prefix="schema", value="https://schema.org/")
public interface Document extends Resource {

    @Forward("schema:")
    Set<String> url();


    String identifier();

    Set<String> language();


    @Required
    @Localized
    @MaxLength(100)
    Map<Locale, String> title();

    @Localized
    @MaxLength(5000)
    Map<Locale, String> description();


    Person creator();

    Set<Person> contributor();

    OrgOrganization publisher();


    LocalDate created();

    LocalDate issued();

    LocalDate modified();


    String valid();

    String rights();

    @Localized
    Map<Locale, String> accessRights();

    Reference license();


    // !!! Set<Topic> type();

    Set<Topic> subject();

    Set<Topic> audience();

    Set<Document> relation();

}
