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

package eu.ec2u.data.persons;

import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.rdf4j.actions.Upload;
import com.metreeca.link.Shape;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.FOAF;
import org.eclipse.rdf4j.model.vocabulary.ORG;
import org.eclipse.rdf4j.model.vocabulary.RDF;

import java.util.stream.Stream;

import static com.metreeca.http.rdf.formats.RDF.rdf;
import static com.metreeca.http.toolkits.Resources.resource;
import static com.metreeca.link.Shape.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.*;
import static eu.ec2u.data.agents.Agents.FOAFAgent;
import static eu.ec2u.data.resources.Resources.Reference;
import static eu.ec2u.data.resources.Resources.Resource;

public final class Persons extends Delegator {

    public static final IRI Context=item("/persons/");

    public static final IRI Person=term("Person");


    public static Shape Person() {
        return shape(Resource(), FOAFPerson(),

                property(RDF.TYPE, hasValue(Person))

        );
    }

    public static Shape FOAFPerson() {
        return shape(FOAFAgent(),

                // !!! property(FOAF.TITLE, optional( string()), // !!! pattern
                property(FOAF.GIVEN_NAME, required(string())), // !!! pattern
                property(FOAF.FAMILY_NAME, required(string())), // !!! pattern

                property(ORG.HEAD_OF, multiple(Reference())),
                property(ORG.MEMBER_OF, multiple(Reference()))

        );
    }


    public static void main(final String... args) {
        exec(() -> Stream

                .of(rdf(resource(Persons.class, ".ttl"), Base))

                .forEach(new Upload()
                        .contexts(Context)
                        .clear(true)
                )
        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Persons() { }

}