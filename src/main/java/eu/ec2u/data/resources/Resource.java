
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

package eu.ec2u.data.resources;

import com.metreeca.link.Local;
import com.metreeca.link.jsonld.Id;
import com.metreeca.link.jsonld.Namespace;
import com.metreeca.link.jsonld.Property;
import com.metreeca.link.jsonld.Type;
import com.metreeca.link.shacl.Required;

import eu.ec2u.data.EC2U;
import eu.ec2u.data.universities.University;
import lombok.Getter;
import lombok.Setter;

import java.net.URI;

@Type
@Namespace(EC2U.Terms)
@Namespace(prefix="dct", value="http://purl.org/dc/terms/")
@Namespace(prefix="org", value="http://rdfs.org/ns/void#")
@Namespace(prefix="rdfs", value="http://www.w3.org/2000/01/rdf-schema#")
@Namespace(prefix="skos", value="http://www.w3.org/2004/02/skos/core#")
@Namespace(prefix="void", value="http://rdfs.org/ns/void#")
@Namespace(prefix="wgs84", value="http://www.w3.org/2003/01/geo/wgs84_pos#")
@Namespace(prefix="foaf", value="http://xmlns.com/foaf/0.1/")
@Setter
@Getter
public abstract class Resource {

    @Id
    private String id;

    @Required
    @Property("rdfs:")
    private Local<String> label;

    @Property("rdfs:")
    private Local<String> comment;

    private University university;


    // @Optional
    // @Property("dct:")
    // private Instant created;
    //
    // @Optional
    // @Property("dct:")
    // private Instant issued;
    //
    // @Optional
    // @Property("dct:")
    // private Instant modified;
    //
    //
    // @Optional
    // @Property("dct:")
    // private Publisher publisher;
    //
    // @Optional
    // @Property("dct:")
    // private Reference source;
    //
    // @Property("dct:")
    // private Set<Reference> type;
    //
    // @Property("dct:")
    // private Set<Reference> subject;


    private static final class Publisher extends Resource {

        @Property("dct:")
        private URI coverage;

    }

}
