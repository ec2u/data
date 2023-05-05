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

package eu.ec2u.data.universities;


import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.handlers.Worker;
import com.metreeca.jsonld.handlers.Relator;
import com.metreeca.link.Local;
import com.metreeca.link.jsonld.Property;
import com.metreeca.link.jsonld.Type;
import com.metreeca.link.jsonld.Virtual;
import com.metreeca.link.shacl.Optional;
import com.metreeca.link.shacl.Required;

import eu.ec2u.data.organizations.OrgFormalOrganization;
import eu.ec2u.data.organizations.OrgOrganizationalUnit;
import eu.ec2u.data.resources.Reference;
import eu.ec2u.data.resources.Resource;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.net.URI;
import java.time.LocalDateTime;
import java.util.Set;

import static com.metreeca.link.Frame.with;
import static com.metreeca.link.Local.local;

@Type
@Getter
@Setter
public final class University extends Resource implements OrgFormalOrganization {

    //// foaf:Agent ////////////////////////////////////////////////////////////////////////////////////////////////////

    private Set<URI> homepages;
    private Set<URI> mboxes;


    //// org:Organization //////////////////////////////////////////////////////////////////////////////////////////////

    private String identifier;

    private Local<String> prefLabel;
    private Local<String> altLabel;
    private Local<String> definition;

    private Set<OrgOrganizationalUnit> units;


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Required
    private String schac;

    @Required
    private URI image;


    @Optional
    private LocalDateTime inception;

    @Optional
    private BigInteger students;


    @Optional
    private Reference country;

    @Optional
    private Reference location;

    @Optional
    @Property("wgs84:lat")
    private BigDecimal latitude;

    @Optional
    @Property("wgs84:long")
    private BigDecimal longitude;


    @Property("dct:extent")
    private Set<Subset> subsets;

    @Virtual
    @Property("rdfs:")
    private Reference seeAlso;


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static final class Handler extends Delegator {

        public Handler() {
            delegate(new Worker()

                    .get(new Relator(with(new University(), university -> {

                        university.setId("");
                        university.setLabel(local("en", ""));

                    })))

            );
        }

    }

}
