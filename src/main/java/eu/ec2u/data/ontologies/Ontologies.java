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

    public static final IRI Context=EC2U.item("/ontologies/");


    public static void main(final String... args) {
        exec(() -> new Ontologies().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        Xtream

                .of(

                        resource(Ontologies.class, "EC2U.ttl"),
                        resource(Ontologies.class, "Licenses.ttl"),
                        resource(Ontologies.class, "Institutes.ttl"),

                        resource(Ontologies.class, "Org.ttl"),

                        resource(Ontologies.class, "Schema.ttl"),
                        resource(Ontologies.class, "Wikidata.ttl")

                )

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
                        .contexts(Context)
                        .langs(EC2U.Languages)
                        .clear(true)
                );
    }

}
