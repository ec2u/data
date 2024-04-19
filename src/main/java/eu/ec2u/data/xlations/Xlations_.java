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

import com.metreeca.http.Request;
import com.metreeca.http.Response;
import com.metreeca.http.json.formats.JSON;
import com.metreeca.http.rdf4j.actions.TupleQuery;
import com.metreeca.http.services.Fetcher;
import com.metreeca.http.work.Xtream;

import eu.ec2u.data.documents.Documents;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;

import static com.metreeca.http.Locator.service;
import static com.metreeca.http.Request.POST;
import static com.metreeca.http.services.Fetcher.fetcher;
import static com.metreeca.http.toolkits.Resources.resource;
import static com.metreeca.http.toolkits.Resources.text;
import static com.metreeca.link.Frame.iri;

import static eu.ec2u.data.Data.exec;
import static java.util.Map.entry;
import static javax.json.Json.createObjectBuilder;
import static org.eclipse.rdf4j.model.util.Values.literal;

public final class Xlations_ implements Runnable {

    public static void main(final String... args) {
        exec(() -> new Xlations_().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Fetcher fetcher=service(fetcher());


    @Override public void run() {
        Xtream.of(text(resource(this, ".ql")))

                .flatMap(new TupleQuery()
                        .dflt(iri(Documents.Context, "/pavia"))
                )

                .map(bindings -> {

                    final String text=bindings.getValue("text").stringValue();

                    final String source=bindings.getValue("source").stringValue();
                    final String target=bindings.getValue("target").stringValue();

                    return entry(literal(text, source), literal("", target));

                })

                .map(e -> new Request()
                        .method(POST)
                        .base("http://localhost:6800/")
                        .path("/translate")
                        .header("Content-Type", JSON.MIME)
                        .header("Accept", JSON.MIME)
                        .input(() -> new ByteArrayInputStream(createObjectBuilder()

                                .add("q", e.getKey().stringValue())
                                .add("source", e.getKey().getLanguage().orElse("auto"))
                                .add("target", e.getValue().getLanguage().orElse("auto"))

                                .build().toString().getBytes(StandardCharsets.UTF_8)
                        ))
                )

                .map(fetcher)

                .peek(response -> System.out.println(response.status()))

                // !!! report errors

                .filter(Response::success)

                .map(response -> response.body(new JSON()).asJsonObject().getString("translatedText"))

                .forEach(e -> System.out.println(e));

    }

}
