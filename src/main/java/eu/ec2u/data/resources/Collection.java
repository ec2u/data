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

package eu.ec2u.data.resources;

import com.metreeca.mesh.meta.jsonld.*;
import com.metreeca.mesh.meta.jsonld.Class;
import com.metreeca.mesh.meta.shacl.Required;

import eu.ec2u.data.organizations.OrgOrganization;
import eu.ec2u.data.taxonomies.Topic;

import java.time.LocalDate;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Frame
@Class("ec2u:")
@Namespace(prefix="[dct]", value="http://purl.org/dc/terms/")
public interface Collection extends Resource {

    @Override
    default Map<Locale, String> label() {
        return Reference.comment(alternative(), title());
    }

    @Override
    default Map<Locale, String> comment() {
        return Reference.comment(description());
    }


    @Required
    @Localized
    Map<Locale, String> title();

    @Localized
    Map<Locale, String> alternative();

    @Localized
    Map<Locale, String> description();


    LocalDate created();

    LocalDate issued();

    LocalDate modified();


    OrgOrganization publisher();

    Reference source();


    String rights();

    Set<Reference> license();

    @Localized
    Map<Locale, String> accessRights();


    Set<Topic> subject();

    @Foreign
    @Reverse("ec2u:collection")
    Set<? extends Resource> members();

}
