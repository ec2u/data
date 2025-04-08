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

package eu.ec2u.data._organizations;

import com.metreeca.mesh.meta.jsonld.Class;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Namespace;
import com.metreeca.mesh.meta.jsonld.Property;
import com.metreeca.mesh.meta.shacl.Required;

import eu.ec2u.data._agents.FOAFOrganization;
import eu.ec2u.data._concepts.SKOSConcept;
import eu.ec2u.data._resources.Localized;

import java.net.URI;
import java.util.Locale;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;

@Frame
@Class("org:Organization")
@Namespace(prefix="[org]", value="http://www.w3.org/ns/org#")
@Namespace(prefix="skos", value="http://www.w3.org/2004/02/skos/core#")
public interface OrgOrganization extends FOAFOrganization {

    @Override
    default Map<Locale, String> label() {
        return prefLabel(); // !!! altLabel?
    }

    @Override

    default Map<Locale, String> comment() {
        return definition(); // !!! clip
    }


    Entry<URI, String> identifier();


    @Required
    @Localized
    @Property("skos:")
    Map<Locale, String> prefLabel();

    @Localized
    @Property("skos:")
    Map<Locale, String> altLabel();

    @Localized
    @Property("skos:")
    Map<Locale, String> definition();


    Set<SKOSConcept> classification();

    Set<OrgOrganization> subOrganizationOf();

    Set<OrgOrganization> hasSubOrganization();

}
