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

package eu.ec2u.data.offers;

import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.rdf4j.actions.Upload;
import com.metreeca.link.Shape;

import eu.ec2u.data.EC2U;
import eu.ec2u.data.concepts.Concepts;
import org.eclipse.rdf4j.model.IRI;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.stream.Stream;

import static com.metreeca.http.Handler.handler;
import static com.metreeca.http.rdf.Values.iri;
import static com.metreeca.http.rdf.formats.RDF.rdf;

import static eu.ec2u.data.Data.exec;


public final class Offers extends Delegator {

    public static final IRI Context=EC2U.item("/offers/");
    public static final IRI Scheme=iri(Concepts.Context, "/offer-topics");

    public static final IRI Programs=EC2U.item("/programs/");
    public static final IRI Courses=EC2U.item("/courses/");

    public static final IRI Offer=EC2U.term("Offer");
    public static final IRI Program=EC2U.term("Program");
    public static final IRI Course=EC2U.term("Course");


    public static Shape Offer() {
        throw new UnsupportedOperationException(";( be implemented"); // !!!
        //            return relate(Resource(), Schema.Thing(),
        //
        //                    field(Schema.provider, optional(), Reference()),
        //                    field(Schema.educationalLevel, optional(), Reference()),
        //                    field(Schema.numberOfCredits, optional(), datatype(XSD.DECIMAL), minInclusive(literal(0))),
        //
        //                    field(Schema.educationalCredentialAwarded, multilingual()),
        //                    field(Schema.occupationalCredentialAwarded, multilingual())
        //
        //            );
    }

    public static Shape Program() {
        throw new UnsupportedOperationException(";( be implemented"); // !!!

        //            return relate(Offer(),
        //
        //                    hidden(field(RDF.TYPE, all(Program))),
        //
        //                    field(Schema.programType, optional(), Reference()),
        //                    field(Schema.occupationalCategory, optional(), Reference()),
        //                    field(Schema.timeToComplete, optional(), datatype(XSD.DURATION)),
        //
        //                    detail(
        //
        //                            field(Schema.programPrerequisites, multilingual()),
        //
        //                            field(Schema.hasCourse, multiple(), Reference())
        //
        //                    )
        //            );
    }

    public static Shape Course() {
        throw new UnsupportedOperationException(";( be implemented"); // !!!

        //            return relate(Offer(),
        //
        //                    hidden(field(RDF.TYPE, all(Course))),
        //
        //                    field(Schema.courseCode, optional(), datatype(XSD.STRING)),
        //                    field(Schema.inLanguage, multiple(), datatype(XSD.STRING), pattern("[a-z]{2}")),
        //                    field(Schema.learningResourceType, multilingual()),
        //                    field(Schema.timeRequired, optional(), datatype(XSD.DURATION)),
        //
        //                    detail(
        //
        //                            field(Schema.teaches, multilingual()),
        //                            field(Schema.assesses, multilingual()),
        //                            field(Schema.coursePrerequisites, multilingual()),
        //                            field(Schema.competencyRequired, multilingual()),
        //
        //                            field("inProgram", inverse(Schema.hasCourse), multiple(), Reference())
        //
        //                    )
        //
        //            );
    }


    static BigDecimal ects(final String ects) { return ects(new BigDecimal(ects)); }

    static BigDecimal ects(final Number ects) {
        return ects(ects instanceof BigDecimal ? ((BigDecimal) ects) : BigDecimal.valueOf(ects.doubleValue()));
    }

    static BigDecimal ects(final BigDecimal ects) {
        return ects.setScale(1, RoundingMode.UP);
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public Offers() {
        delegate(handler(

                //                new Driver(Offer(),
                //
                //                        filter(clazz(Offer))
                //
                //                ),
                //
                //                new Router()
                //
                //                        .path("/", new Worker()
                //                                .get(new Relator())
                //                        )
                //
                //                        .path("/{id}", new Worker()
                //                                .get(new Relator())
                //                        )

        ));
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

    public static final class Loader implements Runnable {

        public static void main(final String... args) {
            exec(() -> new Loader().run());
        }

        @Override public void run() {
            Stream

                    .of(rdf(Offers.class, ".ttl", EC2U.Base))

                    .forEach(new Upload()
                            .contexts(Context)
                            .clear(true)
                    );
        }
    }

}