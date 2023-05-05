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

import com.metreeca.link.jsonld.Property;
import com.metreeca.link.jsonld.Reverse;
import com.metreeca.link.jsonld.Type;
import com.metreeca.link.shacl.Optional;
import com.metreeca.link.shacl.Required;

import eu.ec2u.data.agents.FOAFPerson;
import eu.ec2u.data.concepts.SKOSConcept;

import java.util.Set;

@Type
public interface OrgOrganizationalUnit extends OrgOrganization {

    @Optional
    public SKOSConcept getClassification();


    @Required
    @Property("unitOf")
    public Set<OrgOrganization> getOrganizations();

    @Optional
    @Reverse
    @Property("headOf")
    public FOAFPerson getHead();

    @Property("hasMember")
    public Set<FOAFPerson> getMembers();

}
