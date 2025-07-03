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

package eu.ec2u.work.units;

import com.metreeca.flow.http.actions.GET;
import com.metreeca.flow.xml.XPath;
import com.metreeca.flow.xml.actions.Crawl;
import com.metreeca.flow.xml.formats.HTML;
import com.metreeca.shim.Strings;

import eu.ec2u.work.ai.Analyzer;
import eu.ec2u.work.ai.OpenAnalyzer;

import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.async;
import static com.metreeca.flow.Locator.service;
import static com.metreeca.shim.Futures.joining;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.work.ai.Analyzer.analyzer;

public final class WorkTitle implements Runnable {

    public static void main(final String... args) {
        exec(() -> new WorkTitle().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Analyzer analyzer=service(analyzer());


    @Override public void run() {
        final String entries=Stream.of("https://fisica.dip.unipv.it/")

                .flatMap(new Crawl())

                .map(url -> async(() -> Optional.of(url)

                        .flatMap(new GET<>(new HTML()))

                        .map(XPath::new)
                        .flatMap(xpath -> xpath.string("//title"))

                        .map(title -> "%s,%s".formatted(url, Strings.quote(title)))

                ))

                .collect(joining())
                .flatMap(Optional::stream)

                .collect(Collectors.joining("\n"));


        Optional.of(entries)

                .flatMap(new OpenAnalyzer("o4-mini").prompt("""
                        The input is a CSV table mapping page URLs  from an academic website to their title.
                        
                        Your task is to:
                        
                        1. Identify possible common trailing text in the titles
                        2. identify URLs in the table that are very likely to point to the main description of an organisational unit in the following categories.
                        
                        - Centre
                          - Research Centre
                            - Interdepartmental Research Centre
                          - Service Centre
                          - Technology Transfer Centre
                        - Department
                        - Institute
                        - Laboratory
                        - Research Area
                        - Research Facility
                          - Museum
                          - Research Collection
                          - Research Instrument
                          - Research Library
                          - Research Station
                        - Research Group
                        - Research Line
                        - Research Network
                        
                        Make ABSOLUTELY sure to evaluate entries only on the basis of their specific title, ignoring:
                        
                        - the URL
                        - the common trailing text in the title
                        
                        Also ignore entries that are likely to be:
                        
                        - ancillary pages of a main unit description page
                        - English translations of pages in the local language
                        
                        Reply with a JSON object containing a list of URLs following this schema:
                        
                        Make ABSOLUTELY sure to report URLs verbatim as included in the input.
                        """, """
                        {
                          "name": "urls",
                          "schema": {
                            "type": "object",
                            "properties": {
                              "urls": {
                                "type": "array",
                                "items": {
                                  "type": "string",
                                  "format": "uri"
                                }
                              }
                            },
                            "required": [
                              "urls"
                            ]
                          }
                        }
                        """
                ))

                .stream()
                .flatMap(value -> value.get("urls").strings())

                .forEach(u -> System.out.println(u));
    }

}
