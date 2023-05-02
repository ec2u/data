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

package eu.ec2u.data.offers;

import com.metreeca.core.Xtream;
import com.metreeca.core.services.Vault;
import com.metreeca.core.toolkits.Resources;
import com.metreeca.json.JSONPath;
import com.metreeca.json.formats.JSON;
import com.metreeca.rdf.Frame;
import com.metreeca.rdf.Values;
import com.metreeca.rdf4j.actions.Upload;

import eu.ec2u.data.concepts.ISCED2011;
import eu.ec2u.data.organizations.Organizations;
import eu.ec2u.data.things.Schema;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.SKOS;

import java.io.IOException;
import java.io.Reader;
import java.io.UncheckedIOException;
import java.math.BigInteger;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

import static com.metreeca.core.Locator.service;
import static com.metreeca.core.services.Vault.vault;
import static com.metreeca.rdf.Frame.frame;
import static com.metreeca.rdf.Values.iri;
import static com.metreeca.rdf.Values.literal;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.University.Poitiers;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.offers.Offers.Course;
import static eu.ec2u.data.offers.Offers.Program;
import static eu.ec2u.data.organizations.Organizations.Organization;
import static eu.ec2u.data.resources.Resources.university;
import static eu.ec2u.work.validation.Validators.validate;
import static java.util.Map.entry;

public final class OffersPoitiers implements Runnable {

    private static final IRI Context=iri(Offers.Context, "/poitiers");

    private static final String APIUrl="offers-poitiers-url";
    private static final String APIId="offers-poitiers-id";
    private static final String APIToken="offers-poitiers-token";


    private static final Map<Integer, IRI> ISCEDLevels=Map.ofEntries(

            entry(1, ISCED2011.Level1),
            entry(2, ISCED2011.Level2),
            entry(3, ISCED2011.Level3),
            entry(4, ISCED2011.Level4),
            entry(5, ISCED2011.Level5),
            entry(6, ISCED2011.Level6),
            entry(7, ISCED2011.Level7),
            entry(8, ISCED2011.Level8),
            entry(9, ISCED2011.Level9)

    );


    public static void main(final String... args) {
        exec(() -> new OffersPoitiers().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Vault vault=service(vault());


    @Override public void run() {
        Xtream.of(Instant.EPOCH)

                .flatMap(instant -> Stream.concat(

                        Xtream.of(instant)

                                .flatMap(this::programs)
                                .optMap(this::program)

                                .pipe(programs -> validate(Program(), Set.of(Program), programs)),

                        Xtream.of(instant)

                                .flatMap(this::programs)
                                .flatMap(this::courses)

                                .pipe(courses -> validate(Course(), Set.of(Course), courses))

                ))

                .forEach(new Upload()
                        .contexts(Context)
                        .clear(true)
                );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<JSONPath> programs(final Instant synced) {

        //final String url=vault
        //        .get(APIUrl)
        //        .orElseThrow(() -> new IllegalStateException(format(
        //                "undefined API URL <%s>", APIUrl
        //        )));
        //
        //final String id=vault
        //        .get(APIId)
        //        .orElseThrow(() -> new IllegalStateException(format(
        //                "undefined API ID <%s>", APIId
        //        )));
        //
        //final String token=service(vault())
        //        .get(APIToken)
        //        .orElseThrow(() -> new IllegalStateException(format(
        //                "undefined API key <%s>", APIToken
        //        )));

        try ( final Reader reader=Resources.reader(this, ".json") ) {

            return new JSONPath(JSON.json(reader)).paths("*");

        } catch ( final IOException e ) {

            throw new UncheckedIOException(e);

        }

        //return Xtream.of(synced)
        //
        //        .flatMap(new Fill<>()
        //                .model(url+"/obtemCursosBloco")
        //        )
        //
        //        .optMap(new Query(request -> request
        //                .method(POST)
        //                .header("Content-Type", "application/x-www-form-urlencoded")
        //                .header("Accept", JSON.MIME)
        //                .input(() -> new ByteArrayInputStream(query(Map.ofEntries(
        //                        entry("applicationId", List.of(id)),
        //                        entry("accessToken", List.of(token)),
        //                        entry("anoLectivo", List.of("2022/2023")) // !!! dynamic
        //                )).getBytes(StandardCharsets.UTF_8)))
        //        ))
        //
        //        .optMap(new Fetch())
        //        .optMap(new Parse<>(new JSON()))
        //
        //        .optMap(json -> {
        //
        //            if ( "SUCCESS".equals(json.asJsonObject().getString("status")) ) {
        //
        //                return Optional.of(json);
        //
        //            } else {
        //
        //                service(logger()).warning(this, json.toString());
        //
        //                return Optional.empty();
        //
        //            }
        //        })
        //
        //        .map(JSONPath::new)
        //        .flatMap(json -> json.paths("listaResultados.*"));
    }

    private Optional<Frame> program(final JSONPath json) {
        return json.string("code").map(code -> frame(item(Offers.Programs, Poitiers, code))

                .values(RDF.TYPE, Program)
                .value(university, Poitiers.Id)

                .value(Schema.name, json.string("name") // !!! code to rdfs:label
                        .map(name -> literal(String.format("%s - %s", code, name), Poitiers.Language))
                )

                .values(Schema.identifier, literal(code))

                .value(Schema.educationalLevel, json.integer("levelISCED")
                        .map(BigInteger::intValue)
                        .map(ISCEDLevels::get)
                )

                .value(Schema.numberOfCredits, json.decimal("credits")
                        .map(Offers::ects)
                        .map(Values::literal)
                )

                .frame(Schema.provider, json.string("composante")
                        .map(name -> frame(item(Organizations.Context, Poitiers, name))
                                .value(RDF.TYPE, Organization)
                                .value(university, Poitiers.Id)
                                .value(DCTERMS.TITLE, literal(name, Poitiers.Language))
                        )
                )

                .frame(Schema.about, json.string("discipline")
                        .map(name -> frame(item(Offers.Scheme, Poitiers, name))
                                .value(RDF.TYPE, SKOS.CONCEPT)
                                .value(SKOS.TOP_CONCEPT_OF, Offers.Scheme)
                                .value(SKOS.PREF_LABEL, literal(name, Poitiers.Language))
                        )
                )

                .values(Schema.hasCourse, json.entries("options.*.elemPedago.*")
                        .map(entry -> item(Offers.Courses, Poitiers, entry.getKey()))
                )

        );
    }

    private Xtream<Frame> courses(final JSONPath program) {

        final Optional<IRI> provider=program.string("composante")
                .map(name -> item(Organizations.Context, Poitiers, name));

        final Optional<IRI> subject=program.string("discipline")
                .map(name -> item(Offers.Scheme, Poitiers, name));

        final Optional<IRI> level=program.integer("levelISCED")
                .map(BigInteger::intValue)
                .map(ISCEDLevels::get);


        return program.entries("options.*.elemPedago.*")

                .map(entry -> {

                    final String code=entry.getKey();
                    final JSONPath json=entry.getValue();

                    return frame(item(Offers.Courses, Poitiers, code))

                            .values(RDF.TYPE, Course)
                            .value(university, Poitiers.Id)

                            .value(Schema.name, json.string("name") // !!! code to rdfs:label
                                    .map(name -> literal(String.format("%s - %s", code, name), Poitiers.Language))
                            )

                            .values(Schema.courseCode, literal(code))

                            .value(Schema.educationalLevel, level)

                            .value(Schema.numberOfCredits, json.string("credits")
                                    .map(Offers::ects)
                                    .map(Values::literal)
                            )

                            .value(Schema.provider, provider)
                            .value(Schema.about, subject);

                });
    }

}
