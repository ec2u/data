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

import com.metreeca.link.Shape;

import eu.ec2u.data.concepts.Concepts;
import eu.ec2u.data.concepts.EuroSciVoc;
import eu.ec2u.data.concepts.ISCED2011;
import eu.ec2u.data.things.Schema;
import org.eclipse.rdf4j.model.IRI;

import static com.metreeca.http.rdf.Values.iri;
import static com.metreeca.link.Shape.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.create;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.concepts.Concepts.Concept;
import static eu.ec2u.data.resources.Resources.localized;
import static eu.ec2u.data.things.Schema.Thing;
import static eu.ec2u.data.things.Schema.schema;

public final class Offerings {

    public static final IRI Context=item("/offerings/");
    public static final IRI Types=iri(Concepts.Context, "/offering-types");

    public static final IRI numberOfCredits=schema("numberOfCredits");
    public static final IRI educationalCredentialAwarded=schema("educationalCredentialAwarded");
    public static final IRI occupationalCredentialAwarded=schema("occupationalCredentialAwarded");

    public static final IRI provider=schema("provider");
    public static final IRI educationalLevel=schema("educationalLevel");


    public static Shape Offering() {
        return shape(Thing(),

                property(numberOfCredits, optional(decimal(), minInclusive(0))),
                property(educationalCredentialAwarded, optional(localized())),
                property(occupationalCredentialAwarded, optional(localized())),

                property(provider, optional(Schema.Organization())),

                property(educationalLevel, optional(Concept(), scheme(ISCED2011.Scheme))),
                property(Schema.about, multiple(Concept(), scheme(EuroSciVoc.Scheme)))

        );
    }


    public static void main(final String... args) {
        exec(() -> create(Context, Offerings.class, Offering()));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Offerings() { }

}
