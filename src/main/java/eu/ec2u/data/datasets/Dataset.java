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

package eu.ec2u.data.datasets;

import com.metreeca.link.Local;
import com.metreeca.link.jsonld.Property;
import com.metreeca.link.jsonld.Type;
import com.metreeca.link.shacl.Required;

import eu.ec2u.data.resources.Container;
import eu.ec2u.data.resources.Reference;
import eu.ec2u.data.resources.Resource;
import lombok.Getter;
import lombok.Setter;

import java.math.BigInteger;
import java.net.URI;
import java.time.Instant;

@Type
@Getter
@Setter
public class Dataset<T extends Resource> extends Container<T> { // !!! abstract/final

    @Property("dct:")
    private Instant available;

    @Required
    @Property("dct:")
    private String rights;

    @Property("dct:")
    private Reference license;

    @Property("dct:")
    private Local<String> accessRights;

    @Property("void:")
    private BigInteger entities;

    @Property("rdfs:")
    private URI isDefinedBy;

}
