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

package eu.ec2u.data.licenses;

import com.metreeca.http.handlers.Delegator;
import com.metreeca.rdf.actions.Retrieve;
import com.metreeca.rdf4j.actions.Upload;

import eu.ec2u.data.ontologies.EC2U;
import org.eclipse.rdf4j.model.IRI;

import java.util.stream.Stream;

import static com.metreeca.core.toolkits.Resources.resource;

import static eu.ec2u.data.Data.exec;


public final class Licenses extends Delegator {

    public static final IRI Context=EC2U.item("/licenses/");

    public static void main(final String... args) {
        exec(() -> Stream.of(resource(Licenses.class, ".ttl").toString())

                .map(new Retrieve()
                        .base(EC2U.Base)
                )

                .forEach(new Upload()
                        .contexts(Context)
                        .clear(true)
                )
        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Licenses() { }

}