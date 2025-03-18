/*
 * Copyright © 2020-2025 EC2U Alliance
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

import com.metreeca.flow.handlers.Delegator;
import com.metreeca.flow.handlers.Worker;

import eu.ec2u.work._junk.Driver;
import eu.ec2u.work._junk.Filter;
import eu.ec2u.work._junk.Relator;
import eu.ec2u.work._junk.Shape;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.FOAF;
import org.eclipse.rdf4j.model.vocabulary.RDFS;

import static com.metreeca.flow.Handler.handler;
import static com.metreeca.flow.rdf.Values.iri;
import static com.metreeca.flow.rdf.Values.literal;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.create;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.datasets.Datasets.Dataset;
import static eu.ec2u.data.resources.Resources.Resource;
import static eu.ec2u.data.resources.Resources.university;
import static eu.ec2u.work._junk.Frame.field;
import static eu.ec2u.work._junk.Frame.frame;
import static eu.ec2u.work._junk.Shape.*;
import static org.eclipse.rdf4j.model.vocabulary.XSD.ID;

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


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public Agents() {
        delegate(handler(new Driver(Agents()), new Worker()

                .get(new Relator(frame(

                        field(ID, iri()),
                        field(RDFS.LABEL, literal("EC2U Knowledge Hub Agents", "en")),

                        field(RDFS.MEMBER, Filter.query(

                                frame(

                                        field(ID, iri()),
                                        field(RDFS.LABEL, literal("", "en")),

                                        field(university, iri())

                                )

                        ))

                )))

        ));
    }

}
