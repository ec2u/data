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

package eu.ec2u.data.resources.courses;

import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.handlers.Router;
import com.metreeca.jsonld.handlers.Driver;
import com.metreeca.jsonld.handlers.Relator;
import com.metreeca.link.Shape;
import com.metreeca.rdf.actions.Retrieve;
import com.metreeca.rdf4j.actions.Upload;

import eu.ec2u.data.ontologies.EC2U;
import eu.ec2u.data.ontologies.Schema;
import eu.ec2u.data.resources.Resources;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.XSD;

import java.util.stream.Stream;

import static com.metreeca.core.toolkits.Resources.resource;
import static com.metreeca.http.Handler.handler;
import static com.metreeca.link.Values.literal;
import static com.metreeca.link.shapes.All.all;
import static com.metreeca.link.shapes.Clazz.clazz;
import static com.metreeca.link.shapes.Datatype.datatype;
import static com.metreeca.link.shapes.Field.field;
import static com.metreeca.link.shapes.Guard.*;
import static com.metreeca.link.shapes.MinInclusive.minInclusive;
import static com.metreeca.link.shapes.Pattern.pattern;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.ontologies.EC2U.multilingual;
import static eu.ec2u.data.resources.Resources.Reference;


public final class Courses extends Delegator {

    public static final IRI Context=EC2U.item("/courses/");

    public static final IRI Course=EC2U.term("Course");


    public static Shape Course() {
        return relate(Resources.Resource(), Schema.Thing(),

                hidden(field(RDF.TYPE, all(Course))),

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


    public static void main(final String... args) {
        exec(() -> Stream.of(resource(Courses.class, ".ttl").toString())

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

    public Courses() {
        delegate(handler(

                new Driver(Course(),

                        filter(clazz(Course))

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