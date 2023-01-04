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

package eu.ec2u.data._tasks.courses;

import com.metreeca.core.Xtream;
import com.metreeca.core.actions.Fill;
import com.metreeca.core.services.Vault;
import com.metreeca.http.actions.*;
import com.metreeca.json.JSONPath;
import com.metreeca.json.codecs.JSON;
import com.metreeca.link.Frame;
import com.metreeca.link.Values;
import com.metreeca.rdf4j.actions.Update;

import eu.ec2u.data._cities.Coimbra;
import eu.ec2u.data._tasks.concepts.ISCED2011;
import eu.ec2u.data._terms.EC2U;
import eu.ec2u.data._terms.Schema;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDF;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
import java.util.stream.Stream;

import static com.metreeca.core.Locator.service;
import static com.metreeca.core.services.Logger.logger;
import static com.metreeca.core.services.Vault.vault;
import static com.metreeca.core.toolkits.Identifiers.md5;
import static com.metreeca.core.toolkits.Lambdas.task;
import static com.metreeca.http.Request.POST;
import static com.metreeca.http.Request.query;
import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.iri;
import static com.metreeca.link.Values.literal;
import static com.metreeca.rdf4j.services.Graph.graph;

import static eu.ec2u.data._ports.Courses.Course;
import static eu.ec2u.data._tasks.Tasks.*;

import static java.lang.String.format;
import static java.util.Map.entry;
import static java.util.stream.Collectors.toList;

public final class CoursesCoimbra implements Runnable {

    private static final String APIUrl="courses-coimbra-url";
    private static final String APIId="courses-coimbra-id";
    private static final String APIToken="courses-coimbra-token";


    private static final Map<String, IRI> TypesToISCEDLevel=Map.ofEntries(

            entry("PRIMEIRO/*", ISCED2011.Level6),

            entry("SEGUNDO/INTEGRADO", ISCED2011.Level7),
            entry("SEGUNDO/CONTINUIDADE", ISCED2011.Level7),
            entry("SEGUNDO/ESPECIALIZACAO_AVANCADA", ISCED2011.Level7),
            entry("SEGUNDO/FORMACAO_LONGO_VIDA", ISCED2011.Level7),

            entry("TERCEIRO/*", ISCED2011.Level8),

            entry("NAO_CONFERENTE_GRAU/POS_DOUTORAMENTO", ISCED2011.Level9),
            entry("NAO_CONFERENTE_GRAU/ESPECIALIZACAO", ISCED2011.Level9),
            entry("NAO_CONFERENTE_GRAU/FORMACAO", ISCED2011.Level9),
            entry("NAO_CONFERENTE_GRAU/FORMACAO_CONTINUA", ISCED2011.Level9),
            entry("NAO_CONFERENTE_GRAU/ESPECIALIZACAO_AVANCADA", ISCED2011.Level9)

    );


    public static void main(final String... args) {
        exec(() -> new CoursesCoimbra().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Vault vault=service(vault());


    @Override public void run() {
        Xtream.of(Instant.EPOCH)

                .flatMap(this::courses)
                .optMap(this::course)

                .sink(courses -> upload(EC2U.courses,
                        validate(Course(), Set.of(EC2U.Course), courses),
                        () -> service(graph()).update(task(connection -> Stream

                                .of(""
                                        +"prefix ec2u: </terms/>\n"
                                        +"\n"
                                        +"delete where {\n"
                                        +"\n"
                                        +"\t?u a ec2u:Course ;\n"
                                        +"\t\tec2u:university $university ;\n"
                                        +"\t\t?p ?o .\n"
                                        +"\n"
                                        +"}"
                                )

                                .forEach(new Update()
                                        .base(EC2U.Base)
                                        .binding("university", Coimbra.University)
                                )

                        ))
                ));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<JSONPath> courses(final Instant synced) {

        final String url=vault
                .get(APIUrl)
                .orElseThrow(() -> new IllegalStateException(format(
                        "undefined API URL <%s>", APIUrl
                )));

        final String id=vault
                .get(APIId)
                .orElseThrow(() -> new IllegalStateException(format(
                        "undefined API ID <%s>", APIId
                )));

        final String token=service(vault())
                .get(APIToken)
                .orElseThrow(() -> new IllegalStateException(format(
                        "undefined API key <%s>", APIToken
                )));

        return Xtream.of(synced)

                .flatMap(new Fill<>()
                        .model(url+"/obtemCursosBloco")
                )

                .optMap(new Query(request -> request
                        .method(POST)
                        .header("Content-Type", "application/x-www-form-urlencoded")
                        .header("Accept", JSON.MIME)
                        .input(() -> new ByteArrayInputStream(query(Map.ofEntries(
                                entry("applicationId", List.of(id)),
                                entry("accessToken", List.of(token)),
                                entry("anoLectivo", List.of("2022/2023")) // !!! dynamic
                        )).getBytes(StandardCharsets.UTF_8)))
                ))

                .optMap(new Fetch())
                .optMap(new Parse<>(new JSON()))

                .optMap(json -> {

                    if ( "SUCCESS".equals(json.asJsonObject().getString("status")) ) {

                        return Optional.of(json);

                    } else {

                        service(logger()).warning(this, json.toString());

                        return Optional.empty();

                    }
                })

                .map(JSONPath::new)
                .flatMap(json -> json.paths("listaResultados.*"));
    }

    private Optional<Frame> course(final JSONPath json) {
        return json.integer("cursoId").map(id -> {

            final Collection<Literal> label=json.paths("designacoes.*")

                    .optMap(d -> d.string("designacao")

                            .map(v -> literal(v, d.string("locSigla")
                                    .map(lang -> lang.toLowerCase(Locale.ROOT))
                                    .orElse(Coimbra.Language)
                            ))

                    )

                    .collect(toList());


            return frame(iri(EC2U.courses, md5(Coimbra.University+"@"+id)))

                    .values(RDF.TYPE, EC2U.Course)
                    .value(EC2U.university, Coimbra.University)

                    .values(DCTERMS.TITLE, label)

                    .value(Schema.url, json.string("urlEN").map(Values::iri))
                    .value(Schema.url, json.string("urlPT").map(Values::iri))

                    .values(Schema.name, label)
                    .values(Schema.courseCode, literal(id.toString()))

                    .value(Schema.educationalLevel, Optional.ofNullable(TypesToISCEDLevel.get(format("%s/%s",
                            json.string("cicloTipo").orElse("*"),
                            json.string("categoriaCursoTipo").orElse("*")
                    ))));

        });
    }

}
