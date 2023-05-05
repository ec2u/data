/*
 * Copyright © 2020-2023 EC2U Alliance
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

import com.metreeca.link.Local;
import com.metreeca.link.jsonld.Namespace;
import com.metreeca.link.jsonld.Property;
import com.metreeca.link.jsonld.Type;
import com.metreeca.link.shacl.Optional;
import com.metreeca.link.shacl.Required;

import eu.ec2u.data.agents.FOAFAgent;

import java.util.Set;

@Type
@Namespace("http://www.w3.org/ns/org#")
@Namespace(prefix="skos", value="http://www.w3.org/2004/02/skos/core#>")
public interface OrgOrganization extends FOAFAgent {

    @Optional
    public String getIdentifier();


    @Required
    @Property("skos:")
    public Local<String> getPrefLabel();

    @Required
    @Property("skos:")
    public Local<String> getAltLabel();

    @Required
    @Property("skos:")
    public Local<String> getDefinition();


    @Property("hasUnit")
    public Set<OrgOrganizationalUnit> getUnits();

}
