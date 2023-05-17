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

package eu.ec2u.data.units;


import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.handlers.Worker;
import com.metreeca.http.jsonld.handlers.Relator;
import com.metreeca.link.Local;
import com.metreeca.link.jsonld.Type;

import eu.ec2u.data.agents.FOAFPerson;
import eu.ec2u.data.concepts.SKOSConcept;
import eu.ec2u.data.organizations.OrgOrganization;
import eu.ec2u.data.organizations.OrgOrganizationalUnit;
import eu.ec2u.data.resources.Resource;
import lombok.Getter;
import lombok.Setter;

import java.net.URI;
import java.util.Set;

@Type
@Getter
@Setter
public final class Unit extends Resource implements OrgOrganizationalUnit {

    // foaf:Agent

    private Set<URI> homepages;
    private Set<URI> mboxes;


    // org:Organization

    private String identifier;

    private Local<String> prefLabel;
    private Local<String> altLabel;
    private Local<String> definition;

    private Set<OrgOrganizationalUnit> units;


    // org:OrganizationalUnit

    private SKOSConcept classification; // !!! from /concepts/units/

    private Set<OrgOrganization> organizations;

    private FOAFPerson head;
    private Set<FOAFPerson> members;


    public static final class Handler extends Delegator {

        public Handler() {
            delegate(new Worker()

                    .get(new Relator(new Unit()))

            );
        }

    }

}
