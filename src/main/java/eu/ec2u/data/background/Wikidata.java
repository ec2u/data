/*
 * Copyright © 2020-2023 EC2U Alliance
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

package eu.ec2u.data.background;

import com.metreeca.core.Xtream;
import com.metreeca.link.Values;
import com.metreeca.open.actions.WikidataMirror;

import eu.ec2u.data._ontologies.EC2U;
import eu.ec2u.data._ontologies.EC2U.Universities;
import org.eclipse.rdf4j.model.IRI;

import java.util.stream.Stream;

import static eu.ec2u.data.Data.exec;

import static java.util.Arrays.stream;
import static java.util.stream.Collectors.joining;

public final class Wikidata implements Runnable {

    private static final IRI Context=EC2U.item("/wikidata/");


    public static void main(final String... args) {
        exec(() -> new Wikidata().run());
    }


    @Override public void run() {
        Xtream

                .of(

                        "?item wdt:P463 wd:Q105627243", // <member of> <EC2U>

                        "values ?item "+Stream

                                .concat(
                                        stream(Universities.values()).map(university -> university.City),
                                        stream(Universities.values()).map(university -> university.Country)
                                )

                                .map(Values::format)
                                .collect(joining(" ", "{ ", " }"))

                )

                .sink(new WikidataMirror()
                        .contexts(Context)
                        .languages(EC2U.Languages)
                );
    }

}
