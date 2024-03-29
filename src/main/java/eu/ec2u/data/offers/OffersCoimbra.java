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
import com.metreeca.core.actions.Fill;
import com.metreeca.core.services.Vault;
import com.metreeca.core.toolkits.Strings;
import com.metreeca.http.actions.*;
import com.metreeca.json.JSONPath;
import com.metreeca.json.codecs.JSON;
import com.metreeca.link.Frame;
import com.metreeca.link.Values;
import com.metreeca.rdf4j.actions.Upload;

import eu.ec2u.data.concepts.ISCED2011;
import eu.ec2u.data.concepts.Languages;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.things.Schema;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.XSD;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.metreeca.core.Locator.service;
import static com.metreeca.core.services.Logger.logger;
import static com.metreeca.core.services.Vault.vault;
import static com.metreeca.core.toolkits.Lambdas.guarded;
import static com.metreeca.http.Request.POST;
import static com.metreeca.http.Request.query;
import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.iri;
import static com.metreeca.link.Values.literal;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.University.Coimbra;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.offers.Offers.Course;
import static eu.ec2u.data.offers.Offers.Program;
import static eu.ec2u.work.validation.Validators.validate;

import static java.lang.String.format;
import static java.util.Map.entry;
import static java.util.function.Predicate.not;

public final class OffersCoimbra implements Runnable {

    private static final IRI Context=iri(Offers.Context, "/coimbra");

    private static final String APIUrl="offers-coimbra-url";
    private static final String APIId="offers-coimbra-id";
    private static final String APIToken="offers-coimbra-token";


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static final Pattern DurationPattern=Pattern.compile("(?<value>\\d+)\\s+(?<unit>\\w+)");

    // ;( Java Duration natively supports either seconds-based durations or day-based periods

    private static final Map<String, Function<Integer, String>> ValueToDuration=Map.ofEntries(
            entry("year", OffersCoimbra::years),
            entry("years", OffersCoimbra::years),
            entry("semester", OffersCoimbra::semesters),
            entry("semesters", OffersCoimbra::semesters),
            entry("trimester", OffersCoimbra::trimesters),
            entry("trimesters", OffersCoimbra::trimesters),
            entry("month", OffersCoimbra::months),
            entry("months", OffersCoimbra::months),
            entry("week", OffersCoimbra::weeks),
            entry("weeks", OffersCoimbra::weeks),
            entry("day", OffersCoimbra::days),
            entry("days", OffersCoimbra::days),
            entry("hour", OffersCoimbra::hours),
            entry("hours", OffersCoimbra::hours)
    );


    private static String years(final int value) {
        return format("P%dY", value);
    }

    private static String semesters(final int value) {
        return format("P%dM", 6*value);
    }

    private static String trimesters(final int value) {
        return format("P%dM", 3*value);
    }

    private static String months(final int value) {
        return format("P%dM", value);
    }

    private static String weeks(final int value) {
        return format("P%dD", 7*value); // ISO weeks not supported by https://www.w3.org/TR/xmlschema-2/#duration
    }

    private static String days(final int value) {
        return format("P%dD", value);
    }

    private static String hours(final int value) {
        return format("PT%dH", value);
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static final Pattern NotLettersPattern=Pattern.compile("[^\\p{L}]+");


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static void main(final String... args) {
        exec(() -> new OffersCoimbra().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Vault vault=service(vault());


    @Override public void run() {
        Xtream.of(Instant.EPOCH)

                .flatMap(this::offers)
                .batch(0)

                .flatMap(offers -> Xtream.from(

                        Xtream.from(offers)

                                .filter(OffersCoimbra::isProgram)
                                .optMap(this::program)

                                .pipe(programs -> validate(Program(), Set.of(Program), programs)),

                        Xtream.from(offers)

                                .filter(not(OffersCoimbra::isProgram))
                                .optMap(this::course)

                                .pipe(courses -> validate(Course(), Set.of(Course), courses))

                ))

                .forEach(new Upload()
                        .contexts(Context)
                        .clear(true)
                );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static boolean isProgram(final JSONPath entry) {
        return entry.string("cicloTipo").filter("NAO_CONFERENTE_GRAU"::equals).isEmpty();
    }


    private Xtream<JSONPath> offers(final Instant synced) {

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

        final Year year=LocalDate.now().getMonth().compareTo(Month.JULY) >= 0
                ? Year.now()
                : Year.now().minusYears(1);

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
                                entry("obterInformacaoFichaCurso", List.of("true")),
                                entry("devolverSoCursosComFichaCurso", List.of("true")),
                                entry("anoLectivo", List.of(
                                        format("%s/%s", year, year.plusYears(1)),
                                        format("%s/%s", year.plusYears(1), year.plusYears(2))
                                ))
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

    private Optional<Frame> offer(final IRI context, final JSONPath json) {
        return json.integer("cursoId").map(id -> frame(item(context, Coimbra, String.valueOf(id)))

                .value(Resources.university, Coimbra.Id)

                .value(Schema.url, json.string("urlEN").map(Values::iri))
                .value(Schema.url, json.string("urlPT").map(Values::iri))

                .values(Schema.name, json.paths("designacoes.*")
                        .optMap(this::localized)
                )

                .values(Schema.courseCode, literal(id.toString()))

                .value(Schema.educationalLevel, Optional.ofNullable(TypesToISCEDLevel.get(format("%s/%s",
                        json.string("cicloTipo").orElse("*"),
                        json.string("categoriaCursoTipo").orElse("*")
                ))))

                .values(Schema.inLanguage, json.paths("linguasAprendizagem.*")
                        .filter(path -> path.string("locSigla").filter("EN"::equals).isPresent())
                        .optMap(v -> v.string("designacao"))
                        .map(NotLettersPattern::split)
                        .flatMap(Arrays::stream)
                        .map(name -> Languages.languageCode(name).orElse(Coimbra.Language))
                        .map(Values::literal)
                )

                .values(Schema.learningResourceType, json.paths("regimesEstudo.*")
                        .optMap(this::localized)
                )

                .value(Schema.numberOfCredits, json.string("ects")
                        .map(Offers::ects)
                        .map(Values::literal)
                )

                .value(Schema.timeRequired, json.string("duracaoEN")
                        .map(Strings::lower)
                        .map(DurationPattern::matcher)
                        .filter(Matcher::matches)
                        .flatMap((matcher -> Optional.ofNullable(ValueToDuration.get(matcher.group("unit")))
                                .flatMap(function -> Optional.ofNullable(matcher.group("value"))
                                        .map(guarded(Integer::parseInt))
                                        .map(function)
                                )))
                        .map(v -> literal(v, XSD.DURATION))
                )

                .values(Schema.teaches, json.paths("objetivosCurso.*")
                        .optMap(this::localized)
                )

                .values(Schema.assesses, json.paths("objetivosAprendizagem.*")
                        .optMap(this::localized)
                )

                .values(Schema.coursePrerequisites, json.paths("condicoesAcesso.*")
                        .optMap(this::localized)
                )

                .values(Schema.competencyRequired, json.paths("regrasDeAvaliacao.*")
                        .optMap(this::localized)
                )

                .values(Schema.educationalCredentialAwarded, json.paths("qualificoesAtribuidas.*")
                        .optMap(this::localized)
                )

        );
    }

    private Optional<Frame> program(final JSONPath json) {
        return offer(Offers.Programs, json).map(program -> program

                .value(RDF.TYPE, Program)

        );
    }

    private Optional<Frame> course(final JSONPath json) {
        return offer(Offers.Courses, json).map(course -> course

                .value(RDF.TYPE, Course)

        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Optional<Literal> localized(final JSONPath d) {
        return d.string("designacao")

                .map(v -> literal(v, d.string("locSigla")
                        .map(lang -> lang.toLowerCase(Locale.ROOT))
                        .orElse(Coimbra.Language)
                ));
    }

}
