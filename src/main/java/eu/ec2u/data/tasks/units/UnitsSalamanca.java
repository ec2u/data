/*
 * Copyright © 2020-2022 EC2U Alliance
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

package eu.ec2u.data.tasks.units;

import com.metreeca.http.Xtream;
import com.metreeca.json.JSONPath;
import com.metreeca.json.codecs.JSON;
import com.metreeca.link.Frame;
import com.metreeca.link.Values;

import eu.ec2u.data.cities.Salamanca;
import eu.ec2u.data.terms.EC2U;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

import static com.metreeca.core.Identifiers.md5;
import static com.metreeca.core.Resources.resource;
import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.*;

import static eu.ec2u.data.ports.Units.Unit;
import static eu.ec2u.data.tasks.Tasks.*;

import static java.util.function.Predicate.not;

public final class UnitsSalamanca implements Runnable {


    public static void main(final String... args) {
        exec(() -> new UnitsSalamanca().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        Xtream.of(resource(this, "UnitsSalamanca-20220517.json"))

                .map(url -> {
                    try {

                        return JSON.json(new InputStreamReader(url.openStream(), StandardCharsets.UTF_8));

                    } catch ( final IOException e ) {

                        throw new UncheckedIOException(e);

                    }
                })

                .map(JSONPath::new)
                .flatMap(json -> json.paths("*"))
                .optMap(this::unit)

                .peek(unit -> System.out.println(format(unit)))

                .sink(events -> upload(EC2U.units,
                        validate(Unit(), EC2U.Unit, events)
                ));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    private Optional<Frame> unit(final JSONPath json) {
        return json.string("id").map(id -> {

            final Optional<Literal> label=json.string("name")
                    .filter(not(String::isEmpty))
                    .map(name -> literal(name, Salamanca.Language));

            return frame(iri(EC2U.units, md5(Salamanca.University+"@"+id)))

                    .value(RDF.TYPE, EC2U.Unit)
                    .value(EC2U.university, Salamanca.University)

                    .value(RDFS.LABEL, label)
                    .value(RDFS.COMMENT, json.string("topics")
                            .filter(not(String::isEmpty))
                            .map(topics -> literal(topics, Salamanca.Language))
                    )

                    .value(SKOS.PREF_LABEL, label)
                    .value(SKOS.ALT_LABEL, json.string("acronym")
                            .filter(not(String::isEmpty))
                            .map(Values::literal))

                    ;
        });
    }

}
