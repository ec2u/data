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

package eu.ec2u.data.datasets;

import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.handlers.Worker;
import com.metreeca.http.jsonld.handlers.Driver;
import com.metreeca.http.jsonld.handlers.Relator;
import com.metreeca.http.rdf4j.actions.Update;
import com.metreeca.http.rdf4j.actions.Upload;
import com.metreeca.link.Shape;

import eu.ec2u.data.resources.Resources;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.RDFS;
import org.eclipse.rdf4j.model.vocabulary.VOID;

import java.util.stream.Stream;

import static com.metreeca.http.Handler.handler;
import static com.metreeca.http.rdf.formats.RDF.rdf;
import static com.metreeca.http.toolkits.Resources.resource;
import static com.metreeca.http.toolkits.Resources.text;
import static com.metreeca.link.Constraint.any;
import static com.metreeca.link.Frame.*;
import static com.metreeca.link.Query.filter;
import static com.metreeca.link.Query.query;
import static com.metreeca.link.Shape.integer;
import static com.metreeca.link.Shape.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.*;
import static eu.ec2u.data.resources.Resources.Reference;
import static eu.ec2u.data.resources.Resources.Resource;

public final class Datasets extends Delegator implements Runnable {

    public static final IRI Context=item("/datasets/");

    private static final IRI Dataset=term("Dataset");


    public static Shape Datasets() {
        return Dataset(Dataset());
    }

    public static Shape Dataset() {
        return shape(Dataset, Resource(),

                property(DCTERMS.AVAILABLE, optional(date())), // !!! vs dct:issued?

                property(DCTERMS.RIGHTS, required(string())),
                property(DCTERMS.ACCESS_RIGHTS, optional(Resources.localized())),
                property(DCTERMS.LICENSE, optional(Reference())),

                property(VOID.URI_SPACE, optional(string())),
                property(VOID.ENTITIES, optional(integer())),
                property(RDFS.ISDEFINEDBY, optional(id()))

        );
    }

    public static Shape Dataset(final Shape shape) {

        if ( shape == null ) {
            throw new NullPointerException("null shape");
        }

        return virtual(Dataset(),

                property("members", RDFS.MEMBER, shape)

        );
    }


    public static void main(final String... args) {
        exec(() -> new Datasets().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public Datasets() {
        delegate(handler(new Driver(Datasets()), new Worker()

                .get(new Relator(frame(

                        field(ID, iri()),
                        field(RDFS.LABEL, literal("Datasets", "en")),

                        field(RDFS.MEMBER, query(

                                frame(
                                        field(ID, iri()),
                                        field(RDFS.LABEL, literal("", WILDCARD))
                                ),

                                filter(RDF.TYPE, Dataset),
                                filter(DCTERMS.AVAILABLE, any())

                        ))

                )))

        ));
    }


    @Override public void run() {

        Stream.of(rdf(resource(Datasets.class, ".ttl"), Base))

                .forEach(new Upload()
                        .contexts(Context)
                        .clear(true)
                );

        Stream.of(text(resource(Datasets.class, ".ul")))

                .forEach(new Update()
                        .base(Base)
                        .insert(Context)
                );

    }

}