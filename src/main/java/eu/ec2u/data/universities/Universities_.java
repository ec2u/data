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

package eu.ec2u.data.universities;

import com.metreeca.flow.lod.actions.WikidataMirror;
import com.metreeca.flow.work.Xtream;
import com.metreeca.link.Frame;

import java.util.stream.Stream;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.resources.Resources.locales;
import static java.lang.String.format;
import static java.util.Arrays.stream;
import static java.util.stream.Collectors.joining;

public final class Universities_ implements Runnable {

    public static void main(final String... args) {
        exec(() -> new Universities_().run());
    }


    @Override public void run() {
        Xtream

                .of(

                        "?item wdt:P463 wd:Q105627243", // <member of> <EC2U>

                        "values ?item "+stream(University.values())

                                .flatMap(university -> Stream.of(
                                        university.city,
                                        university.country
                                ))

                                .map(iri -> format("<%s>", iri))
                                .collect(joining(" ", "{ ", " }"))

                )

                .sink(new WikidataMirror()
                        .contexts(Frame.iri(Universities.Context, "/wikidata"))
                        .languages(locales())
                );
    }
}
