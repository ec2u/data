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

package eu.ec2u.work.ai;

import com.metreeca.flow.json.actions.Validate;
import com.metreeca.flow.services.Logger;
import com.metreeca.flow.text.services.Translator;
import com.metreeca.mesh.Value;
import com.metreeca.mesh.shapes.Shape;
import com.metreeca.mesh.tools.Store;

import java.net.URI;
import java.util.Locale;
import java.util.Map.Entry;
import java.util.Optional;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.flow.text.services.Translator.preprocess;
import static com.metreeca.mesh.Value.Text;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.Value.field;
import static com.metreeca.mesh.Value.id;
import static com.metreeca.mesh.Value.object;
import static com.metreeca.mesh.Value.shape;
import static com.metreeca.mesh.Value.text;
import static com.metreeca.mesh.Value.value;
import static com.metreeca.mesh.queries.Criterion.criterion;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.mesh.shapes.Property.property;
import static com.metreeca.mesh.shapes.Shape.shape;
import static com.metreeca.mesh.shapes.Type.type;
import static com.metreeca.mesh.tools.Store.Options.FORCE;
import static com.metreeca.mesh.util.Collections.list;
import static com.metreeca.mesh.util.Collections.set;
import static com.metreeca.mesh.util.Locales.ANY;
import static com.metreeca.mesh.util.Loggers.time;
import static com.metreeca.mesh.util.URIs.item;
import static com.metreeca.mesh.util.URIs.uuid;

import static java.lang.String.format;
import static java.util.stream.Collectors.toSet;

public final class StoreTranslator implements Translator {

    private static final String PARTITION="~translations";

    private static final int LENGTH_LIMIT=7*1024;


    private static final String TRANSLATION="Translation";

    private static final String TEXT="text";

    private static final Shape TRANSLATION_SHAPE=shape()
            .clazz(type(TRANSLATION))
            .property(property(TEXT).forward(true).shape(shape().datatype(Text()).exactly(2)));


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Translator translator;

    private URI partition=item(PARTITION);


    private final Store store=service(store());
    private final Logger logger=service(logger());


    public StoreTranslator partition(final URI partition) {

        if ( partition == null ) {
            throw new NullPointerException("null partition");
        }

        this.partition=partition;

        return this;
    }


    public StoreTranslator(final Translator translator) {

        if ( translator == null ) {
            throw new NullPointerException("null translator");
        }

        this.translator=translator;
    }


    @Override
    public Optional<String> translate(final String text, final Locale source, final Locale target) {

        if ( source == null ) {
            throw new NullPointerException("null source");
        }

        if ( target == null ) {
            throw new NullPointerException("null target");
        }

        if ( text == null ) {
            throw new NullPointerException("null text");
        }

        return preprocess(text, source, target)

                // ;( looking up very long texts breaks SPARQL queries over HTTP using the GET method

                .or(() -> text.length() > LENGTH_LIMIT ? Optional.of(Optional.empty()) : Optional.empty())

                .orElseGet(() -> time(() -> store

                        .retrieve(value(query()
                                .model(object(
                                        shape(TRANSLATION_SHAPE),
                                        field(TEXT, array(text(ANY, "")))
                                ))
                                .where(TEXT, criterion().any(text(source, text)))
                        ))

                        .stream()
                        .flatMap(Value::values)

                        .filter(match -> match.get(TEXT).texts()
                                .map(Entry::getKey)
                                .collect(toSet())
                                .containsAll(set(source, target))
                        )

                        .flatMap(match -> match.get(TEXT).texts()
                                .filter(e -> e.getKey().equals(target))
                                .map(Entry::getValue)
                        )

                        .findFirst() // return a random pick if multiple translations are available

                ).apply((elapsed, translation) -> translation.ifPresent(v -> logger.info(this, format(

                        "retrieved translation for <%,d> chars from <%s> to <%s> in <%,d> ms",
                        text.length(), source.toLanguageTag(), target.toLanguageTag(), elapsed

                )))).or(() -> translator.translate(text, source, target).map(translation -> {

                    store.partition(partition).update(array(list(Stream
                            .of(object(
                                    shape(TRANSLATION_SHAPE),
                                    id(item(uuid("- %s\n-%s\n".formatted(text, translation)))),
                                    field(TEXT, array(text(source, text), text(target, translation)))
                            ))
                            .map(new Validate<>())
                            .flatMap(Optional::stream)
                    )), FORCE);

                    return translation;

                })));

    }

}
