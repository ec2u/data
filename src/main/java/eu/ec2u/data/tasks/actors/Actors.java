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

package eu.ec2u.data.tasks.actors;

import com.metreeca.core.Xtream;
import com.metreeca.csv.codecs.CSV;
import com.metreeca.http.actions.GET;
import com.metreeca.link.Frame;
import com.metreeca.link.Values;
import com.metreeca.rdf4j.actions.Upload;

import eu.ec2u.data.cities.*;
import eu.ec2u.data.terms.EC2U;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVRecord;
import org.eclipse.rdf4j.model.*;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.RDFS;

import java.time.Instant;
import java.util.*;
import java.util.stream.Stream;

import static com.metreeca.core.Locator.service;
import static com.metreeca.core.services.Vault.vault;
import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.*;

import static eu.ec2u.data.tasks.Tasks.exec;

import static java.lang.String.format;
import static java.util.Map.entry;
import static java.util.function.Predicate.not;
import static java.util.stream.Collectors.toMap;

public final class Actors implements Runnable {

    private static final String DataTermsUrl="actors-terms-url";
    private static final String DataEntriesUrl="actors-entries-url";

    private static final IRI Actors=EC2U.item("/actors/");


    private static final CSVFormat Format=CSVFormat.Builder.create()
            .setHeader()
            .setSkipHeaderRecord(true)
            .setAllowMissingColumnNames(true)
            .build();


    public static void main(final String... args) {
        exec(() -> new Actors().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        Xtream

                .from(
                        terms(),
                        entries()
                )

                .batch(0)

                .forEach(new Upload()
                        .contexts(Actors)
                        .clear(true)
                );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Stream<Statement> terms() {

        final String url=service(vault())
                .get(DataTermsUrl)
                .orElseThrow(() -> new IllegalStateException(format(
                        "undefined data URL <%s>", DataTermsUrl
                )));

        return Xtream.of(url)

                .optMap(new GET<>(new CSV(Format)))

                .flatMap(Collection::stream)

                .flatMap(record -> Optional.ofNullable(record.get("term"))

                        .filter(not(String::isEmpty)).filter(v -> !v.contains(":"))

                        .stream()

                        .flatMap(term -> Stream.of(
                                statement(EC2U.term(term), RDFS.LABEL, literal(record.get("label"), "en")),
                                statement(EC2U.term(term), RDFS.COMMENT, literal(record.get("description"), "en"))
                        ))

                );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<Statement> entries() {
        return Xtream.of(Instant.now())

                .flatMap(this::actors)
                .map(this::actor)

                .peek(frame -> System.out.println(Values.format(frame)))

                .flatMap(Frame::stream);
    }

    private Stream<CSVRecord> actors(final Instant now) {

        final String url=service(vault())
                .get(DataEntriesUrl)
                .orElseThrow(() -> new IllegalStateException(format(
                        "undefined data URL <%s>", DataEntriesUrl
                )));


        return Xtream.of(url)

                .optMap(new GET<>(new CSV(Format)))

                .flatMap(Collection::stream)

                .filter(record -> "yes".equals(normalize(record.get(col("G"))))); // only if authorized to publish
    }

    private Frame actor(final CSVRecord record) {
        return frame(iri(Actors, normalize(record.get(col("A")))))

                .value(RDF.TYPE, EC2U.term("Actor"))

                .value(EC2U.university, university(record))

                .value(EC2U.term("actors1-1"), profile(record))
                .values(EC2U.term("actors1-2"), activityArea(record))
                .value(EC2U.term("actors2-1"), activityCoverage(record))
                .value(EC2U.term("actors2-4"), size(record))

                .value(EC2U.term("actors2-6"), researchPartnerships(record))
                .value(EC2U.term("actors2-6b"), researchPartners(record))
                .values(EC2U.term("actors2-7"), researchArea(record))
                .values(EC2U.term("actors2-8"), researchRelation(record))
                // !!! .values(EC2U.term("actors2-9"), researchRelationQuality(record))
                .values(EC2U.term("actors2-10"), researchIssue(record))
                .value(EC2U.term("actors2-11"), researchProjects(record))
                .values(EC2U.term("actors2-14"), researchValorization(record))
                .values(EC2U.term("actors2-16"), researchDigitization(record))

                ;
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static Optional<Literal> profile(final CSVRecord record) {
        return Optional.ofNullable(map(

                entry("universities and research entities", "Universities and Research Entities (e.g. Universities/ "
                        +"University Alliances/University Associations, Research Institutes/ Researchers communities/"
                        +" Public research institutions, Research Camps, Industrial parks, Research Centers/Hubs or "
                        +"Think Tank, Research clusters/platforms, Research Departments in Companies)"
                ),

                entry("universities and research entities", "Universities and Research Entities (e.g. Universities/ "
                        +"University Alliances/University Associations, Research Institutes/ Researchers communities/"
                        +" Public research institutions, Research Camps, Industrial parks, Research Centers/Hubs or "
                        +"Think Tank, Researc"
                ),

                entry("local and regional authorities", "Local and Regional authorities (e.g. Local and Regional "
                        +"Public Administration/Authorities, County councils, Representatives of municipalities, "
                        +"local government bodies; Public institutions; Social assistance services, Local authorities"
                        +" for social protection and rights, Public health authorities)"
                ),

                entry("local and regional authorities", "Local and Regional authorities (e.g. Local and Regional "
                        +"Public Administration/Authorities, County councils, Representatives of municipalities, "
                        +"local government bodies; Public institutions; Social assistance services, Local authorities"
                        +" for social protectio"
                ),

                entry("service organizations", "Service organizations (e.g. Non-governmental organizations, "
                        +"Associations of patients, Local and regional communities (neighbourhood associations), "
                        +"Professional associations, Student Associations/Organisations, Vendors, Intermediaries, any"
                        +" other support entities)"
                ),

                entry("service organizations", "Service organizations (e.g. Non-governmental organizations, "
                        +"Associations of patients, Local and regional communities (neighbourhood associations), "
                        +"Professional associations, Student Associations/Organisations, Vendors, Intermediaries, any"
                        +" other support en"
                ),

                entry("incumbent firms", "Incumbent firms (e.g. Existing Companies as users of research and innovation"
                        +" results: local and regional enterprises, Companies/Corporations)"
                ),

                entry("innovative start-ups", "Innovative start-ups (e.g. Innovation Associations/ Programs, "
                        +"Bootcamps, Entrepreneurs, Unicorns, Spin-offs)"
                )

        ).get(normalize(record.get(col("H"))))).or(() ->

                other(normalize(record.get(col("I"))))

        );
    }

    private static Optional<IRI> university(final CSVRecord record) {
        return Optional.ofNullable(Map.ofEntries(

                entry("coimbra", Coimbra.University),
                entry("iasi", Iasi.University),
                entry("jena", Jena.University),
                entry("pavia", Pavia.University),
                entry("poitiers", Poitiers.University),
                entry("salamanca", Salamanca.University),
                entry("turku", Turku.University)

        ).get(normalize(record.get(col("FO")))));
    }

    private static Stream<Literal> activityArea(final CSVRecord record) {
        return Stream

                .of(
                        entry("J", "agriculture, forestry and rural areas"),
                        entry("K", "bioeconomy"),
                        entry("L", "energy"),
                        entry("M", "environment"),
                        entry("N", "food systems"),
                        entry("O", "frontier research"),
                        entry("P", "health"),
                        entry("Q", "industry"),
                        entry("R", "information and communication technologies"),
                        entry("S", "oceans and seas"),
                        entry("T", "security"),
                        entry("U", "small and medium-sized businesses (SMEs)"),
                        entry("V", "social sciences and humanities"),
                        entry("W", "space"),
                        entry("X", "synergies with structural funds"),
                        entry("Y", "transport"),
                        entry("Z", "other")
                )

                .filter(entry -> Optional.of(normalize(record.get(col(entry.getKey()))))
                        .filter(v -> "other".equals(entry.getValue()) ? !v.isEmpty() : "yes".equals(v))
                        .isPresent()
                )

                .map(entry -> literal(entry.getValue()));
    }

    private static Optional<Literal> activityCoverage(final CSVRecord record) {
        return Optional.ofNullable(map(

                entry("international", "At international level"),
                entry("national", "At national level"),
                entry("regional", "At regional level"),
                entry("local", "At local level")

        ).get(normalize(record.get(col("AB")))));
    }

    private static Optional<Literal> size(final CSVRecord record) {
        return Optional.ofNullable(map(

                entry("0-9", "0-9"),
                entry("10-49", "10-49"),
                entry("50-249", "50-249"),
                entry("250+", "250+")

        ).get(normalize(record.get(col("AE")))));
    }

    private Optional<Literal> researchPartnerships(final CSVRecord record) {
        return Optional.ofNullable(map().get(normalize(record.get(col("AG"))))).or(() -> Optional
                .of(normalize(record.get(col("AI"))))
                .filter(not(("i don't know / no opinion")::equals))
                .map(Values::literal)
        );
    }

    private static Optional<Literal> researchPartners(final CSVRecord record) {
        return Optional.ofNullable(map(

                entry("mainly public entities", "Mainly with public entities"),
                entry("mainly private entities", "Mainly with private entities"),
                entry("both public and private entities", "Both to the same extent")

        ).get(normalize(record.get(col("AI")))));
    }

    private static Stream<Literal> researchArea(final CSVRecord record) {
        return Stream

                .of(
                        entry("AJ", "agriculture, forestry and rural areas"),
                        entry("AK", "bioeconomy"),
                        entry("AL", "energy"),
                        entry("AM", "environment"),
                        entry("AN", "food systems"),
                        entry("AO", "frontier research"),
                        entry("AP", "health"),
                        entry("AQ", "industry"),
                        entry("AR", "information and communication technologies"),
                        entry("AS", "oceans and seas"),
                        entry("AT", "security"),
                        entry("AU", "small and medium-sized businesses (SMEs)"),
                        entry("AV", "social sciences and humanities"),
                        entry("AW", "space"),
                        entry("AX", "synergies with structural funds"),
                        entry("AY", "transport"),
                        entry("AZ", "other")
                )

                .filter(entry -> Optional.of(normalize(record.get(col(entry.getKey()))))
                        .filter(v -> "other".equals(entry.getValue()) ? !v.isEmpty() : "yes".equals(v))
                        .isPresent()
                )

                .map(entry -> literal(entry.getValue()));
    }

    private static Stream<Literal> researchRelation(final CSVRecord record) {
        return Stream

                .of(
                        entry("BA", "cooperation"),
                        entry("BB", "collaboration"),
                        entry("BC", "reporting"),
                        entry("BD", "involvement"),
                        entry("BE", "expertise providers"),
                        entry("BF", "support")
                )

                .filter(entry -> Optional.of(normalize(record.get(col(entry.getKey()))))
                        .filter(v -> "other".equals(entry.getValue()) ? !v.isEmpty() : "yes".equals(v))
                        .isPresent()
                )

                .map(entry -> literal(entry.getValue()));
    }

    private static Stream<Literal> researchIssue(final CSVRecord record) {
        return Stream

                .of(
                        entry("BN", "political willingness/immaturity"),
                        entry("BO", "distrust culture"),
                        entry("BP", "skepticism and opposition"),
                        entry("BQ", "legal issues"),
                        entry("BR", "overregulation"),
                        entry("BS", "funding and resourses"),
                        entry("BT", "education"),
                        entry("BU", "technology"),
                        entry("BV", "bureaucracy"),
                        entry("BW", "none"),
                        entry("BX", "other")
                )

                .filter(entry -> Optional.of(normalize(record.get(col(entry.getKey()))))
                        .filter(v -> "other".equals(entry.getValue()) ? !v.isEmpty() : "yes".equals(v))
                        .isPresent()
                )

                .map(entry -> literal(entry.getValue()));
    }

    private static Optional<Literal> researchProjects(final CSVRecord record) {
        return Optional.ofNullable(map(

                entry("1-3", "1-3"),
                entry("4-6", "4-6"),
                entry("7-10", "7-10"),
                entry("10+", "10+")

        ).get(normalize(record.get(col("BY")))));
    }

    private static Stream<Literal> researchValorization(final CSVRecord record) {
        return Stream

                .of(
                        entry("CB", "open science"),
                        entry("CC", "technology transfer"),
                        entry("CD", "spin-off"),
                        entry("CE", "support")
                )

                .filter(entry -> Optional.of(normalize(record.get(col(entry.getKey()))))
                        .filter(v -> "other".equals(entry.getValue()) ? !v.isEmpty() : "yes".equals(v))
                        .isPresent()
                )

                .map(entry -> literal(entry.getValue()));

    }

    private static Stream<Literal> researchDigitization(final CSVRecord record) {
        return Stream

                .of(
                        entry("CG", "production"),
                        entry("CH", "acquisition"),
                        entry("CI", "organization"),
                        entry("CJ", "transmission"),
                        entry("CK", "sharing"),
                        entry("CL", "innovation"),
                        entry("CM", "data collection"),
                        entry("CN", "none"),
                        entry("CO", "other")
                )

                .filter(entry -> Optional.of(normalize(record.get(col(entry.getKey()))))
                        .filter(v -> "other".equals(entry.getValue()) ? !v.isEmpty() : "yes".equals(v))
                        .isPresent()
                )

                .map(entry -> literal(entry.getValue()));

    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static int col(final String index) {

        int n=0;

        for (int i=0, l=index.length(); i < l; ++i) {
            n=n*26+(Character.toLowerCase(index.charAt(i))-'a'+(i < l-1 ? 1 : 0));
        }

        return n;
    }

    private static String normalize(final String string) {
        return Optional.ofNullable(string)
                .map(String::trim)
                .map(v -> v.toLowerCase(Locale.ROOT))
                .orElse("");
    }

    private static Map<String, Literal> map() {
        return Map.ofEntries(

                entry("no", literal(false)),
                entry("yes", literal(true))

        );
    }

    @SafeVarargs private static Map<String, Literal> map(final Map.Entry<String, String>... entries) {
        return Arrays.stream(entries).collect(toMap(
                entry -> normalize(entry.getValue()),
                entry -> literal(normalize(entry.getKey()))
        ));
    }

    private static Optional<Literal> other(final String value) {
        return Optional.ofNullable(value)
                .filter(not(String::isEmpty))
                .map(v -> literal("other"));
    }

}
