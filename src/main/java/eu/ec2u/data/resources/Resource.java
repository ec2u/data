
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
import com.metreeca.link.shacl.MaxLength;
import com.metreeca.link.shacl.Optional;
import com.metreeca.link.shacl.Required;

import eu.ec2u.data.EC2U;
import lombok.Getter;
import lombok.Setter;

import java.net.URI;
import java.time.Instant;
import java.util.Set;

@Type
@Namespace(EC2U.Terms)
@Namespace(prefix="rdfs", value="http://www.w3.org/2000/01/rdf-schema#")
@Namespace(prefix="dct", value="http://purl.org/dc/terms/")
@Namespace(prefix="wgs84", value="http://www.w3.org/2003/01/geo/wgs84_pos#")
@Setter
@Getter
public abstract class Resource {

    @Id
    private String id;

    @Required
    @Property("rdfs:")
    private Local<String> label;

    @Optional
    @Property("rdfs:")
    private Local<String> comment;


    @Optional
    @Property("dct:")
    private Instant created;

    @Optional
    @Property("dct:")
    private Instant issued;

    @Optional
    @Property("dct:")
    private Instant modified;


    @Required
    @MaxLength(100)
    @Property("dct:")
    private Local<String> title;

    @Optional
    @MaxLength(1000)
    @Property("dct:")
    private Local<String> description;


    @Optional
    @Property("dct:")
    private Publisher publisher;

    @Optional
    @Property("dct:")
    private Reference source;

    @Property("dct:")
    private Set<Reference> type;

    @Property("dct:")
    private Set<Reference> subject;


    private static final class Publisher extends Resource {

        @Optional
        @Property("dct:")
        private URI coverage;

    }

}
