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

package eu.ec2u.data.offerings;

import com.metreeca.flow.handlers.Delegator;
import com.metreeca.flow.handlers.Worker;

import eu.ec2u.data.concepts.Concepts;
import eu.ec2u.data.concepts.ESCO;
import eu.ec2u.data.concepts.EuroSciVoc;
import eu.ec2u.data.concepts.ISCED2011;
import eu.ec2u.data.organizations.Organizations;
import eu.ec2u.work._junk.Driver;
import eu.ec2u.work._junk.Filter;
import eu.ec2u.work._junk.Relator;
import eu.ec2u.work._junk.Shape;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.RDFS;

import static com.metreeca.flow.Handler.handler;
import static com.metreeca.flow.rdf.Values.iri;
import static com.metreeca.flow.rdf.Values.literal;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.create;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.concepts.Concepts.Concept;
import static eu.ec2u.data.datasets.Datasets.Dataset;
import static eu.ec2u.data.resources.Resources.locales;
import static eu.ec2u.data.things.Schema.*;
import static eu.ec2u.work._junk.Frame.field;
import static eu.ec2u.work._junk.Frame.frame;
import static eu.ec2u.work._junk.Shape.*;
import static org.eclipse.rdf4j.model.vocabulary.XSD.ID;

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

                property(teaches, optional(text(locales()))),
                property(assesses, optional(text(locales()))),

                property(numberOfCredits, optional(decimal(), Shape.minInclusive(0))),
                property(educationalCredentialAwarded, optional(text(locales()))),
                property(occupationalCredentialAwarded, optional(text(locales()))),

                property(provider, optional(Organizations.Organization())),

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


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public Offerings() {
        delegate(handler(new Driver(Dataset(LearningResource())), new Worker()

                .get(new Relator(frame(

                        field(ID, iri()),
                        field(RDFS.LABEL, literal("EC2U Knowledge Hub Resources", "en")),

                        field(RDFS.MEMBER, Filter.query(

                                frame(

                                        field(ID, iri()),
                                        field(RDFS.LABEL, literal("", ANY_LOCALE))

                                )

                        ))

                )))

        ));
    }
}
