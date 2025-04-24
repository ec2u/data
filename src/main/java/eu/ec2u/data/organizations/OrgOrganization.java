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

package eu.ec2u.data.organizations;

import com.metreeca.mesh.meta.jsonld.*;
import com.metreeca.mesh.meta.jsonld.Class;
import com.metreeca.mesh.meta.shacl.Required;

import eu.ec2u.data.agents.FOAFOrganization;
import eu.ec2u.data.agents.FOAFPerson;
import eu.ec2u.data.concepts.SKOSConcept;
import eu.ec2u.data.resources.Localized;
import eu.ec2u.data.resources.Reference;

import java.net.URI;
import java.util.Locale;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;

@Frame
@Class("org:Organization")
@Namespace(prefix="[org]", value="http://www.w3.org/ns/org#")
@Namespace(prefix="skos", value="http://www.w3.org/2004/02/skos/core#")
@SuppressWarnings("NonBooleanMethodNameMayNotStartWithQuestion")
public interface OrgOrganization extends FOAFOrganization {

    @Override
    default Map<Locale, String> label() {
        return Reference.label(altLabel(), prefLabel());
    }

    @Override
    default Map<Locale, String> comment() {
        return Reference.comment(definition());
    }


    Entry<URI, String> identifier();


    @Required
    @Localized
    @Forward("skos:")
    Map<Locale, String> prefLabel();

    @Localized
    @Forward("skos:")
    Map<Locale, String> altLabel();

    @Localized
    @Forward("skos:")
    Map<Locale, String> definition();


    Set<SKOSConcept> classification();


    Set<OrgOrganization> subOrganizationOf();

    @Foreign
    Set<OrgOrganization> hasSubOrganization();

    @Foreign
    Set<OrgOrganizationalUnit> hasUnit();


    @Foreign
    @Reverse("org:headOf")
    Set<FOAFPerson> hasHead();

    @Foreign
    Set<FOAFPerson> hasMember();

}
