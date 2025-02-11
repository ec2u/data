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

package eu.ec2u.data.datasets.offerings;


import com.metreeca.flow.http.Request;
import com.metreeca.flow.http.actions.Fetch;
import com.metreeca.flow.http.actions.Parse;
import com.metreeca.flow.http.actions.Query;
import com.metreeca.flow.http.formats.Text;
import com.metreeca.flow.json.formats.JSON;
import com.metreeca.flow.services.Logger;
import com.metreeca.flow.services.Vault;
import com.metreeca.mesh.Value;
import com.metreeca.mesh.tools.Store;
import com.metreeca.shim.Locales;
import com.metreeca.shim.URIs;

import eu.ec2u.data.datasets.courses.CourseFrame;
import eu.ec2u.data.datasets.programs.ProgramFrame;
import eu.ec2u.data.datasets.taxonomies.Topic;
import eu.ec2u.data.datasets.taxonomies.TopicsISCED2011;

import java.net.URI;
import java.time.*;
import java.util.*;
import java.util.Map.Entry;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.async;
import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.http.Request.POST;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.flow.services.Vault.vault;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.Value.value;
import static com.metreeca.mesh.queries.Criterion.criterion;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.shim.Collections.*;
import static com.metreeca.shim.Futures.joining;
import static com.metreeca.shim.Lambdas.lenient;
import static com.metreeca.shim.Loggers.time;
import static com.metreeca.shim.Streams.optional;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.courses.Course.review;
import static eu.ec2u.data.datasets.courses.Courses.COURSES;
import static eu.ec2u.data.datasets.programs.Program.review;
import static eu.ec2u.data.datasets.programs.Programs.PROGRAMS;
import static eu.ec2u.data.datasets.universities.University.COIMBRA;
import static eu.ec2u.data.datasets.universities.University.uuid;
import static java.lang.String.format;
import static java.util.Locale.ROOT;
import static java.util.function.Predicate.not;

public final class OfferingsCoimbra implements Runnable {

    private static final String API_URL="offerings-coimbra-url";
    private static final String API_ID="offerings-coimbra-id";
    private static final String API_TOKEN="offerings-coimbra-token";


    private static final Pattern NOT_LETTERS_PATTERN=Pattern.compile("[^\\p{L}]+");

    private static final Map<String, Topic> TypesToISCEDLevel=map(

            entry("PRIMEIRO/*", TopicsISCED2011.LEVEL_6),

            entry("SEGUNDO/INTEGRADO", TopicsISCED2011.LEVEL_7),
            entry("SEGUNDO/CONTINUIDADE", TopicsISCED2011.LEVEL_7),
            entry("SEGUNDO/ESPECIALIZACAO_AVANCADA", TopicsISCED2011.LEVEL_7),
            entry("SEGUNDO/FORMACAO_LONGO_VIDA", TopicsISCED2011.LEVEL_7),

            entry("TERCEIRO/*", TopicsISCED2011.LEVEL_8)

    );


    private static final Pattern AMOUNT_PATTERN=Pattern.compile("(?<value>\\d+)\\s+(?<unit>\\w+)");

    // ;( Java Duration natively supports either time-based durations or day-based periods

    private static final Map<String, Function<Integer, Period>> VALUE_TO_PERIOD=map(
            entry("year", Period::ofYears),
            entry("years", Period::ofYears),
            entry("semester", v -> Period.ofMonths(6*v)),
            entry("semesters", v -> Period.ofMonths(6*v)),
            entry("trimester", v -> Period.ofMonths(3*v)),
            entry("trimesters", v -> Period.ofMonths(3*v)),
            entry("month", Period::ofMonths),
            entry("months", Period::ofMonths),
            entry("week", v -> Period.ofDays(7*v)),
            entry("weeks", v -> Period.ofDays(7*v)),
            entry("day", Period::ofDays),
            entry("days", Period::ofDays)
    );

    private static final Map<String, Function<Integer, Duration>> VALUE_TO_DURATION=map( // !!! convert years/…
            entry("day", Duration::ofDays),
            entry("days", Duration::ofDays),
            entry("hour", Duration::ofHours),
            entry("hours", Duration::ofHours)
    );


    public static void main(final String... args) {
        exec(() -> new OfferingsCoimbra().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Vault vault=service(vault());
    private final Store store=service(store());
    private final Logger logger=service(logger());


    @Override
    public void run() {


        final Set<Value> offerings=set(offerings());

        time(() -> Stream

                .of(

                        async(() -> store.modify(

                                array(offerings.stream()

                                        .map(offering -> async(() -> Optional.of(offering)
                                                .filter(OfferingsCoimbra::isProgram)
                                                .flatMap(this::program)
                                        ))

                                        .collect(joining())
                                        .flatMap(Optional::stream)
                                ),

                                value(query(new ProgramFrame(true))
                                        .where("university", criterion().any(COIMBRA))
                                )

                        )),

                        async(() -> store.modify(

                                array(offerings.stream()

                                        .map(offering -> async(() -> Optional.of(offering)
                                                .filter(not(OfferingsCoimbra::isProgram))
                                                .flatMap(this::course)
                                        ))

                                        .collect(joining())
                                        .flatMap(Optional::stream)
                                ),

                                value(query(new CourseFrame(true))
                                        .where("university", criterion().any(COIMBRA))
                                )

                        ))

                )

                .collect(joining())
                .reduce(0, Integer::sum)

        ).apply((elapsed, resources) -> logger.info(this, format(
                "synced <%,d> resources in <%,d> ms", resources, elapsed
        )));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static boolean isProgram(final Value entry) {
        return entry.get("cicloTipo").string().filter("NAO_CONFERENTE_GRAU"::equals).isEmpty();
    }


    private Stream<Value> offerings() {

        final String url=vault.get(API_URL);
        final String id=vault.get(API_ID);
        final String token=service(vault()).get(API_TOKEN);

        final Year year=LocalDate.now().getMonth().compareTo(Month.JULY) >= 0
                ? Year.now()
                : Year.now().minusYears(1);

        return Stream.of(url+"/obtemCursosBloco")

                .flatMap(optional(new Query(request -> request
                        .method(POST)
                        .header("Content-Type", "application/x-www-form-urlencoded")
                        .header("Accept", JSON.MIME)
                        .body(new Text(), Request.query(map(
                                entry("applicationId", list(id)),
                                entry("accessToken", list(token)),
                                entry("obterInformacaoFichaCurso", list("true")),
                                entry("devolverSoCursosComFichaCurso", list("true")),
                                entry("anoLectivo", list(
                                        format("%s/%s", year, year.plusYears(1)),
                                        format("%s/%s", year.plusYears(1), year.plusYears(2))
                                ))
                        )))
                )))

                .flatMap(optional(new Fetch()))
                .flatMap(optional(new Parse<>(new JSON())))

                .flatMap(optional(json -> {

                    if ( json.get("status").string().filter(status -> status.equals("SUCCESS")).isPresent() ) {

                        return Optional.of(json);

                    } else {

                        logger.warning(this, json.toString());

                        return Optional.empty();

                    }

                }))

                .flatMap(json -> json.get("listaResultados").values());
    }

    private Optional<ProgramFrame> program(final Value json) {
        return json.get("cursoId").integral().flatMap(id -> review(new ProgramFrame()

                .id(PROGRAMS.id().resolve(uuid(COIMBRA, String.valueOf(id))))
                .university(COIMBRA)

                .identifier(String.valueOf(id))
                .url(set(url(json)))

                .name(map(name(json)))

                .educationalLevel(educationalLevel(json).orElse(null))
                .numberOfCredits(numberOfCredits(json).orElse(null))
                .timeToComplete(period(json).orElse(null))

                .educationalCredentialAwarded(map(educationalCredentialAwarded(json)))
                .teaches(map(teaches(json)))
                .assesses(map(assesses(json)))
                .programPrerequisites(map(prerequisites(json)))
                .competencyRequired(map(competencyRequired(json)))

        ));
    }

    private Optional<CourseFrame> course(final Value json) {
        return json.get("cursoId").integral().flatMap(id -> review(new CourseFrame()


                .id(COURSES.id().resolve(uuid(COIMBRA, String.valueOf(id))))
                .university(COIMBRA)

                .courseCode(String.valueOf(id))
                .url(set(url(json)))

                .name(map(name(json)))

                .educationalLevel(educationalLevel(json).orElse(null))
                .numberOfCredits(numberOfCredits(json).orElse(null))
                .timeRequired(duration(json).orElse(null))

                .inLanguage(set(inLanguage(json)))

                .educationalCredentialAwarded(map(educationalCredentialAwarded(json)))
                .teaches(map(teaches(json)))
                .assesses(map(assesses(json)))
                .coursePrerequisites(map(prerequisites(json)))
                .competencyRequired(map(competencyRequired(json)))

        ));
    }


    private Stream<URI> url(final Value json) {
        return Stream.concat(
                json.get("urlEN").string().flatMap(URIs::fuzzy).stream(),
                json.get("urlPT").string().flatMap(URIs::fuzzy).stream()
        );
    }

    private Stream<Entry<Locale, String>> name(final Value json) {
        return json.get("designacoes").values()
                .flatMap(value -> localized(value).stream());
    }

    private Optional<Topic> educationalLevel(final Value json) {
        return Optional.ofNullable(TypesToISCEDLevel.get(format("%s/%s",
                json.get("cicloTipo").string().orElse("*"),
                json.get("categoriaCursoTipo").string().orElse("*")
        )));
    }

    private static Optional<Double> numberOfCredits(final Value json) {
        return json.get("ects").string()
                .flatMap(lenient(Double::parseDouble));
    }

    private Optional<Period> period(final Value json) {
        return json.get("duracaoEN").string().flatMap(period -> Optional.of(period)

                .map(v -> v.toLowerCase(ROOT))
                .map(AMOUNT_PATTERN::matcher)
                .filter(Matcher::matches)
                .flatMap((matcher -> Optional.ofNullable(VALUE_TO_PERIOD.get(matcher.group("unit")))
                        .flatMap(function -> Optional.ofNullable(matcher.group("value"))
                                .flatMap(lenient(Integer::parseInt))
                                .map(function)
                        )
                ))

                .or(() -> {

                    logger.warning(this, format("malformed period <%s>", period));

                    return Optional.empty();

                })

        );
    }

    private Optional<Duration> duration(final Value json) {
        return json.get("duracaoEN").string().flatMap(duration -> Optional.of(duration)

                .map(v -> v.toLowerCase(ROOT))
                .map(AMOUNT_PATTERN::matcher)
                .filter(Matcher::matches)
                .flatMap((matcher -> Optional.ofNullable(VALUE_TO_DURATION.get(matcher.group("unit")))
                        .flatMap(function -> Optional.ofNullable(matcher.group("value"))
                                .flatMap(lenient(Integer::parseInt))
                                .map(function)
                        )
                ))

                .or(() -> {

                    logger.warning(this, format("malformed duration <%s>", duration));

                    return Optional.empty();

                })

        );
    }

    private Stream<String> inLanguage(final Value json) {
        return json.get("linguasAprendizagem").values()
                .filter(path -> path.get("locSigla").string().filter("EN"::equals).isPresent())
                .flatMap(optional(v -> v.get("designacao").string()))
                .map(NOT_LETTERS_PATTERN::split)
                .flatMap(Arrays::stream)
                .map(name -> Locales.fuzzy(name).orElse(COIMBRA.locale()))
                .map(Locale::getLanguage);
    }

    private Stream<Entry<Locale, String>> educationalCredentialAwarded(final Value json) {
        return json.get("qualificoesAtribuidas").values()
                .flatMap(value -> localized(value).stream());
    }

    private Stream<Entry<Locale, String>> teaches(final Value json) {
        return json.get("objetivosCurso").values()
                .flatMap(value -> localized(value).stream());
    }

    private Stream<Entry<Locale, String>> assesses(final Value json) {
        return json.get("objetivosAprendizagem").values()
                .flatMap(value -> localized(value).stream());
    }

    private Stream<Entry<Locale, String>> prerequisites(final Value json) {
        return json.get("condicoesAcesso").values()
                .flatMap(value -> localized(value).stream());
    }

    private Stream<Entry<Locale, String>> competencyRequired(final Value json) {
        return json.get("regrasDeAvaliacao").values()
                .flatMap(value -> localized(value).stream());
    }


    private Optional<Entry<Locale, String>> localized(final Value value) {
        return value.get("designacao").string().flatMap(name ->
                value.get("locSigla").string().map(locale ->
                        entry(Locales.locale(locale), name)
                ));
    }

}
