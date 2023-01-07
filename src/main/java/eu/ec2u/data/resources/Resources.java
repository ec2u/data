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

package eu.ec2u.data.resources;

import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.handlers.Router;
import com.metreeca.jsonld.handlers.Driver;
import com.metreeca.jsonld.handlers.Relator;
import com.metreeca.link.Shape;
import com.metreeca.rdf4j.actions.Upload;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.time.ZoneId;
import java.util.Set;
import java.util.stream.Stream;

import static com.metreeca.core.toolkits.Identifiers.md5;
import static com.metreeca.http.Handler.handler;
import static com.metreeca.link.Shape.multiple;
import static com.metreeca.link.Shape.optional;
import static com.metreeca.link.Values.IRIType;
import static com.metreeca.link.Values.iri;
import static com.metreeca.link.shapes.All.all;
import static com.metreeca.link.shapes.And.and;
import static com.metreeca.link.shapes.Clazz.clazz;
import static com.metreeca.link.shapes.Datatype.datatype;
import static com.metreeca.link.shapes.Field.field;
import static com.metreeca.link.shapes.Guard.filter;
import static com.metreeca.link.shapes.Guard.hidden;
import static com.metreeca.link.shapes.Localized.localized;
import static com.metreeca.open.actions.Wikidata.wd;
import static com.metreeca.rdf.codecs.RDF.rdf;

import static eu.ec2u.data.Data.exec;

import static java.util.Arrays.stream;
import static java.util.stream.Collectors.toUnmodifiableSet;


public final class Resources extends Delegator {

    public static final String Base="https://data.ec2u.eu/";

    private static final IRI Context=item("/");


    public static final IRI Resource=term("Resource");
    public static final IRI Publisher=term("Publisher");

    public static final IRI university=term("university");


    public static Shape Resource() {
        return and(Reference(),

                hidden(field(RDF.TYPE, all(Resource))),

                field(university, optional(),
                        field(RDFS.LABEL, multilingual())
                ),

                field(DCTERMS.TITLE, multilingual()),
                field(DCTERMS.DESCRIPTION, multilingual()),

                field(DCTERMS.PUBLISHER, optional(), Publisher()),
                field(DCTERMS.SOURCE, optional(), datatype(IRIType)),

                field(DCTERMS.ISSUED, optional(), datatype(XSD.DATETIME)),
                field(DCTERMS.CREATED, optional(), datatype(XSD.DATETIME)),
                field(DCTERMS.MODIFIED, optional(), datatype(XSD.DATETIME)),

                field(DCTERMS.TYPE, multiple(), Reference()),
                field(DCTERMS.SUBJECT, multiple(), Reference())

        );
    }

    public static Shape Reference() {
        return and(

                datatype(IRIType),

                field(RDFS.LABEL, multilingual()),
                field(RDFS.COMMENT, multilingual())

        );
    }

    public static Shape Publisher() {
        return and(Reference(),

                field(DCTERMS.COVERAGE, optional(), datatype(IRIType))

        );
    }


    public static Shape multilingual() {
        return localized(Languages);
    }


    public static IRI item(final String name) {
        return iri(Base, name);
    }

    public static IRI item(final IRI dataset, final IRI university, final String name) {
        return iri(dataset, md5(university+"@"+name));
    }

    public static IRI term(final String name) {
        return iri(item("/terms/"), name);
    }



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static final Set<String> Languages=Stream

            .concat(
                    Stream.of("en"),
                    stream(Universities.values()).map(university -> university.Language)
            )

            .collect(toUnmodifiableSet());

    public enum Universities {

        Coimbra(
                item("/universities/coimbra"),
                wd("Q45412"),
                wd("Q45"),
                "pt",
                ZoneId.of("Europe/Lisbon")
        ),

        Iasi(
                item("/universities/iasi"),
                wd("Q46852"),
                wd("Q218"),
                "ro",
                ZoneId.of("Europe/Bucharest")
        ),

        Jena(
                item("/universities/jena"),
                wd("Q3150"),
                wd("Q183"),
                "de",
                ZoneId.of("Europe/Berlin")
        ),

        Pavia(
                item("/universities/pavia"),
                wd("Q6259"),
                wd("Q38"),
                "it",
                ZoneId.of("Europe/Rome")
        ),

        Poitiers(
                item("/universities/poitiers"),
                wd("Q6616"),
                wd("Q142"),
                "fr",
                ZoneId.of("Europe/Paris")
        ),

        Salamanca(
                item("/universities/salamanca"),
                wd("Q15695"),
                wd("Q29"),
                "es",
                ZoneId.of("Europe/Madrid")
        ),

        Turku(
                item("/universities/turku"),
                wd("Q38511"),
                wd("Q38511"),
                "fi",
                ZoneId.of("Europe/Helsinki")
        );


        public final IRI Id;
        public final IRI City;
        public final IRI Country;
        public final String Language;
        public final ZoneId TimeZone;


        Universities(final IRI id, final IRI city, final IRI country, final String language, final ZoneId zone) {
            this.Id=id;
            this.City=city;
            this.Country=country;
            this.Language=language;
            this.TimeZone=zone;
        }

    }



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public Resources() {
        delegate(handler(

                new Driver(Resource(),

                        filter(clazz(Resource)),

                        field(RDF.TYPE, Reference()),
                        field(DCTERMS.SUBJECT, Reference())

                ),

                new Router()
                        .get(new Relator())

        ));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static final class Loader implements Runnable {

        public static void main(final String... args) {
            exec(() -> new Loader().run());
        }

        @Override public void run() {
            Stream

                    .of(
                            rdf(Resources.class, ".ttl")
                    )

                    .forEach(new Upload()
                            .contexts(Context)
                            .clear(true)
                    );
        }
    }

}