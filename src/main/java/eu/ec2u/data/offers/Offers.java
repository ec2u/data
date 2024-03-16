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

package eu.ec2u.data.offers;

import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.rdf4j.actions.Upload;
import com.metreeca.link.Shape;

import eu.ec2u.data._EC2U;
import eu.ec2u.data.concepts.Concepts;
import eu.ec2u.data.things.Schema;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.XSD;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.stream.Stream;

import static com.metreeca.http.Handler.handler;
import static com.metreeca.http.rdf.Values.iri;
import static com.metreeca.http.rdf.formats.RDF.rdf;
import static com.metreeca.link.Frame.integer;
import static com.metreeca.link.Frame.*;
import static com.metreeca.link.Shape.decimal;
import static com.metreeca.link.Shape.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data._EC2U.item;
import static eu.ec2u.data.resources.Resource.Resource;
import static eu.ec2u.data.resources.Resources.Reference;


public final class Offers extends Delegator {

    public static final IRI Context=item("/offers/");
    public static final IRI Scheme=iri(Concepts.Context, "/offer-topics");

    public static final IRI Programs=item("/programs/");
    public static final IRI Courses=item("/courses/");

    public static final IRI Offer=_EC2U.term("Offer");
    public static final IRI Program=_EC2U.term("Program");
    public static final IRI Course=_EC2U.term("Course");


    public static Shape Offer() {
        return shape(Resource(), Schema.Thing(),

                property(Schema.provider, optional(), Reference()),
                property(Schema.educationalLevel, optional(), Reference()),
                property(Schema.numberOfCredits, optional(), decimal(), minInclusive(literal(integer(0)))),

                property(Schema.educationalCredentialAwarded, local()),
                property(Schema.occupationalCredentialAwarded, local())

        );
    }

    public static Shape Program() {
        return shape(Offer(),

                property(RDF.TYPE, hasValue(Program)),

                property(Schema.programType, optional(), Reference()), // !!! concept?
                property(Schema.occupationalCategory, optional(), Reference()),
                property(Schema.timeToComplete, optional(), datatype(XSD.DURATION)), // !!! duration()

                property(Schema.programPrerequisites, local()),
                property(Schema.hasCourse, () -> shape(multiple(), Course()))

        );
    }

    public static Shape Course() {
        return shape(Offer(),

                property(RDF.TYPE, hasValue(Course)),

                property(Schema.courseCode, optional(), string()),
                property(Schema.inLanguage, multiple(), string(), pattern("[a-z]{2}")),
                property(Schema.learningResourceType, local()),
                property(Schema.timeRequired, optional(), datatype(XSD.DURATION)),

                property(Schema.teaches, local()),
                property(Schema.assesses, local()),
                property(Schema.coursePrerequisites, local()),
                property(Schema.competencyRequired, local()),

                property("inProgram", reverse(Schema.hasCourse), () -> shape(multiple(), Program()))

        );
    }



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static final class Programs extends Delegator {

        public Programs() {
            delegate(handler(

                    //                    new Driver(Program(),
                    //
                    //                            filter(clazz(Program))
                    //
                    //                    ),
                    //
                    //                    new Router()
                    //
                    //                            .path("/", new Worker()
                    //                                    .get(new Relator())
                    //                            )
                    //
                    //                            .path("/{id}", new Worker()
                    //                                    .get(new Relator())
                    //                            )

            ));
        }

    }

    public static final class Courses extends Delegator {

        public Courses() {
            delegate(handler(

                    //                    new Driver(Course(),
                    //
                    //                            filter(clazz(Course))
                    //
                    //                    ),
                    //
                    //                    new Router()
                    //
                    //                            .path("/", new Worker()
                    //                                    .get(new Relator())
                    //                            )
                    //
                    //                            .path("/{id}", new Worker()
                    //                                    .get(new Relator())
                    //                            )

            ));
        }

    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    static BigDecimal ects(final String ects) { return ects(new BigDecimal(ects)); }

    static BigDecimal ects(final Number ects) {
        return ects(ects instanceof BigDecimal ? ((BigDecimal)ects) : BigDecimal.valueOf(ects.doubleValue()));
    }

    static BigDecimal ects(final BigDecimal ects) {
        return ects.setScale(1, RoundingMode.UP);
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static final class Loader implements Runnable {

        public static void main(final String... args) {
            exec(() -> new Loader().run());
        }

        @Override public void run() {
            Stream

                    .of(rdf(Offers.class, ".ttl", _EC2U.Base))

                    .forEach(new Upload()
                            .contexts(Context)
                            .clear(true)
                    );
        }
    }

}