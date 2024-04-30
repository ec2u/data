/*
 * Copyright © 2020-2024 EC2U Alliance
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

package eu.ec2u.data.agents;

import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.handlers.Worker;
import com.metreeca.http.jsonld.handlers.Driver;
import com.metreeca.http.jsonld.handlers.Relator;
import com.metreeca.link.Shape;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.FOAF;
import org.eclipse.rdf4j.model.vocabulary.RDFS;

import static com.metreeca.http.Handler.handler;
import static com.metreeca.link.Frame.*;
import static com.metreeca.link.Query.query;
import static com.metreeca.link.Shape.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.create;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.datasets.Datasets.Dataset;
import static eu.ec2u.data.resources.Resources.Resource;
import static eu.ec2u.data.resources.Resources.partner;

public final class Agents extends Delegator {

    public static final IRI Context=item("/agents/");


    public static Shape Agents() { return Dataset(Agent()); }

    public static Shape Agent() {
        return shape(FOAF.AGENT, Resource(),

                property(FOAF.DEPICTION, multiple(id())),
                property(FOAF.HOMEPAGE, multiple(id())),
                property(FOAF.MBOX, multiple(string())),
                property(FOAF.PHONE, multiple(string()))

        );
    }


    public static void main(final String... args) {
        exec(() -> create(Context, Agents.class, Agent()));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public Agents() {
        delegate(handler(new Driver(Agents()), new Worker()

                .get(new Relator(frame(

                        field(ID, iri()),
                        field(RDFS.LABEL, literal("EC2U Knowledge Hub Agents", "en")),

                        field(RDFS.MEMBER, query(

                                frame(

                                        field(ID, iri()),
                                        field(RDFS.LABEL, literal("", ANY_LOCALE)),

                                        field(partner, iri())

                                )

                        ))

                )))

        ));
    }

}
