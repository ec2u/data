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

import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.handlers.Worker;
import com.metreeca.jsonld.handlers.Relator;
import com.metreeca.link.Local;
import com.metreeca.link.jsonld.Property;
import com.metreeca.link.jsonld.Type;
import com.metreeca.link.shacl.Optional;
import com.metreeca.link.shacl.Required;

import eu.ec2u.data.resources.Reference;
import eu.ec2u.data.resources.Resource;
import lombok.Getter;
import lombok.Setter;

import java.math.BigInteger;
import java.net.URI;
import java.time.Instant;

import static com.metreeca.link.Frame.with;
import static com.metreeca.link.Local.local;

@Type
@Getter
@Setter
public final class Dataset extends Resource {

    @Optional
    @Property("dct:")
    private Instant available;

    @Required
    @Property("dct:")
    private String rights;

    @Optional
    @Property("dct:")
    private Reference license;

    @Optional
    @Property("dct:")
    private Local<String> accessRights;

    @Optional
    @Property("void:")
    private BigInteger entities;

    @Optional
    @Property("rdfs:")
    private URI isDefinedBy;


    public static final class Handler extends Delegator {

        public Handler() {
            delegate(new Worker()

                    .get(new Relator(with(new Dataset(), dataset -> {

                        dataset.setId("");
                        dataset.setLabel(local("en", ""));

                    })))

            );
        }

    }
}
