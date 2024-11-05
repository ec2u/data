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

package eu.ec2u.data.xlations;

import com.metreeca.http.rdf4j.actions.TupleQuery;
import com.metreeca.http.rdf4j.actions.Update;
import com.metreeca.http.rdf4j.actions.Upload;
import com.metreeca.http.services.Translator;
import com.metreeca.http.work.Xtream;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Value;

import static com.metreeca.http.Locator.service;
import static com.metreeca.http.rdf.Values.literal;
import static com.metreeca.http.rdf.Values.statement;
import static com.metreeca.http.services.Translator.translator;
import static com.metreeca.http.toolkits.Resources.resource;
import static com.metreeca.http.toolkits.Resources.text;

import static eu.ec2u.data.Data.exec;

/**
 * Event logger.
 *
 * <p>Provides access to system-specific logging facilities.</p>
 */
public final class Xlations_ implements Runnable {

    private static final String source="*";
    private static final String target="en";

    private static final int BatchSize=1_000;


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static void main(final String... args) {
        exec(() -> new Xlations_().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Translator translator=service(translator());


    @Override public void run() {

        // generate missing translations

        Xtream.of(text(resource(this, ".ql")))

                .flatMap(new TupleQuery()
                        .binding("source", literal(source))
                        .binding("target", literal(target))
                )

                .parallel()

                .map(bindings -> {

                    final Resource resource=(Resource)bindings.getValue("resource");
                    final IRI property=(IRI)bindings.getValue("property");
                    final Value local=bindings.getValue("text");

                    return statement(resource, property, local);

                })

                .optMap(statement -> {

                    final Resource subject=statement.getSubject();
                    final IRI predicate=statement.getPredicate();
                    final Literal local=(Literal)statement.getObject();

                    return translator
                            .translate(target, local.getLanguage().orElse(""), local.stringValue())
                            .map(translation -> statement(subject, predicate, literal(translation, target)));

                })

                .batch(BatchSize)

                .forEach(new Upload()
                        .contexts(Xlantions.Context)
                        .clear(false)
                );


        // purge stale translations

        Xtream.of(text(resource(this, ".ul")))

                .forEach(new Update()
                        .binding("context", Xlantions.Context)
                        .remove(Xlantions.Context)
                        .clear(false)
                );

    }

}
