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
import com.metreeca.http.handlers.Worker;
import com.metreeca.http.jsonld.handlers.Relator;
import com.metreeca.http.rdf4j.actions.Update;
import com.metreeca.http.rdf4j.actions.Upload;
import com.metreeca.link.jsonld.Virtual;

import eu.ec2u.data.EC2U;
import org.eclipse.rdf4j.model.IRI;

import java.util.stream.Stream;

import static com.metreeca.http.rdf.Values.iri;
import static com.metreeca.http.rdf.formats.RDF.rdf;
import static com.metreeca.http.toolkits.Resources.text;
import static com.metreeca.link.Frame.with;
import static com.metreeca.link.Local.local;
import static com.metreeca.link.Query.*;

import static eu.ec2u.data.Data.exec;

@Virtual
public final class Datasets extends Dataset<Dataset> { // !!! ;( extends Dataset<Dataset<?>> breaks query parsing

    private static final IRI Context=EC2U.item("/");


    public static final class Handler extends Delegator {

        public Handler() {
            delegate(new Worker()

                    .get(new Relator(with(new Datasets(), datasets -> {

                        datasets.setId("");
                        datasets.setLabel(local("en", "Datasets"));

                        datasets.setMembers(query(

                                filter(expression("available"), any()),

                                model(with(new Dataset<>(), dataset -> {

                                    dataset.setId("");
                                    dataset.setLabel(local("en", ""));

                                }))

                        ));

                    })))

            );
        }

    }


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