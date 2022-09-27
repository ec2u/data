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

package eu.ec2u.data.tasks.courses;

import com.metreeca.http.Xtream;
import com.metreeca.http.actions.*;
import com.metreeca.http.services.Vault;
import com.metreeca.json.JSONPath;
import com.metreeca.json.codecs.JSON;
import com.metreeca.link.Frame;
import com.metreeca.link.Values;
import com.metreeca.rdf4j.actions.Update;

import eu.ec2u.data.cities.Coimbra;
import eu.ec2u.data.terms.EC2U;
import eu.ec2u.data.terms.Schema;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDF;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
import java.util.stream.Stream;

import static com.metreeca.core.Identifiers.md5;
import static com.metreeca.core.Lambdas.task;
import static com.metreeca.http.Locator.service;
import static com.metreeca.http.Request.POST;
import static com.metreeca.http.Request.query;
import static com.metreeca.http.services.Logger.logger;
import static com.metreeca.http.services.Vault.vault;
import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.iri;
import static com.metreeca.link.Values.literal;
import static com.metreeca.rdf4j.services.Graph.graph;

import static eu.ec2u.data.ports.Courses.Course;
import static eu.ec2u.data.tasks.Tasks.*;

import static java.lang.String.format;
import static java.util.Map.entry;
import static java.util.stream.Collectors.toList;

public final class CoursesCoimbra implements Runnable {

    private static final String APIUrl="courses-coimbra-url";
    private static final String APIId="courses-coimbra-id";
    private static final String APIToken="courses-coimbra-token";


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

                    // !!! see https://apps.uc.pt/courses/en/index

                    // !!! cicloTipo

                    // NAO_CONFERENTE_GRAU
                    // SEGUNDO
                    // TERCEIRO
                    // PRIMEIRO

                    // !!! categoriaCursoTipo

                    // FORMACAO
                    // ESPECIALIZACAO
                    // ESPECIALIZACAO_AVANCADA
                    // CONTINUIDADE
                    // FORMACAO_LONGO_VIDA
                    // POS_DOUTORAMENTO
                    // FORMACAO_CONTINUA
                    // INTEGRADO

                    ;

        });
    }

}