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
import com.metreeca.flow.services.Logger;
import com.metreeca.flow.xml.XPath;
import com.metreeca.flow.xml.formats.HTML;
import com.metreeca.mesh.tools.Store;
import com.metreeca.shim.Locales;
import com.metreeca.shim.URIs;

import eu.ec2u.work.PageKeeper;
import eu.ec2u.work.ai.Analyzer;

import java.net.URI;
import java.util.Locale;
import java.util.Optional;
import java.util.concurrent.Executor;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.*;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.shim.Collections.map;
import static com.metreeca.shim.Collections.set;
import static com.metreeca.shim.Futures.joining;
import static com.metreeca.shim.Lambdas.lenient;
import static com.metreeca.shim.Loggers.time;
import static com.metreeca.shim.Streams.optional;
import static com.metreeca.shim.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.units.Unit.review;
import static eu.ec2u.data.datasets.units.Units.UNITS;
import static eu.ec2u.data.datasets.universities.University.UMEA;
import static eu.ec2u.data.datasets.universities.University.uuid;
import static eu.ec2u.work.ai.Analyzer.analyzer;
import static java.lang.String.format;
import static java.util.Locale.ROOT;
import static java.util.Map.entry;
import static java.util.function.Function.identity;
import static java.util.stream.Collectors.collectingAndThen;
import static java.util.stream.Collectors.toSet;

public final class UnitsUmea implements Runnable {

    public static void main(final String... args) {
        exec(() -> new UnitsUmea().run());
    }


    //̸////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Store store=service(store());
    private final Logger logger=service(logger());
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
        time(() ->

                units().collect(collectingAndThen(toSet(), new PageKeeper<>(
                        uri("java:%s".formatted(getClass().getName())),
                        this::unit,
                        id -> new UnitFrame(true).id(id),
                        executor(10)
                )))

        ).apply((elapsed, resources) -> logger.info(this, format(
                "synced <%,d> resources in <%,d> ms", resources, elapsed
        )));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Stream<URI> units() {
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
                .flatMap(identity())

                .flatMap(optional(lenient(URIs::uri)));
    }

    private Optional<UnitFrame> unit(final URI url, final String body) {
        return Optional.of(body).flatMap(analyzer).flatMap(json -> {

            final Locale locale=json.get("language").string()
                    .flatMap(lenient(Locales::locale))
                    .orElseGet(UMEA::locale);

            return review(new UnitFrame()

                    .generated(true)

                    .id(UNITS.id().resolve(uuid(UMEA, url.toString())))

                    .comment(json.get("summary").string()
                            .map(summary -> map(entry(locale, summary)))
                            .orElse(null)
                    )

                    .university(UMEA)
                    .unitOf(set(UMEA))

                    .homepage(set(url))

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
