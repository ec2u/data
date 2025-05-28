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

package eu.ec2u.data.datasets.units;

import com.metreeca.flow.http.actions.GET;
import com.metreeca.flow.xml.XPath;
import com.metreeca.flow.xml.actions.Untag;
import com.metreeca.flow.xml.formats.HTML;
import com.metreeca.mesh.Value;
import com.metreeca.mesh.tools.Store;
import com.metreeca.shim.Locales;

import eu.ec2u.work.PageFrame;
import eu.ec2u.work.ai.Analyzer;

import java.net.URI;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.Executor;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.*;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.Value.uri;
import static com.metreeca.mesh.Value.value;
import static com.metreeca.mesh.queries.Criterion.criterion;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.shim.Collections.map;
import static com.metreeca.shim.Collections.set;
import static com.metreeca.shim.Futures.joining;
import static com.metreeca.shim.Lambdas.lenient;
import static com.metreeca.shim.Streams.optional;
import static com.metreeca.shim.URIs.uri;
import static com.metreeca.shim.URIs.uuid;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.units.Unit.review;
import static eu.ec2u.data.datasets.units.Units.UNITS;
import static eu.ec2u.data.datasets.universities.University.UMEA;
import static eu.ec2u.data.datasets.universities.University.uuid;
import static eu.ec2u.work.ai.Analyzer.analyzer;
import static java.util.Locale.ROOT;
import static java.util.Map.entry;
import static java.util.function.Function.identity;
import static java.util.function.Predicate.not;

public final class UnitsUmea implements Runnable {

    public static void main(final String... args) {
        exec(() -> new UnitsUmea().run());
    }


    //̸////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Store store=service(store());
    private final Executor executor=executor(10);


    private final Analyzer analyzer=service(analyzer()).prompt("""
            Extract the following properties from the provided markdown document describing an academic unit:
            
            - official name
            - acronym, verbatim as defined in the document and only if absolutely confident about it
            - plain text summary of about 500 characters in the document language
            - full description as included in the document in markdown format; remove H1 (#) headings containing
              the name of the unit; make absolutely sure not to include any description of ongoing and upcoming events
            - document language as a 2-letter ISO tag
            
            Remove personal email addresses.
            
            Respond in the document original language.
            Respond with a JSON object.
            """, """
            {
              "name": "unit",
              "schema": {
                "type": "object",
                "properties": {
                  "name": {
                    "type": "string"
                  },
                  "acronym": {
                    "type": "string"
                  },
                  "summary": {
                    "type": "string"
                  },
                  "description": {
                    "type": "string"
                  },
                  "language": {
                    "type": "string",
                    "pattern": "^[a-zA-Z]{2}$"
                  }
                },
                "required": [
                  "name",
                  "summary",
                  "description",
                  "language"
                ],
                "additionalProperties": false
              }
            }"""
    );


    @Override
    public void run() {

        final URI pipeline=uri("java:%s".formatted(getClass().getName()));

        final Set<String> urls=set(units());

        final Map<String, PageFrame> pages=map(store

                .retrieve(value(query()
                        .model(new PageFrame(true)
                                .id(uri())
                                .hash("")
                                .resource(uri())
                        )
                        .where("pipeline",
                                criterion().any(uri(pipeline))
                        )
                ))

                .values()
                .map(PageFrame::new)
                .map(page -> entry(page.id().toString(), page))
        );


        final Value insert=array(urls.stream()

                .map(url -> async(executor, () -> Optional.of(url)

                        .flatMap(new GET<>(new HTML()))
                        .map(new Untag())
                        .stream()

                        .flatMap(body -> {

                            final Instant now=Instant.now();
                            final String hash=uuid(body);

                            final boolean clean=Optional.ofNullable(pages.get(url))
                                    .map(page -> page.hash().equals(hash))
                                    .orElse(false);

                            return clean ? Stream.empty() : unit(url, body).stream().flatMap(unit -> Stream.of(
                                    unit,
                                    new PageFrame()
                                            .id(uri(url))
                                            .fetched(now)
                                            // !!! created
                                            // !!! updated
                                            // !!! etag
                                            .hash(hash)
                                            .body(body)
                                            .pipeline(pipeline)
                                            .resource(unit.id())
                            ));

                        })

                ))

                .collect(joining())
                .flatMap(identity())

        );


        final Value remove=array(pages.values().stream()

                .filter(not(page -> urls.contains(page.id().toString())))

                .flatMap(page -> Stream.of(
                        new UnitFrame(true).id(page.resource()),
                        page
                ))

        );

        store.modify(
                insert,
                remove
        );
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Stream<String> units() {
        return Stream

                .of(

                        async(() -> Stream.of("https://www.umu.se/om-umea-universitet/sa-ar-vi-organiserade/hela-organisationen/")
                                .flatMap(optional(new GET<>(new HTML())))
                                .map(XPath::new)
                                .flatMap(path -> path.links("//section[contains(@class,'maincontent')]//a/@href"))
                        ),

                        async(() -> Stream.of("https://www.umu.se/om-umea-universitet/sa-ar-vi-organiserade/institutioner-och-enheter/")
                                .flatMap(optional(new GET<>(new HTML())))
                                .map(XPath::new)
                                .flatMap(path -> path.links("//section[contains(@class,'maincontent')]//a/@href"))
                        ),

                        async(() -> Stream.of("https://www.umu.se/om-umea-universitet/sa-ar-vi-organiserade/fakulteter-och-hogskolor/")
                                .flatMap(optional(new GET<>(new HTML())))
                                .map(XPath::new)
                                .flatMap(path -> path.links("//section[contains(@class,'maincontent')]//ul//a/@href"))
                        ),

                        async(() -> Stream.of("https://www.umu.se/om-umea-universitet/sa-ar-vi-organiserade/centrum/")
                                .flatMap(optional(new GET<>(new HTML())))
                                .map(XPath::new)
                                .flatMap(path -> path.links("//section[contains(@class,'maincontent')]//p/a/@href"))
                        ),

                        async(() -> Stream.of("https://www.umu.se/forskning/forskningsgrupper/")
                                .flatMap(optional(new GET<>(new HTML())))
                                .map(XPath::new)
                                .flatMap(path -> path.links(" //div[@class='navpuff cell']/a/@href"))
                                .flatMap(optional(new GET<>(new HTML())))
                                .map(XPath::new)
                                .flatMap(path -> path.links("//div[@class='item']/a/@href"))
                        )

                )

                .collect(joining())
                .flatMap(identity());
    }

    private Optional<UnitFrame> unit(final String url, final String body) {
        return Optional.of(body).flatMap(analyzer).flatMap(json -> {

            final Locale locale=json.get("language").string()
                    .flatMap(lenient(Locales::locale))
                    .orElseGet(UMEA::locale);

            return review(new UnitFrame()

                    .generated(true)

                    .id(UNITS.id().resolve(uuid(UMEA, url)))

                    .comment(json.get("summary").string()
                            .map(summary -> map(entry(locale, summary)))
                            .orElse(null)
                    )

                    .university(UMEA)
                    .unitOf(set(UMEA))

                    .homepage(set(uri(url)))

                    .altLabel(json.get("acronym").string()
                            .map(acronym -> map(entry(ROOT, acronym)))
                            .orElse(null)
                    )

                    .prefLabel(json.get("name").string()
                            .map(name -> map(entry(locale, name)))
                            .orElse(null)
                    )

                    .definition(json.get("description").string()
                            .map(description -> map(entry(locale, description)))
                            .orElse(null)
                    )

            );

        });
    }

}
