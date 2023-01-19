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

package eu.ec2u.data.datasets;

import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.handlers.Router;
import com.metreeca.jsonld.handlers.Driver;
import com.metreeca.jsonld.handlers.Relator;
import com.metreeca.link.Shape;
import com.metreeca.rdf4j.actions.Update;
import com.metreeca.rdf4j.actions.Upload;

import eu.ec2u.data.EC2U;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.util.stream.Stream;

import static com.metreeca.core.toolkits.Resources.text;
import static com.metreeca.http.Handler.handler;
import static com.metreeca.link.Shape.optional;
import static com.metreeca.link.Shape.required;
import static com.metreeca.link.Values.IRIType;
import static com.metreeca.link.Values.iri;
import static com.metreeca.link.shapes.Clazz.clazz;
import static com.metreeca.link.shapes.Datatype.datatype;
import static com.metreeca.link.shapes.Field.field;
import static com.metreeca.link.shapes.Guard.filter;
import static com.metreeca.link.shapes.Guard.relate;
import static com.metreeca.link.shapes.Pattern.pattern;
import static com.metreeca.rdf.codecs.RDF.rdf;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.resources.Resources.Resource;
import static eu.ec2u.data.resources.Resources.multilingual;

import static java.lang.String.format;

public final class Datasets extends Delegator {

    private static final IRI Context=EC2U.item("/datasets/");

    public static final IRI Dataset=EC2U.term("Dataset");


    public static Shape Dataset() { // !!! private
        return relate(Resource(),

                field(RDFS.LABEL, multilingual()),
                field(RDFS.COMMENT, multilingual()),

                field(DCTERMS.LICENSE, required(), datatype(IRIType),
                        field(RDFS.LABEL, multilingual())
                ),

                field(DCTERMS.RIGHTS, required(), datatype(XSD.STRING)),
                field(DCTERMS.ACCESS_RIGHTS, optional(), multilingual()),

                field(VOID.URI_SPACE, optional(), datatype(XSD.STRING)),
                field(VOID.ENTITIES, optional(), datatype(XSD.INTEGER))

        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public Datasets() {
        delegate(handler(

                new Driver(Dataset(),

                        filter(
                                clazz(Dataset),
                                pattern(format("^%s\\w+/$", EC2U.Base)) // prevent self-inclusion
                        )

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
                            rdf(Datasets.class, ".ttl", EC2U.Base),

                            rdf("http://rdfs.org/ns/void.ttl"),
                            rdf("http://www.w3.org/ns/dcat.ttl")

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
            Stream

                    .of(text(Datasets.class, ".ul"))

                    .forEach(new Update()
                            .base(EC2U.Base)
                            .insert(iri(Context, "/~"))
                            .clear(true)
                    );
        }

    }

}