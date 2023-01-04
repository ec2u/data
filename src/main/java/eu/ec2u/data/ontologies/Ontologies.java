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

package eu.ec2u.data.ontologies;

import com.metreeca.core.Xtream;
import com.metreeca.rdf.actions.Retrieve;
import com.metreeca.rdf4j.actions.Upload;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.impl.LinkedHashModel;

import java.net.URL;
import java.util.stream.Stream;

import static com.metreeca.core.toolkits.Resources.resource;

import static eu.ec2u.data.Data.exec;


public final class Ontologies implements Runnable {

    public static final IRI ontologies=EC2U.item("/ontologies/");


    public static void main(final String... args) {
        exec(() -> new Ontologies().run());
    }

    public static Xtream<URL> ontologies() {
        return Xtream

                .of(

                        resource(EC2U.class, ".ttl"),
                        resource(EC2U.class, "Licenses.ttl"),
                        resource(EC2U.class, "Institutes.ttl"),

                        resource(EC2U.class, "SKOS.ttl"),
                        resource(EC2U.class, "Org.ttl"),
                        resource(EC2U.class, "DCAT2.ttl"),

                        resource(EC2U.class, "Schema.ttl"),
                        resource(EC2U.class, "Wikidata.ttl")

                );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        ontologies()

                .map(URL::toString)
                .map(new Retrieve())

                .pipe(models -> { // merge to avoid multiple truth maintenance rounds

                    final Model merged=new LinkedHashModel();

                    models.forEach(model -> {

                        merged.getNamespaces().addAll(model.getNamespaces());
                        merged.addAll(model);

                    });

                    return Stream.of(merged);

                })

                .forEach(new Upload()
                        .contexts(ontologies)
                        .langs(EC2U.Languages)
                        .clear(true)
                );
    }

}
