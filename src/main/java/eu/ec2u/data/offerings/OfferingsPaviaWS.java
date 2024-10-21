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

package eu.ec2u.data.offerings;

import com.metreeca.http.actions.Fill;
import com.metreeca.http.actions.GET;
import com.metreeca.http.json.JSONPath;
import com.metreeca.http.json.formats.JSON;
import com.metreeca.http.services.Vault;
import com.metreeca.http.work.Xtream;
import com.metreeca.link.Frame;

import eu.ec2u.data.concepts.ISCED2011;
import org.eclipse.rdf4j.model.IRI;

import java.time.Instant;
import java.time.LocalDate;
import java.time.Month;
import java.time.Year;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Stream;

import static com.metreeca.http.Locator.service;
import static com.metreeca.http.services.Vault.vault;
import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Frame.iri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.universities.University.Pavia;
import static java.util.Map.entry;

/**
 * https://studentionline.unipv.it/e3rest/docs/?urls.primaryName=Offerta%20Api%20V1%20(https%3A%2F%2Fstudentionline.unipv.it%2Fe3rest%2Fapi%2Fofferta-service-v1)
 */
public final class OfferingsPaviaWS implements Runnable {

    private static final IRI Context=iri(Offerings.Context, "/pavia/ws"); // !!!

    private static final String APIUrl="offerings-pavia-url";
    private static final String APIUsr="offerings-pavia-usr";
    private static final String APIPwd="offerings-pavia-pwd";

    private static final int Limit=100;

    // !!! https://ec2u.atlassian.net/wiki/spaces/infrastructure/pages/345407519/Knowledge+Hub+-+Offerings+-+Degree+Programs#Pavia

    private static final Map<String, IRI> CodeToLevel=Map.ofEntries(

            entry("Bachelor’s Degree", ISCED2011.Level6),
            entry("Laurea", ISCED2011.Level6),

            entry("Laurea Magistrale", ISCED2011.Level7),
            entry("Master’s Degree", ISCED2011.Level7),
            entry("Laurea Magistrale Ciclo Unico 6 anni", ISCED2011.Level7),
            entry("Single-Cycle Master’s Degree", ISCED2011.Level7),
            entry("Laurea Magistrale Ciclo Unico 5 anni", ISCED2011.Level7),

            entry("Corso di Dottorato", ISCED2011.Level8),

            entry("Scuola di Specializzazione", ISCED2011.Level9)

    );


    public static void main(final String... args) {
        exec(() -> new OfferingsPaviaWS().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Vault vault=service(vault());


    @Override public void run() {

        final Xtream<Frame> frames=Xtream.of(Instant.now())

                .flatMap(this::programs)

                // !!! .limit(1)

                .flatMap(program -> Stream.concat(

                        program(program).stream(),

                        courses(program).optMap(this::course)


                ));

        frames.forEach(f -> { });

        // update(connection ->  frames
        //
        //         .flatMap(Frame::stream)
        //         .batch(0)
        //
        //         .forEach(new Upload()
        //                 .contexts(Context)
        //                 .clear(true)
        //         )
        //
        // );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<JSONPath> programs(final Instant now) {

        final String url="https://studentionline.unipv.it/e3rest/api/offerta-service-v1/offerte/"; // !!!

        final Year year=LocalDate.ofInstant(now, Pavia.zone).getMonth().compareTo(Month.JULY) >= 0
                ? Year.now()
                : Year.now().minusYears(1);


        return Xtream.of(0)

                .scan(start -> Xtream.of(start)

                        .flatMap(new Fill<>()
                                .model(url+"?aaOffId={year}&start={start}&limit={limit}")
                                .value("year", year)
                                .value("start", start)
                                .value("limit", Limit)
                        )

                        .optMap(new GET<>(new JSON()))

                        .map(JSONPath::new)
                        .map(json -> {

                            final List<JSONPath> list=json.paths("*").toList();

                            return entry(
                                    list.size() < Limit ? Stream.empty() : Stream.of(start+Limit),
                                    list.stream()
                            );

                        }));
    }

    private Xtream<JSONPath> courses(final JSONPath program) {
        return Xtream.of();
    }


    private Optional<Frame> program(final JSONPath program) {
        return Optional.of(frame());
    }

    private Optional<Frame> course(final JSONPath course) {
        return Optional.of(frame());
    }

}
