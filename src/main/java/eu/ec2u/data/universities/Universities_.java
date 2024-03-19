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

package eu.ec2u.data.universities;

import com.metreeca.http.open.actions.WikidataMirror;
import com.metreeca.http.rdf.Values;
import com.metreeca.http.rdf4j.actions.Update;
import com.metreeca.http.work.Xtream;

import eu.ec2u.data.resources.Resources;

import java.util.stream.Stream;

import static com.metreeca.http.toolkits.Resources.resource;
import static com.metreeca.http.toolkits.Resources.text;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.Base;
import static java.util.Arrays.stream;
import static java.util.stream.Collectors.joining;

public final class Universities_ implements Runnable {

    public static void main(final String... args) {
        exec(() -> new Universities_().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        wikidata();
        inferences();
    }


    private void wikidata() {
        Xtream

                .of(

                        "?item wdt:P463 wd:Q105627243", // <member of> <EC2U>

                        "values ?item "+Stream

                                .concat(
                                        stream(_Universities.values()).map(university -> university.City),
                                        stream(_Universities.values()).map(university -> university.Country)
                                )

                                .map(Values::format)
                                .collect(joining(" ", "{ ", " }"))

                )

                .sink(new WikidataMirror()
                        .contexts(Values.iri(Universities.Context, "/wikidata"))
                        .languages(Resources.Languages)
                );
    }

    private void inferences() {
        Stream

                .of(text(resource(Universities.class, ".ul")))

                .forEach(new Update()
                        .base(Base)
                        .insert(Values.iri(Universities.Context, "/~"))
                        .clear(true)
                );
    }

}
