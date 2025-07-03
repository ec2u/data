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

import eu.ec2u.work.ai.Analyzer;

import java.util.Optional;

import static com.metreeca.flow.Locator.service;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.work.ai.Analyzer.analyzer;

public final class WorkText implements Runnable {

    public static void main(final String... args) {
        exec(() -> new WorkText().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Analyzer analyzer=service(analyzer());


    @Override public void run() {

        // final List<String> urls=Stream.of("https://fisica.dip.unipv.it/")
        //
        //         .flatMap(new Crawl())
        //
        //         // .skip(30)
        //         // .limit(10)
        //
        //         .map(url -> async(() -> Optional.of(url)
        //
        //                 .flatMap(new GET<>(new HTML()))
        //                 .flatMap(new Focus())
        //                 .map(new Untag())
        //
        //                 .flatMap(analyzer.prompt("""
        //                         The input is a Markdown document extracted from an academic website page that could
        //                         POSSIBLY describe an academic organizational\nunit in one of the following categories:
        //
        //                         - Centre
        //                             - Research Centre
        //                                 - Interdepartmental Research Centre
        //                             - Service Centre
        //                             - Technology Transfer Centre
        //                         - Department
        //                         - Institute
        //                         - Laboratory
        //                         - Research Area
        //                         - Research Facility
        //                             - Museum
        //                             - Research Collection
        //                             - Research Instrument
        //                             - Research Library
        //                             - Research Station
        //                         - Research Group
        //                         - Research Line
        //                         - Research Network
        //
        //                         Your task is to check if the page ACTUALLY describes an organizational unit as defined above.
        //
        //                         Make ABSOLUTELY sure to ignore pages describing:
        //
        //                         - the organizational structure OF a unit
        //                         - educational offerings, services and other opportunities offered BY a unit
        //                         - projects, experiments and other activities managed BY a unit
        //                         - catalogs of units, opportunities, activities and other sub-topics
        //
        //                         Reply with "true" only if confident, "false" otherwise
        //                         """
        //                 ))
        //
        //                 .filter(value -> value.bit().orElse(false))
        //                 .map(value -> url)
        //
        //         ))
        //
        //         .collect(Futures.joining())
        //         .flatMap(Optional::stream)
        //
        //         .sorted()
        //         .toList();
        //
        // urls.stream().forEach(System.out::println);


        // Optional.of(String.join("\n", urls))

        Optional.of("""
                        https://fisica.dip.unipv.it/en/research/laboratories-and-instruments/epr-laboratory
                        https://fisica.dip.unipv.it/en/research/laboratories-and-instruments/laboratory-ultrafast-microscopy
                        https://fisica.dip.unipv.it/en/research/laboratories-and-instruments/nmr-laboratory
                        https://fisica.dip.unipv.it/en/research/laboratories-and-instruments/quantum-photonics-laboratory
                        https://fisica.dip.unipv.it/en/research/laboratories-and-instruments/radbiophys-laboratory
                        https://fisica.dip.unipv.it/en/research/laboratories-and-instruments/spectroscopy-materials-laboratory
                        https://fisica.dip.unipv.it/en/research/laboratories-and-instruments/squid-laboratory
                        https://fisica.dip.unipv.it/en/research/laboratories-and-instruments/stmsts-laboratory
                        https://fisica.dip.unipv.it/en/research/research-teams-and-topics/experimental-condensed-matter-physics/quantum-photonics
                        https://fisica.dip.unipv.it/en/research/research-teams-and-topics/experimental-condensed-matter-physics/raman-and-epr-material
                        https://fisica.dip.unipv.it/en/research/research-teams-and-topics/experimental-condensed-matter-physics/ultrafast-x-ray-and
                        https://fisica.dip.unipv.it/en/research/research-teams-and-topics/experimental-nuclear-and-subnuclear-physics/eicnet
                        https://fisica.dip.unipv.it/en/research/research-teams-and-topics/experimental-nuclear-and-subnuclear-physics/famu
                        https://fisica.dip.unipv.it/en/research/research-teams-and-topics/experimental-nuclear-and-subnuclear-physics/icarus
                        https://fisica.dip.unipv.it/en/research/research-teams-and-topics/experimental-nuclear-and-subnuclear-physics/mambo
                        https://fisica.dip.unipv.it/en/research/research-teams-and-topics/experimental-nuclear-and-subnuclear-physics/ntof
                        https://fisica.dip.unipv.it/en/research/research-teams-and-topics/experimental-nuclear-and-subnuclear-physics/rdfcc
                        https://fisica.dip.unipv.it/en/research/research-teams-and-topics/experimental-nuclear-and-subnuclear-physics/rdmucol
                        https://fisica.dip.unipv.it/en/research/research-teams-and-topics/physics-applied-medicine-biology-and-cultural-heritage-0
                        https://fisica.dip.unipv.it/en/research/research-teams-and-topics/physics-applied-medicine-biology-and-cultural-heritage-1
                        https://fisica.dip.unipv.it/en/research/research-teams-and-topics/physics-applied-medicine-biology-and-cultural-heritage/medical
                        https://fisica.dip.unipv.it/en/research/research-teams-and-topics/physics-applied-medicine-biology-and-cultural-heritage/radiation
                        https://fisica.dip.unipv.it/en/research/research-teams-and-topics/theoretical-and-mathematical-physics/geometry-spacetime
                        https://fisica.dip.unipv.it/en/research/research-teams-and-topics/theoretical-and-mathematical-physics/hadron-structure-and-qcd
                        https://fisica.dip.unipv.it/en/research/research-teams-and-topics/theoretical-and-mathematical-physics/quantum-information
                        https://fisica.dip.unipv.it/en/research/research-teams-and-topics/theoretical-physics-matter/quit-quantum-information-theory-group
                        https://fisica.dip.unipv.it/en/research/research-teams-and-topics/theoretical-physics-matter/theoretical-nanophotonics
                        https://fisica.dip.unipv.it/it/ricerca/laboratori-e-strumentazione
                        https://fisica.dip.unipv.it/it/ricerca/laboratori-e-strumentazione/laboratorio-di-microscopia-ultraveloce
                        https://fisica.dip.unipv.it/it/ricerca/laboratori-e-strumentazione/laboratorio-di-spettroscopia-materiali
                        https://fisica.dip.unipv.it/it/ricerca/laboratori-e-strumentazione/laboratorio-di-spettroscopia-ottica
                        https://fisica.dip.unipv.it/it/ricerca/laboratori-e-strumentazione/laboratorio-fotonica-quantistica
                        https://fisica.dip.unipv.it/it/ricerca/laboratori-e-strumentazione/laboratorio-mriipertermia
                        https://fisica.dip.unipv.it/it/ricerca/laboratori-e-strumentazione/laboratorio-radbiophys
                        https://fisica.dip.unipv.it/it/ricerca/laboratori-e-strumentazione/laboratorio-squid
                        https://fisica.dip.unipv.it/it/ricerca/linee-e-gruppi-di-ricerca/fisica-applicata-medicina-biologia-e-beni-culturali-0
                        https://fisica.dip.unipv.it/it/ricerca/linee-e-gruppi-di-ricerca/fisica-applicata-medicina-biologia-e-beni-culturali/biofisica
                        https://fisica.dip.unipv.it/it/ricerca/linee-e-gruppi-di-ricerca/fisica-applicata-medicina-biologia-e-beni-culturali/radiobiologia
                        https://fisica.dip.unipv.it/it/ricerca/linee-e-gruppi-di-ricerca/fisica-sperimentale-della-materia/fotonica-quantistica
                        https://fisica.dip.unipv.it/it/ricerca/linee-e-gruppi-di-ricerca/fisica-sperimentale-della-materia/microscopia-ultraveloce-con
                        https://fisica.dip.unipv.it/it/ricerca/linee-e-gruppi-di-ricerca/fisica-sperimentale-della-materia/spettroscopie-ottiche-e
                        https://fisica.dip.unipv.it/it/ricerca/linee-e-gruppi-di-ricerca/fisica-sperimentale-delle-interazioni-fondamentali/alice
                        https://fisica.dip.unipv.it/it/ricerca/linee-e-gruppi-di-ricerca/fisica-sperimentale-delle-interazioni-fondamentali/eicnet
                        https://fisica.dip.unipv.it/it/ricerca/linee-e-gruppi-di-ricerca/fisica-sperimentale-delle-interazioni-fondamentali/herd
                        https://fisica.dip.unipv.it/it/ricerca/linee-e-gruppi-di-ricerca/fisica-sperimentale-delle-interazioni-fondamentali/icarus
                        https://fisica.dip.unipv.it/it/ricerca/linee-e-gruppi-di-ricerca/fisica-sperimentale-delle-interazioni-fondamentali/mambo
                        https://fisica.dip.unipv.it/it/ricerca/linee-e-gruppi-di-ricerca/fisica-sperimentale-delle-interazioni-fondamentali/ntof
                        https://fisica.dip.unipv.it/it/ricerca/linee-e-gruppi-di-ricerca/fisica-sperimentale-delle-interazioni-fondamentali/rdfcc
                        https://fisica.dip.unipv.it/it/ricerca/linee-e-gruppi-di-ricerca/fisica-sperimentale-delle-interazioni-fondamentali/rdmucol
                        https://fisica.dip.unipv.it/it/ricerca/linee-e-gruppi-di-ricerca/fisica-teorica-della-materia/nanofotonica
                        https://fisica.dip.unipv.it/it/ricerca/linee-e-gruppi-di-ricerca/fisica-teorica-della-materia/quit-quantum-information-theory
                        https://fisica.dip.unipv.it/it/ricerca/linee-e-gruppi-di-ricerca/fisica-teorica-delle-interazioni-fondamentali-e-fisica-0
                        https://fisica.dip.unipv.it/it/ricerca/linee-e-gruppi-di-ricerca/fisica-teorica-delle-interazioni-fondamentali-e-fisica-1
                        https://fisica.dip.unipv.it/it/ricerca/linee-e-gruppi-di-ricerca/fisica-teorica-delle-interazioni-fondamentali-e-fisica-2
                        https://fisica.dip.unipv.it/it/ricerca/linee-e-gruppi-di-ricerca/fisica-teorica-delle-interazioni-fondamentali-e-fisica-3
                        """)

                .flatMap(analyzer.prompt("""
                        The input is a list of URLs from an academic website pointing to pages describing organizational units.
                        
                        Your task is to create a deduplicated list by analyzing the text structure of URLs to identify duplicates.
                        
                        For each URL, extract:
                        1. LANGUAGE: Look for language indicators in the URL path (e.g., "/en/", "/it/", "/english/", "/italiano/")
                           OR guess from title words (e.g., "laboratorio" → Italian, "laboratory" → English)
                        2. TITLE: Extract the organizational unit name from the URL path structure
                        
                        Deduplication rules:
                        1. If two URLs have the same TITLE but different LANGUAGES, keep only the non-English one
                        2. If a URL has no clear language equivalent (same TITLE in different language), keep it regardless of language
                        3. When in doubt about whether URLs represent the same unit, keep both
                        
                        Examples of URL analysis:
                        - "/en/research/quantum-laboratory" → LANGUAGE: en, TITLE: quantum-laboratory
                        - "/it/ricerca/laboratorio-quantistico" → LANGUAGE: it, TITLE: laboratorio-quantistico  
                        - These would be kept as separate units (different titles)
                        
                        Goal: Maximum organizational unit coverage with language preference for local versions.
                        
                        Examples:
                        - If you see both "/en/research/laboratory-abc" and "/it/ricerca/laboratorio-abc", keep only the Italian one
                        - If you see only "/en/research/laboratory-xyz" with no Italian equivalent, keep the English one
                        - If you see only "/it/ricerca/laboratorio-def" with no English equivalent, keep the Italian one
                        
                        Reply with a JSON object containing a list of unique URLs, making ABSOLUTELY sure to report URLs verbatim as included in the input.
                        """, """
                        {
                          "name": "urls",
                          "schema": {
                            "type": "object",
                            "properties": {
                              "urls": {
                                "type": "array",
                                "uniqueItems": true,
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
                .flatMap(v -> v.get("urls").values())

                .forEach(v -> System.out.println(v));
    }

}
