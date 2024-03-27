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

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
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
import static eu.ec2u.data.Data.txn;
import static eu.ec2u.data.EC2U.*;
import static eu.ec2u.data.resources.Resources.*;

public final class Datasets extends Delegator {

    public static final IRI Context=item("/datasets/");

    private static final IRI Dataset=term("Dataset");


    public static Shape Datasets() {
        return Dataset(Dataset());
    }

    public static Shape Dataset() {
        return shape(Dataset, Resource(),

                property(DCTERMS.TITLE, required(localized())),
                property(DCTERMS.ALTERNATIVE, optional(localized())),
                property(DCTERMS.DESCRIPTION, optional(localized())),

                property(DCTERMS.CREATED, optional(date())),
                property(DCTERMS.ISSUED, optional(date())),
                property(DCTERMS.MODIFIED, optional(date())),

                property(DCTERMS.RIGHTS, required(string())),
                property(DCTERMS.ACCESS_RIGHTS, optional(localized())),
                property(DCTERMS.LICENSE, optional(Entry())),

                property(VOID.ROOT_RESOURCE, multiple(id())),
                property(VOID.ENTITIES, optional(integer())),
                property(VOID.SUBSET, () -> multiple(Dataset())),

                property(DCTERMS.PUBLISHER, optional(Entry())),

                property(RDFS.ISDEFINEDBY, required(id()))

        );
    }

    public static Shape Dataset(final Shape shape) {

        if ( shape == null ) {
            throw new NullPointerException("null shape");
        }

        return shape(Dataset(),

                property("members", RDFS.MEMBER, shape)

        );
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

                                filter(DCTERMS.ISSUED, any())

                        ))

                )))

        ));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static void main(final String... args) {
        exec(Datasets::create);
    }


    public static void create() {
        txn(() -> {
            create(Datasets.class, Context);
            update();
        });
    }

    public static void update() {
        update(Datasets.class, Context);
    }


    public static void create(final Class<?> dataset, final IRI context) {
        Stream

                .of(rdf(resource(dataset, ".ttl"), Base))

                .forEach(new Upload()
                        .contexts(context)
                        .clear(true)
                );
    }

    public static void update(final Class<?> dataset, final IRI context) {
        Stream

                .of(text(resource(dataset, ".ul")))

                .forEach(new Update()
                        .base(Base)
                        .insert(iri(context, "/~"))
                        .clear(true)
                );
    }

}