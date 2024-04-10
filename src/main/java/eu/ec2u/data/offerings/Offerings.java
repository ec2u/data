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

package eu.ec2u.data.offerings;

import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.handlers.Worker;
import com.metreeca.http.jsonld.handlers.Driver;
import com.metreeca.http.jsonld.handlers.Relator;
import com.metreeca.link.Shape;

import eu.ec2u.data.concepts.Concepts;
import eu.ec2u.data.concepts.ESCO;
import eu.ec2u.data.concepts.EuroSciVoc;
import eu.ec2u.data.concepts.ISCED2011;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.RDFS;

import static com.metreeca.http.Handler.handler;
import static com.metreeca.link.Frame.*;
import static com.metreeca.link.Query.query;
import static com.metreeca.link.Shape.decimal;
import static com.metreeca.link.Shape.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.create;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.concepts.Concepts.Concept;
import static eu.ec2u.data.datasets.Datasets.Dataset;
import static eu.ec2u.data.resources.Resources.localized;
import static eu.ec2u.data.things.Schema.*;

public final class Offerings extends Delegator {

    public static final IRI Context=item("/offerings/");
    public static final IRI Types=iri(Concepts.Context, "/offering-types");

    private static final IRI LearningResource=schema("LearningResource");

    public static final IRI teaches=schema("teaches");
    public static final IRI assesses=schema("assesses");
    public static final IRI competencyRequired=schema("competencyRequired");

    public static final IRI numberOfCredits=schema("numberOfCredits");
    public static final IRI educationalCredentialAwarded=schema("educationalCredentialAwarded");
    public static final IRI occupationalCredentialAwarded=schema("occupationalCredentialAwarded");

    public static final IRI provider=schema("provider");

    public static final IRI educationalLevel=schema("educationalLevel");
    public static final IRI learningResourceType=schema("learningResourceType");
    public static final IRI occupationalCategory=schema("occupationalCategory");


    public static Shape LearningResource() {
        return shape(LearningResource, Thing(),

                property(teaches, optional(localized())),
                property(assesses, optional(localized())),

                property(numberOfCredits, optional(decimal(), minInclusive(0))),
                property(educationalCredentialAwarded, optional(localized())),
                property(occupationalCredentialAwarded, optional(localized())),

                property(provider, optional(Organization())),

                property(educationalLevel, optional(Concept(), scheme(ISCED2011.Scheme))),
                property(learningResourceType, multiple(Concept(), scheme(Types))),
                property(about, multiple(Concept(), scheme(EuroSciVoc.Scheme))),
                property(occupationalCategory, multiple(Concept(), scheme(ESCO.Occupations))),
                property(competencyRequired, multiple(Concept(), scheme(ESCO.Skills)))

        );
    }


    public static void main(final String... args) {
        exec(() -> create(Context, Offerings.class, LearningResource()));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public Offerings() {
        delegate(handler(new Driver(Dataset(LearningResource())), new Worker()

                .get(new Relator(frame(

                        field(ID, iri()),
                        field(RDFS.LABEL, literal("EC2U Knowledge Hub Resources", "en")),

                        field(RDFS.MEMBER, query(

                                frame(

                                        field(ID, iri()),
                                        field(RDFS.LABEL, literal("", WILDCARD))

                                )

                        ))

                )))

        ));
    }
}
