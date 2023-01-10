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

package eu.ec2u.data.concepts;

import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.handlers.Router;
import com.metreeca.jsonld.handlers.Driver;
import com.metreeca.jsonld.handlers.Relator;
import com.metreeca.link.Shape;
import com.metreeca.rdf4j.actions.Update;
import com.metreeca.rdf4j.actions.Upload;

import eu.ec2u.data.EC2U;
import eu.ec2u.data.resources.Resources;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.impl.LinkedHashModel;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.util.stream.Stream;

import static com.metreeca.core.toolkits.Resources.text;
import static com.metreeca.http.Handler.handler;
import static com.metreeca.link.Shape.required;
import static com.metreeca.link.Values.iri;
import static com.metreeca.link.shapes.Clazz.clazz;
import static com.metreeca.link.shapes.Datatype.datatype;
import static com.metreeca.link.shapes.Field.field;
import static com.metreeca.link.shapes.Guard.*;
import static com.metreeca.link.shapes.Link.link;
import static com.metreeca.rdf.codecs.RDF.rdf;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.resources.Resources.Resource;
import static eu.ec2u.data.resources.Resources.multilingual;

public final class Concepts extends Delegator {

    public static final IRI Context=item("/concepts/");


    private static Shape ConceptScheme() {
        return relate(link(RDFS.ISDEFINEDBY, Resource(),

                filter(clazz(SKOS.CONCEPT_SCHEME)),

                field(DCTERMS.EXTENT, required(), datatype(XSD.INTEGER)),

                detail(

                        field(SKOS.HAS_TOP_CONCEPT, Resources.Reference())

                )

        ));
    }

    private static Shape Concept() {
        return relate(link(RDFS.ISDEFINEDBY, Resource(),

                filter(clazz(SKOS.CONCEPT)),

                field(SKOS.PREF_LABEL, multilingual()),
                field(SKOS.ALT_LABEL, multilingual()),
                field(SKOS.DEFINITION, multilingual()),

                field(SKOS.IN_SCHEME, required(), Resources.Reference()),
                field(SKOS.TOP_CONCEPT_OF, optional(), Resources.Reference()),

                detail(

                        field(SKOS.BROADER_TRANSITIVE, Resources.Reference(),
                                field(SKOS.BROADER, Resources.Reference())
                        ),

                        field(SKOS.BROADER, Resources.Reference()),
                        field(SKOS.NARROWER, Resources.Reference()),
                        field(SKOS.RELATED, Resources.Reference())

                )

        ));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public Concepts() {
        delegate(handler(

                new Driver(ConceptScheme()),

                new Router()

                        .path("/", new Router()
                                .get(new Relator())
                        )

                        .path("/{scheme}", new Router()
                                .get(new Relator())
                        )

                        .path("/{scheme}/*", handler(

                                new Driver(Concept()),

                                new Router()
                                        .get(new Relator())

                        ))

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

                            rdf(Concepts.class, ".ttl", EC2U.Base),

                            skos(rdf("https://www.w3.org/2009/08/skos-reference/skos.rdf"))

                    )

                    .forEach(new Upload()
                            .contexts(Context)
                            .clear(true)
                    );
        }


        private Model skos(final Model skos) {

            final Model patched=new LinkedHashModel(skos);

            patched.remove(null, RDFS.SUBPROPERTYOF, RDFS.LABEL);

            return patched;
        }

    }

    public static final class Updater implements Runnable {

        public static void main(final String... args) {
            exec(() -> new Updater().run());
        }

        @Override public void run() {
            Stream

                    .of(text(Concepts.class, ".ul"))

                    .forEach(new Update()
                            .base(EC2U.Base)
                            .insert(iri(Context, "/~"))
                            .clear(true)
                    );
        }

    }

}