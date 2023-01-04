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

package eu.ec2u.data.ports;

import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.handlers.Router;
import com.metreeca.jsonld.handlers.Driver;
import com.metreeca.jsonld.handlers.Relator;
import com.metreeca.link.Shape;

import eu.ec2u.data.terms.EC2U;
import eu.ec2u.data.terms.Schema;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.XSD;

import static com.metreeca.http.Handler.handler;
import static com.metreeca.link.Values.literal;
import static com.metreeca.link.shapes.All.all;
import static com.metreeca.link.shapes.Clazz.clazz;
import static com.metreeca.link.shapes.Datatype.datatype;
import static com.metreeca.link.shapes.Field.field;
import static com.metreeca.link.shapes.Guard.*;
import static com.metreeca.link.shapes.MinInclusive.minInclusive;
import static com.metreeca.link.shapes.Pattern.pattern;

import static eu.ec2u.data.terms.EC2U.Reference;
import static eu.ec2u.data.terms.EC2U.multilingual;


public final class Courses extends Delegator {

    public static Shape Course() {
        return relate(EC2U.Resource(), Schema.Thing(),

                hidden(field(RDF.TYPE, all(EC2U.Course))),

                field("fullDescription", Schema.description), // prevent clashes with dct:description

                field(Schema.provider, optional(), Reference()),
                field(Schema.courseCode, optional(), datatype(XSD.STRING)),
                field(Schema.educationalLevel, optional(), Reference()),
                field(Schema.inLanguage, optional(), datatype(XSD.STRING), pattern("[a-z]{2}")),
                field(Schema.numberOfCredits, optional(), datatype(XSD.INTEGER), minInclusive(literal(0))),
                field(Schema.timeRequired, optional(), datatype(XSD.DURATION)),

                field(Schema.about, optional(), Reference()),

                field(Schema.teaches, multilingual()),
                field(Schema.assesses, multilingual()),
                field(Schema.coursePrerequisites, multilingual()),
                field(Schema.learningResourceType, multilingual()),
                field(Schema.competencyRequired, multilingual()),

                field(Schema.educationalCredentialAwarded, multilingual()),
                field(Schema.occupationalCredentialAwarded, multilingual())

        );
    }


    public Courses() {
        delegate(handler(

                new Driver(Course(),

                        filter(clazz(EC2U.Course))

                ),

                new Router()

                        .path("/", new Router()
                                .get(new Relator())
                        )

                        .path("/{id}", new Router()
                                .get(new Relator())
                        )

        ));
    }

}