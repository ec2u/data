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
import com.metreeca.http.handlers.Router;
import com.metreeca.http.handlers.Worker;
import com.metreeca.http.jsonld.handlers.Driver;
import com.metreeca.http.jsonld.handlers.Relator;
import com.metreeca.http.open.actions.WikidataMirror;
import com.metreeca.http.rdf.Values;
import com.metreeca.http.rdf4j.actions.Update;
import com.metreeca.http.rdf4j.actions.Upload;
import com.metreeca.http.work.Xtream;
import com.metreeca.link.Frame;
import com.metreeca.link.Shape;

import eu.ec2u.data._EC2U;
import eu.ec2u.data.resources.Resources;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.RDFS;
import org.eclipse.rdf4j.model.vocabulary.VOID;

import java.util.stream.Stream;

import static com.metreeca.http.Handler.handler;
import static com.metreeca.http.rdf.Values.iri;
import static com.metreeca.http.rdf.formats.RDF.rdf;
import static com.metreeca.http.toolkits.Resources.text;
import static com.metreeca.link.Frame.*;
import static com.metreeca.link.Query.filter;
import static com.metreeca.link.Query.query;
import static com.metreeca.link.Shape.integer;
import static com.metreeca.link.Shape.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data._EC2U.item;
import static eu.ec2u.data._EC2U.term;
import static eu.ec2u.data.datasets.Datasets.Dataset;
import static eu.ec2u.data.organizations.Organizations.OrgFormalOrganization;
import static eu.ec2u.data.resources.Resource.Resource;
import static eu.ec2u.data.resources.Resources.Reference;
import static java.util.Arrays.stream;
import static java.util.stream.Collectors.joining;


public final class Universities extends Delegator {

    private static final IRI Context=item("/universities/");

    public static final IRI University=term("University");

    private static final IRI schac=term("schac");
    private static final IRI image=term("image");
    private static final IRI inception=term("inception");
    private static final IRI students=term("students");
    private static final IRI country=term("country");
    private static final IRI location=term("location");


    public static Shape Universities() {
        return Dataset(University());
    }

    public static Shape University() {
        return shape(clazz(University), Resource(), OrgFormalOrganization(),

                property(schac, required(string())),
                property(image, required(id())),

                property(inception, optional(year())),
                property(students, optional(integer())),

                property(country, required(Reference())),
                property(location, required(Reference())),

                property("subsets", DCTERMS.EXTENT, multiple(

                        property("dataset", reverse(VOID.SUBSET), required(Dataset())),
                        property(VOID.ENTITIES, required(integer()))

                ))

        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public Universities() {
        delegate(new Router()

                .path("/", handler(new Driver(Universities()), new Worker()

                        .get(new Relator(frame(

                                field(ID, iri()),
                                field(RDFS.LABEL, literal("", WILDCARD)),

                                field(RDFS.MEMBER, query(

                                        frame(
                                                field(ID, iri()),
                                                field(RDFS.LABEL, literal("", WILDCARD))
                                        ),

                                        filter(RDF.TYPE, University)

                                ))

                        )))

                ))

                .path("/{code}", handler(new Driver(University()), new Worker()

                        .get(new Relator(frame(

                                field(ID, Frame.iri()),
                                field(RDFS.LABEL, literal("", WILDCARD)),

                                field(DCTERMS.EXTENT, frame(

                                        field(reverse(VOID.SUBSET), frame(
                                                field(ID, literal("")),
                                                field(RDFS.LABEL, literal(""))
                                        )),

                                        field(VOID.ENTITIES, literal(Frame.integer(0)))

                                ))

                        )))

                ))
        );

    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static final class Loader implements Runnable {

        public static void main(final String... args) {
            exec(() -> new Loader().run());
        }

        @Override public void run() {
            Stream

                    .of(rdf(Universities.class, ".ttl", _EC2U.Base))

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
            wikidata();
            inferences();
        }


        private static void wikidata() {
            Xtream

                    .of(

                            "?item wdt:P463 wd:Q105627243", // <member of> <EC2U>

                            "values ?item "+Stream

                                    .concat(
                                            stream(_Universities.values()).map(university -> university.City),
                                            stream(_Universities.values()).map(university -> university.Country)
                                    )

                                    .map(Values::format)
                                    .collect(joining(" ", "{ ", " }"))

                    )

                    .sink(new WikidataMirror()
                            .contexts(iri(Context, "/wikidata"))
                            .languages(Resources.Languages)
                    );
        }

        private static void inferences() {
            Stream

                    .of(text(Universities.class, ".ul"))

                    .forEach(new Update()
                            .base(_EC2U.Base)
                            .insert(iri(Context, "/~"))
                            .clear(true)
                    );
        }

    }

}