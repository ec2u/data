/*
 * Copyright © 2020-2025 EC2U Alliance
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

package eu.ec2u.work.xlations;

import com.metreeca.http.rdf4j.actions.TupleQuery;
import com.metreeca.http.rdf4j.actions.Upload;
import com.metreeca.http.services.Translator;
import com.metreeca.http.work.Xtream;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;

import java.util.Collection;
import java.util.List;

import static com.metreeca.http.Locator.service;
import static com.metreeca.http.rdf.Values.literal;
import static com.metreeca.http.rdf.Values.statement;
import static com.metreeca.http.services.Translator.translator;
import static com.metreeca.http.toolkits.Resources.resource;
import static com.metreeca.http.toolkits.Resources.text;

import static eu.ec2u.data.Data.exec;
import static java.util.Map.entry;

public final class Xlations implements Runnable {

    private static final String source="*";
    private static final String target="en";

    private static final int BatchSize=1_000;


    public static List<Statement> translate(final String target, final Collection<Statement> model) {

        final Translator translator=service(translator());

        return Xtream

                .from(

                        model.stream(),

                        Xtream.from(model)

                                // look for statements with tagged object

                                .filter(statement
                                        -> statement.getObject().isLiteral()
                                           && ((Literal)statement.getObject()).getLanguage().isPresent()
                                )

                                // retain statements that don't have a target language version

                                .filter(statement -> model.stream().noneMatch(s
                                        -> s.getSubject().equals(statement.getSubject())
                                           && s.getPredicate().equals(statement.getPredicate())
                                           && s.getObject().isLiteral()
                                           && ((Literal)s.getObject()).getLanguage().filter(target::equals).isPresent()
                                ))

                                // select a source language

                                .distinct(statement -> entry(statement.getSubject(), statement.getPredicate()))

                                // translate to target language

                                .flatMap(statement -> translator
                                        .translate(target, ((Literal)statement.getObject()).getLanguage().orElse(""), statement.getObject().stringValue())
                                        .map(translation -> statement(statement.getSubject(), statement.getPredicate(), literal(translation, target)))
                                        .stream()
                                )

                )

                .toList();
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static void main(final String... args) {
        exec(() -> new Xlations().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Translator translator=service(translator());


    @Override public void run() {
        Xtream.of(text(resource(this, ".ql")))

                .flatMap(new TupleQuery()
                        .binding("source", literal(source))
                        .binding("target", literal(target))
                )

                .parallel()

                .optMap(bindings -> {

                    final Resource resource=(Resource)bindings.getValue("resource");
                    final IRI property=(IRI)bindings.getValue("property");
                    final Literal text=(Literal)bindings.getValue("text");
                    final Resource context=(Resource)bindings.getValue("context");

                    return translator
                            .translate(target, text.getLanguage().orElse(""), text.stringValue())
                            .map(translation -> statement(resource, property, literal(translation, target), context));

                })

                .batch(BatchSize)

                .forEach(new Upload());
    }

}
