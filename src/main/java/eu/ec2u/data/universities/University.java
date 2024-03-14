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

package eu.ec2u.data.universities;


import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.handlers.Worker;
import com.metreeca.http.jsonld.handlers.Driver;
import com.metreeca.http.jsonld.handlers.Relator;
import com.metreeca.link.Shape;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDFS;
import org.eclipse.rdf4j.model.vocabulary.VOID;

import static com.metreeca.http.Handler.handler;
import static com.metreeca.link.Frame.integer;
import static com.metreeca.link.Frame.*;
import static com.metreeca.link.Shape.integer;
import static com.metreeca.link.Shape.*;

import static eu.ec2u.data._EC2U.term;
import static eu.ec2u.data.datasets.Dataset.Dataset;
import static eu.ec2u.data.resources.Reference.Reference;
import static eu.ec2u.data.resources.Resource.Resource;

public final class University extends Delegator {

    private static final IRI SCHAC=term("schac");
    private static final IRI IMAGE=term("image");
    private static final IRI INCEPTION=term("inception");
    private static final IRI STUDENTS=term("students");
    private static final IRI COUNTRY=term("country");
    private static final IRI LOCATION=term("location");


    public static Shape University() {
        return shape(Resource(), /*OrgFormalOrganization*/

                property(SCHAC, required(), string()),
                property(IMAGE, required(), reference()),

                property(INCEPTION, optional(), year()),
                property(STUDENTS, optional(), integer()),

                property(COUNTRY, required(), Reference()),
                property(LOCATION, required(), Reference()),

                property("subsets", DCTERMS.EXTENT,

                        property("dataset", reverse(VOID.SUBSET), required(), Dataset()),
                        property(VOID.ENTITIES, required(), integer())

                )

        );
    }


    // //// foaf:Agent ////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // private Set<URI> homepages;
    // private Set<URI> mboxes;
    //
    //
    // //// org:Organization //////////////////////////////////////////////////////////////////////////////////////////////
    //
    // private String identifier;
    //
    // private Local<String> prefLabel;
    // private Local<String> altLabel;
    // private Local<String> definition;
    //
    // private Set<ORGOrganizationalUnit> units;


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public University() {
        delegate(handler(new Driver(University()), new Worker()

                .get(new Relator(frame(

                        field(ID, iri()),
                        field(RDFS.LABEL, literal("", "en")),

                        field(DCTERMS.EXTENT, frame(

                                field(reverse(VOID.SUBSET), frame(
                                        field(ID, literal("")),
                                        field(RDFS.LABEL, literal(""))
                                )),

                                field(VOID.ENTITIES, literal(integer(0)))

                        ))

                )))

        ));
    }

}
