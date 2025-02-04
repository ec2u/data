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

import com.metreeca.flow.json.JSONPath;
import com.metreeca.flow.json.formats.JSON;
import com.metreeca.flow.rdf4j.actions.Upload;
import com.metreeca.flow.services.Vault;
import com.metreeca.flow.work.Xtream;
import com.metreeca.link.Frame;

import eu.ec2u.data.concepts.ISCED2011;
import eu.ec2u.data.courses.Courses;
import eu.ec2u.data.organizations.Organizations;
import eu.ec2u.data.programs.Programs;
import eu.ec2u.data.things.Schema;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.SKOS;

import java.io.IOException;
import java.io.Reader;
import java.io.UncheckedIOException;
import java.math.BigInteger;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.services.Vault.vault;
import static com.metreeca.flow.toolkits.Resources.reader;
import static com.metreeca.flow.toolkits.Resources.resource;
import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.EC2U.update;
import static eu.ec2u.data.courses.Courses.Course;
import static eu.ec2u.data.courses.Courses.courseCode;
import static eu.ec2u.data.offerings.Offerings.*;
import static eu.ec2u.data.programs.Programs.hasCourse;
import static eu.ec2u.data.resources.Resources.university;
import static eu.ec2u.data.things.Schema.identifier;
import static eu.ec2u.data.universities.University.Poitiers;
import static java.lang.String.format;
import static java.util.Map.entry;

public final class OfferingsPoitiers implements Runnable {

    private static final IRI Context=iri(Offerings.Context, "/poitiers");

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
        exec(() -> new OfferingsPoitiers().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Vault vault=service(vault());


    @Override public void run() {
        update(connection -> Xtream.of(Instant.EPOCH)

                .flatMap(instant -> Stream.concat(

                        Xtream.of(instant)

                                .flatMap(this::programs)
                                .optMap(this::program),

                        Xtream.of(instant)

                                .flatMap(this::programs)
                                .flatMap(this::courses)

                ))

                .flatMap(Frame::stream)
                .batch(0)

                .forEach(new Upload()
                        .contexts(Context)
                        .clear(true)
                )

        );
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<JSONPath> programs(final Instant instant) {

        try ( final Reader reader=reader(resource(this, ".json")) ) {

            return new JSONPath(JSON.json(reader)).paths("*");

        } catch ( final IOException e ) {

            throw new UncheckedIOException(e);

        }

        // final String url=vault
        //         .get(APIUrl)
        //         .orElseThrow(() -> new IllegalStateException(format(
        //                 "undefined API URL <%s>", APIUrl
        //         )));
        //
        // final String id=vault
        //         .get(APIId)
        //         .orElseThrow(() -> new IllegalStateException(format(
        //                 "undefined API ID <%s>", APIId
        //         )));
        //
        // final String token=service(vault())
        //         .get(APIToken)
        //         .orElseThrow(() -> new IllegalStateException(format(
        //                 "undefined API key <%s>", APIToken
        //         )));
        //
        // return Xtream.of(updated)
        //
        //         .flatMap(new Fill<>()
        //                 .model(url+"/obtemCursosBloco")
        //         )
        //
        //         .optMap(new Query(request -> request
        //                 .method(POST)
        //                 .header("Content-Type", "application/x-www-form-urlencoded")
        //                 .header("Accept", JSON.MIME)
        //                 .input(() -> new ByteArrayInputStream(query(Map.ofEntries(
        //                         entry("applicationId", List.of(id)),
        //                         entry("accessToken", List.of(token)),
        //                         entry("anoLectivo", List.of("2022/2023")) // !!! dynamic
        //                 )).getBytes(StandardCharsets.UTF_8)))
        //         ))
        //
        //         .optMap(new Fetch())
        //         .optMap(new Parse<>(new JSON()))
        //
        //         .optMap(json -> {
        //
        //             if ( "SUCCESS".equals(json.asJsonObject().getString("status")) ) {
        //
        //                 return Optional.of(json);
        //
        //             } else {
        //
        //                 service(logger()).warning(this, json.toString());
        //
        //                 return Optional.empty();
        //
        //             }
        //         })
        //
        //         .map(JSONPath::new)
        //         .flatMap(json -> json.paths("listaResultados.*"));
    }

    private Optional<Frame> program(final JSONPath json) {
        return json.string("code").map(code -> frame(

                field(ID, item(Programs.Context, Poitiers, code)),

                field(RDF.TYPE, Programs.EducationalOccupationalProgram),
                field(university, Poitiers.id),

                field(Schema.name, json.string("name")
                        .map(name -> literal(format("%s - %s", code, name), Poitiers.language))
                ),

                field(identifier, literal(code)),

                field(educationalLevel, json.integer("levelISCED")
                        .map(BigInteger::intValue)
                        .map(ISCEDLevels::get)
                ),

                field(numberOfCredits, json.decimal("credits")
                        .map(Offerings_::ects)
                        .map(Frame::literal)
                ),

                field(provider, json.string("composante")
                        .map(name -> frame(

                                field(ID, item(Organizations.Context, Poitiers, name)),

                                field(RDF.TYPE, Schema.Organization),
                                field(university, Poitiers.id),
                                field(Schema.name, literal(name, Poitiers.language))

                        ))
                ),

                field(Schema.about, json.string("discipline")
                        .map(name -> frame(

                                field(ID, item(Types, Poitiers, name)),

                                field(RDF.TYPE, SKOS.CONCEPT),
                                field(SKOS.TOP_CONCEPT_OF, Types),
                                field(SKOS.PREF_LABEL, literal(name, Poitiers.language))

                        ))
                ),

                field(hasCourse, json.entries("options.*.elemPedago.*")
                        .map(entry -> item(Courses.Context, Poitiers, entry.getKey()))
                )

        ));
    }

    private Xtream<Frame> courses(final JSONPath program) {

        final Optional<IRI> provider=program.string("composante")
                .map(name -> item(Organizations.Context, Poitiers, name));

        final Optional<IRI> subject=program.string("discipline")
                .map(name -> item(Types, Poitiers, name));

        final Optional<IRI> level=program.integer("levelISCED")
                .map(BigInteger::intValue)
                .map(ISCEDLevels::get);


        return program.entries("options.*.elemPedago.*")

                .map(entry -> {

                    final String code=entry.getKey();
                    final JSONPath json=entry.getValue();

                    return frame(

                            field(ID, item(Courses.Context, Poitiers, code)),

                            field(RDF.TYPE, Course),
                            field(university, Poitiers.id),

                            field(Schema.name, json.string("name")
                                    .map(name -> literal(format("%s - %s", code, name), Poitiers.language))
                            ),

                            field(identifier, literal(code)),
                            field(courseCode, literal(code)),

                            field(educationalLevel, level),

                            field(numberOfCredits, json.string("credits")
                                    .map(Offerings_::ects)
                                    .map(Frame::literal)
                            ),

                            field(Offerings.provider, provider),
                            field(Schema.about, subject)

                    );

                });
    }

}
