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

package eu.ec2u.data.offerings;

import com.metreeca.flow.actions.Fill;
import com.metreeca.flow.actions.GET;
import com.metreeca.flow.json.JSONPath;
import com.metreeca.flow.json.formats.JSON;
import com.metreeca.flow.rdf.Values;
import com.metreeca.flow.rdf4j.actions.Upload;
import com.metreeca.flow.services.Vault;
import com.metreeca.flow.work.Xtream;
import com.metreeca.link.Frame;

import eu.ec2u.data.programs.Programs;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.things.Schema;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.RDF;

import java.time.Instant;
import java.util.Optional;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.rdf.Values.iri;
import static com.metreeca.flow.services.Vault.vault;
import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.EC2U.update;
import static eu.ec2u.data.programs.Programs.EducationalOccupationalProgram;
import static eu.ec2u.data.universities.University.Linz;
import static eu.ec2u.work.xlations.Xlations.translate;

public final class OfferingsLinzPrograms implements Runnable {

    private static final IRI Context=iri(Offerings.Context, "/linz/programs");

    private static final String APIUrl="programs-linz-url";


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static void main(final String... args) {
        exec(() -> new OfferingsLinzPrograms().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Vault vault=service(vault());


    @Override public void run() {
        update(connection -> Xtream

                .of(Instant.EPOCH)

                .flatMap(this::programs)
                .optMap(this::program)

                .flatMap(Frame::stream)
                .batch(0)

                .map(model -> translate("en", model))

                .forEach(new Upload()
                        .contexts(Context)
                        .clear(true)
                )

        );
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<JSONPath> programs(final Instant updated) {

        final String url=vault.get(APIUrl);

        return Xtream.of(updated)

                .flatMap(new Fill<>()
                        .model(url)
                )

                .optMap(new GET<>(new JSON()))

                .map(JSONPath::new)
                .flatMap(json -> json.paths("*"));
    }

    private Optional<Frame> program(final JSONPath json) {
        return json.string("identifier.*")

                .map(code -> frame(

                        field(ID, item(Programs.Context, Linz, code)),

                        field(RDF.TYPE, EducationalOccupationalProgram),
                        field(Resources.university, Linz.id),

                        field(Schema.url, json.strings("url.*").map(Values::iri)),
                        field(Schema.identifier, json.strings("identifier.*").map(Values::literal)),

                        field(Schema.name, json.entries("name").flatMap(e ->
                                e.getValue().string("").map(v -> literal(v, e.getKey())).stream()
                        )),

                        field(Schema.description, json.entries("description").flatMap(e ->
                                e.getValue().string("").map(v -> literal(v, e.getKey())).stream()
                        )),

                        field(Offerings.numberOfCredits, json.decimal("numberOfCredits").map(Values::literal)),

                        field(Offerings.educationalLevel, json.string("educationalLevel").map(Values::iri))

                ));
    }

}
