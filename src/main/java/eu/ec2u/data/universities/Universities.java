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

package eu.ec2u.data.universities;

import com.metreeca.core.Xtream;
import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.handlers.Router;
import com.metreeca.jsonld.handlers.Driver;
import com.metreeca.jsonld.handlers.Relator;
import com.metreeca.link.Shape;
import com.metreeca.link.Values;
import com.metreeca.open.actions.WikidataMirror;
import com.metreeca.rdf4j.actions.Upload;

import eu.ec2u.data._ontologies.EC2U;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.util.stream.Stream;

import static com.metreeca.http.Handler.handler;
import static com.metreeca.link.Shape.optional;
import static com.metreeca.link.Shape.required;
import static com.metreeca.link.Values.IRIType;
import static com.metreeca.link.Values.inverse;
import static com.metreeca.link.shapes.Clazz.clazz;
import static com.metreeca.link.shapes.Datatype.datatype;
import static com.metreeca.link.shapes.Field.field;
import static com.metreeca.link.shapes.Guard.*;
import static com.metreeca.link.shapes.Link.link;
import static com.metreeca.rdf.codecs.RDF.rdf;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data._ontologies.EC2U.*;
import static eu.ec2u.data.resources.Resources.Reference;
import static eu.ec2u.data.resources.Resources.Resource;

import static java.util.Arrays.stream;
import static java.util.stream.Collectors.joining;


public final class Universities extends Delegator {

    private static final IRI Context=item("/universities/");

    public static final IRI University=term("University");

    public static final IRI schac=term("schac");
    public static final IRI country=term("country");
    public static final IRI location=term("location");
    public static final IRI image=term("image");
    public static final IRI inception=term("inception");
    public static final IRI students=term("students");


    private static Shape University() {
        return relate(Resource(),

                filter(clazz(University)),

                field(RDFS.LABEL, multilingual()),
                field(RDFS.COMMENT, multilingual()),

                field(schac, required(), datatype(XSD.STRING)),
                field(image, optional(), datatype(IRIType)),

                link(OWL.SAMEAS,

                        field(country, optional(),
                                field(RDFS.LABEL, multilingual())
                        ),

                        field(inception, optional(), datatype(XSD.DATETIME)),
                        field(students, optional(), datatype(XSD.DECIMAL)),

                        detail(

                                field(location, optional(),
                                        field(RDFS.LABEL, multilingual())
                                ),

                                field(WGS84.LAT, optional(), datatype(XSD.DECIMAL)),
                                field(WGS84.LONG, optional(), datatype(XSD.DECIMAL))
                        )

                ),

                detail(

                        field(DCTERMS.EXTENT, multiple(),

                                field("dataset", inverse(VOID.SUBSET), required(), Reference()),
                                field(VOID.ENTITIES, required(), datatype(XSD.INTEGER))

                        )

                )

        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public Universities() {
        delegate(handler(new Driver(University()), new Router()

                .path("/", new Router()
                        .get(new Relator())
                )

                .path("/{id}", new Router()
                        .get(new Relator())
                )));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static final class Loader implements Runnable {

        public static void main(final String... args) {
            exec(() -> new Loader().run());
        }

        @Override public void run() {
            Stream

                    .of(
                            rdf(Universities.class, ".ttl", Base)
                    )

                    .forEach(new Upload()
                            .contexts(Context)
                            .clear(true)
                    );
        }
    }

    public static final class Updater implements Runnable {

        public static void main(final String... args) {
            exec(() -> new Updater().run());
        }

        @Override public void run() {
            Xtream

                    .of(

                            "?item wdt:P463 wd:Q105627243", // <member of> <EC2U>

                            "values ?item "+Stream

                                    .concat(
                                            stream(EC2U.Universities.values()).map(university -> university.City),
                                            stream(EC2U.Universities.values()).map(university -> university.Country)
                                    )

                                    .map(Values::format)
                                    .collect(joining(" ", "{ ", " }"))

                    )

                    .sink(new WikidataMirror()
                            .contexts(Context)
                            .languages(Languages)
                    );
        }

    }

}