/*
 * Copyright © 2020-2022 EC2U Alliance
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

package eu.ec2u.data.tasks.units;

import com.metreeca.rdf4j.actions.Update;

import eu.ec2u.data.terms.EC2U;
import org.eclipse.rdf4j.model.IRI;

import java.util.stream.Stream;

import static com.metreeca.core.Locator.service;
import static com.metreeca.core.toolkits.Lambdas.task;
import static com.metreeca.rdf4j.services.Graph.graph;

public final class Units_ {

    public static void clear(final IRI university) {
        service(graph()).update(task(connection -> Stream

                .of(""
                        +"prefix ec2u: </terms/>\n"
                        +"prefix org: <http://www.w3.org/ns/org#>\n"
                        +"\n"
                        +"delete {\n"
                        +"\n"
                        +"\t?u ?p ?o.\n"
                        +"\t?h org:headOf ?u.\n"
                        +"\t\n"
                        +"} where {\n"
                        +"\n"
                        +"\t?u a ec2u:Unit;\n"
                        +"\t\tec2u:university $university.\n"
                        +"\n"
                        +"\toptional { ?u ?p ?o }\n"
                        +"\toptional { ?h org:headOf ?u }\n"
                        +"\n"
                        +"}"
                )

                .forEach(new Update()
                        .base(EC2U.Base)
                        .binding("university", university)
                )

        ));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Units_() { }

}
