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

package eu.ec2u.data.agents;

import com.metreeca.mesh.meta.jsonld.Class;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Namespace;
import com.metreeca.mesh.meta.jsonld.Property;
import com.metreeca.mesh.meta.owl.Inverse;
import com.metreeca.mesh.meta.shacl.Required;

import eu.ec2u.data.organizations.OrgOrganization;

import java.util.Locale;
import java.util.Map;
import java.util.Set;

import static com.metreeca.mesh.util.Collections.map;

import static java.util.Locale.ROOT;
import static java.util.Map.entry;

@Frame
@Class("foaf:Person")
@Namespace(prefix="org", value="http://www.w3.org/ns/org#")
public interface FOAFPerson extends FOAFAgent {

    @Override
    default Map<Locale, String> label() {
        return map(entry(ROOT, "%s, %s".formatted(familyName(), givenName())));
    }


    String title();

    @Required
    String givenName();

    @Required
    String familyName();


    @Property("org:")
    Set<OrgOrganization> headOf();

    @Property("org:")
    @Inverse("org:hasMember")
    Set<OrgOrganization> memberOf();

}
