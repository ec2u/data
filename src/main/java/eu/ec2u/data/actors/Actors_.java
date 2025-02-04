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

package eu.ec2u.data.actors;

import com.metreeca.http.actions.GET;
import com.metreeca.http.csv.formats.CSV;
import com.metreeca.http.rdf4j.actions.Upload;
import com.metreeca.http.work.Xtream;
import com.metreeca.link.Frame;

import eu.ec2u.data.EC2U;
import eu.ec2u.data.resources.Resources;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVRecord;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.RDFS;

import java.time.Instant;
import java.util.*;
import java.util.stream.Stream;

import static com.metreeca.http.Locator.service;
import static com.metreeca.http.rdf.Values.statement;
import static com.metreeca.http.services.Vault.vault;
import static com.metreeca.http.toolkits.Identifiers.md5;
import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.EC2U.update;
import static eu.ec2u.data.universities.University.*;
import static java.lang.String.format;
import static java.util.Map.entry;
import static java.util.function.Predicate.not;
import static java.util.stream.Collectors.toMap;

public final class Actors_ implements Runnable {

    private static final IRI Context=item(Actors.Context, "/ec2u");


    private static final String DataTermsUrl="actors-terms-url";
    private static final String DataEntriesUrl="actors-entries-url";

    private static final CSVFormat Format=CSVFormat.Builder.create()
            .setHeader()
            .setSkipHeaderRecord(true)
            .setAllowMissingColumnNames(true)
            .build();


    private static IRI term(final String name) {
        return EC2U.term(format("actors/%s", name));
    }


    public static void main(final String... args) {
        exec(() -> new Actors_().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        update(connection -> Xtream

                .from(
                        fields(),
                        entries()
                )

                .batch(0)

                .forEach(new Upload()
                        .contexts(Context)
                        .clear(true)
                )

        );
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Stream<Statement> fields() {

        final String url=service(vault()).get(DataTermsUrl);

        return Xtream.of(url)

                .optMap(new GET<>(new CSV(Format)))

                .flatMap(Collection::stream)

                .flatMap(record -> Optional.ofNullable(record.get("term"))

                        .filter(not(String::isEmpty)).filter(v -> !v.contains(":"))

                        .stream()

                        .flatMap(term -> Stream.of(
                                statement(term(term), RDFS.LABEL, literal(record.get("label"), "en")),
                                statement(term(term), RDFS.COMMENT, literal(record.get("description"), "en"))
                        ))

                );
    }

    private Xtream<Statement> entries() {
        return Xtream.of(Instant.now())

                .flatMap(this::actors)
                .map(this::actor)

                .flatMap(Frame::stream);
    }

    private Stream<CSVRecord> actors(final Instant now) {

        final String url=service(vault()).get(DataEntriesUrl);


        return Xtream.of(url)

                .optMap(new GET<>(new CSV(Format)))

                .flatMap(Collection::stream)

                .filter(record -> !normalize(record.get(col("B"))).isEmpty()) // only if completed
                .filter(record -> "yes".equals(normalize(record.get(col("G"))))); // only if authorized to publish
    }

    private Frame actor(final CSVRecord record) {
        return frame(

                field(ID, iri(Context, normalize(record.get(col("A"))))),

                field(RDF.TYPE, Actors.Actor),
                field(RDFS.LABEL, literal("?", "en")), // !!! label

                field(Resources.university, university(record)), // !!! missing in the survey

                field(term("Q1-1"), profile(record)),
                field(term("Q1-2"), activityArea(record)),
                field(term("Q1-3"), activitySpan(record)),
                field(term("Q2-1"), activityCoverage(record)),
                field(term("Q1-2"), turnover(record)),
                field(term("Q1-3"), researchBudget(record)),
                field(term("Q2-4"), size(record)),
                field(term("Q2-5"), researchWeight(record)),

                field(term("Q2-6"), researchPartnerships(record)),
                field(term("Q2-6a"), researchSpan(record)),
                field(term("Q2-6b"), researchPartners(record)),
                field(term("Q2-7"), researchArea(record)),
                field(term("Q2-8"), researchRelation(record)),
                field(term("Q2-9"), researchRelationQuality(record)),
                field(term("Q2-10"), researchIssue(record)),
                field(term("Q2-11"), researchProjects(record)),
                field(term("Q2-12"), researchNetworks(record)),
                field(term("Q2-13"), researchRecruiting(record)),
                field(term("Q2-14"), researchValorization(record)),
                field(term("Q2-15"), researchCoverage(record)),
                field(term("Q2-16"), researchDigitization(record)),

                field(term("Q2-17"), citizenPartnerships(record)),
                field(term("Q3-1"), citizenPartners(record)),
                field(term("Q3-1b"), citizenInvolvement(record)),
                field(term("Q3-1c"), citizenStage(record)),
                field(term("Q3-2"), citizenTarget(record)),
                field(term("Q3-3"), citizenImpact(record)),
                field(term("Q3-4"), citizenProjects(record)),
                field(term("Q3-4a"), citizenExperience(record)),
                field(term("Q3-5"), citizenBudget(record)),
                field(term("Q3-6"), citizenFunding(record)),
                field(term("Q3-7"), citizenNetwork(record)),
                field(term("Q3-7a"), citizenNetworkSize(record)),
                field(term("Q3-7b"), citizenNetworkSample(record)),
                field(term("Q3-8"), citizenExpertise(record)),
                field(term("Q3-9"), citizenIssues(record)),
                field(term("Q3-10"), citizenRecruiting(record)),
                field(term("Q3-11"), citizenRewarding(record))

        );
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Optional<IRI> university(final CSVRecord record) {
        return Optional.ofNullable(Map.ofEntries(

                entry("coimbra", Coimbra.id),
                entry("iasi", Iasi.id),
                entry("jena", Jena.id),
                entry("pavia", Pavia.id),
                entry("poitiers", Poitiers.id),
                entry("salamanca", Salamanca.id),
                entry("turku", Turku.id)

        ).get(normalize(record.get(col("FO")))));
    }


    private Optional<Literal> profile(final CSVRecord record) {
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

    private Stream<Literal> activityArea(final CSVRecord record) {
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

    private Optional<Literal> activitySpan(final CSVRecord record) {
        return open(record, "AA");
    }

    private Optional<Literal> activityCoverage(final CSVRecord record) {
        return Optional.ofNullable(map(

                entry("international", "At international level"),
                entry("national", "At national level"),
                entry("regional", "At regional level"),
                entry("local", "At local level")

        ).get(normalize(record.get(col("AB")))));
    }

    private Optional<Literal> turnover(final CSVRecord record) {
        return open(record, "AC");
    }

    private Optional<Literal> researchBudget(final CSVRecord record) {
        return open(record, "AD");
    }

    private Optional<Literal> size(final CSVRecord record) {
        return Optional.ofNullable(map(

                entry("0-9", "0-9"),
                entry("10-49", "10-49"),
                entry("50-249", "50-249"),
                entry("250+", "250+")

        ).get(normalize(record.get(col("AE")))));
    }

    private Optional<Literal> researchWeight(final CSVRecord record) {
        return open(record, "AF");
    }


    private Optional<Literal> researchPartnerships(final CSVRecord record) {
        return Optional.ofNullable(map().get(normalize(record.get(col("AG"))))).or(() -> Optional
                .of(normalize(record.get(col("AI"))))
                .filter(not(("i don't know / no opinion")::equals))
                .map(Frame::literal)
        );
    }

    private Optional<Literal> researchSpan(final CSVRecord record) {
        return open(record, "AH");
    }

    private Optional<Literal> researchPartners(final CSVRecord record) {
        return Optional.ofNullable(map(

                entry("mainly public entities", "Mainly with public entities"),
                entry("mainly private entities", "Mainly with private entities"),
                entry("both public and private entities", "Both to the same extent")

        ).get(normalize(record.get(col("AI")))));
    }

    private Stream<Literal> researchArea(final CSVRecord record) {
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

    private Stream<Literal> researchRelation(final CSVRecord record) {
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

    private Stream<Frame> researchRelationQuality(final CSVRecord record) {

        final String id=normalize(record.get(col("A")));

        return Map

                .ofEntries(

                        entry("BG", "universities and research entities"),
                        entry("BH", "innovative start-ups"),
                        entry("BI", "local and regional authorities"),
                        entry("BJ", "venture capital, sponsors"),
                        entry("BK", "incumbent firms"),
                        entry("BL", "service organizations"),
                        entry("BM", "citizen science entities")

                )

                .entrySet()
                .stream()

                .flatMap(entry -> Optional.of(normalize(record.get(col(entry.getKey()))))

                        .filter(v -> v.matches("\\d+"))
                        .map(Integer::valueOf)

                        .map(v -> frame(
                                field(ID, iri(Context, format("%s/%s", id, md5()))),
                                field(RDF.SUBJECT, literal(entry.getValue())),
                                field(RDF.VALUE, literal(v))
                        ))

                        .stream()
                );
    }

    private Stream<Literal> researchIssue(final CSVRecord record) {
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

    private Optional<Literal> researchProjects(final CSVRecord record) {
        return Optional.ofNullable(map(

                entry("1-3", "1-3"),
                entry("4-6", "4-6"),
                entry("7-10", "7-10"),
                entry("10+", "10+")

        ).get(normalize(record.get(col("BY")))));
    }

    private Optional<Literal> researchNetworks(final CSVRecord record) {
        return open(record, "BZ");
    }

    private Optional<Literal> researchRecruiting(final CSVRecord record) {
        return open(record, "CA");
    }

    private Stream<Literal> researchValorization(final CSVRecord record) {
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

    private Optional<Literal> researchCoverage(final CSVRecord record) {
        return open(record, "CF");
    }

    private Stream<Literal> researchDigitization(final CSVRecord record) {
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


    private Optional<Literal> citizenPartnerships(final CSVRecord record) {
        return Optional.ofNullable(map().get(normalize(record.get(col("CP")))));
    }

    private Stream<Literal> citizenPartners(final CSVRecord record) {
        return Stream

                .of(
                        entry("CQ", "individual citizens"),
                        entry("CR", "informal networks of citizens"),
                        entry("CS", "formal networks of citizens"),
                        entry("CT", "local communities"),
                        entry("CU", "local authorities"),
                        entry("CV", "regional communities"),
                        entry("CW", "regional authorities"),
                        entry("CX", "other")
                )

                .filter(entry -> Optional.of(normalize(record.get(col(entry.getKey()))))
                        .filter("yes"::equals)
                        .isPresent()
                )

                .map(entry -> literal(entry.getValue()));
    }

    private Stream<Literal> citizenInvolvement(final CSVRecord record) {
        return Stream

                .of(
                        entry("DO", "agenda setting"),
                        entry("DP", "policy formulation"),
                        entry("DQ", "decision making"),
                        entry("DR", "policy implementation"),
                        entry("DS", "policy evaluation"),
                        entry("DT", "other")
                )

                .filter(entry -> Optional.of(normalize(record.get(col(entry.getKey()))))
                        .filter(v -> "other".equals(entry.getValue()) ? !v.isEmpty() : "yes".equals(v))
                        .isPresent()
                )

                .map(entry -> literal(entry.getValue()));

    }

    private Stream<Literal> citizenStage(final CSVRecord record) {
        return Stream

                .of(
                        entry("DU", "consultation"),
                        entry("DV", "data collection"),
                        entry("DW", "data processing"),
                        entry("DX", "valorification of results"),
                        entry("DY", "dissemination and presentation of results"),
                        entry("DZ", "other")
                )

                .filter(entry -> Optional.of(normalize(record.get(col(entry.getKey()))))
                        .filter(v -> "other".equals(entry.getValue()) ? !v.isEmpty() : "yes".equals(v))
                        .isPresent()
                )

                .map(entry -> literal(entry.getValue()));

    }

    private Stream<Literal> citizenTarget(final CSVRecord record) {
        return Stream

                .of(
                        entry("EA", "societal"),
                        entry("EB", "economic"),
                        entry("EC", "environmental"),
                        entry("ED", "health"),
                        entry("EE", "policy making and practices"),
                        entry("EF", "access to science"),
                        entry("EG", "other")
                )

                .filter(entry -> Optional.of(normalize(record.get(col(entry.getKey()))))
                        .filter(v -> "other".equals(entry.getValue()) ? !v.isEmpty() : "yes".equals(v))
                        .isPresent()
                )

                .map(entry -> literal(entry.getValue()));

    }

    private Optional<Literal> citizenImpact(final CSVRecord record) {
        return Optional.ofNullable(map(

                entry("1", "1 - Very low"),
                entry("2", "2"),
                entry("3", "3"),
                entry("4", "4"),
                entry("5", "5"),
                entry("6", "6 - Very high")

        ).get(normalize(record.get(col("EH")))));
    }

    private Optional<Literal> citizenProjects(final CSVRecord record) {
        return Optional.ofNullable(map(

                entry("0-2", "0-2"),
                entry("0-2", "o-2"),
                entry("3-5", "3-5"),
                entry("3-6", "3-6"),
                entry("4-5", "4-5"),
                entry("5", "5"),
                entry("over 5", "over 5")

        ).get(normalize(record.get(col("EI")))));
    }

    private Optional<Literal> citizenExperience(final CSVRecord record) {
        return Optional.ofNullable(map(

                entry("0-3", "0-3"),
                entry("3-5", "3-5"),
                entry("5-7", "5-7"),
                entry("over 7", "over 7")

        ).get(normalize(record.get(col("EJ")))));
    }

    private Optional<Literal> citizenBudget(final CSVRecord record) {
        return Optional.ofNullable(map(

                entry("0-20%", "0-20%"),
                entry("21-40%", "21-40%"),
                entry("41-60%", "41-60%"),
                entry("61-80%", "61-80%"),
                entry("81-100%", "81-100%")

        ).get(normalize(record.get(col("EK")))));
    }

    private Stream<Literal> citizenFunding(final CSVRecord record) {
        return Stream

                .of(
                        entry("EL", "self finance"),
                        entry("EM", "private donation"),
                        entry("EN", "participant/membership fees"),
                        entry("EO", "national funding scheme"),
                        entry("EP", "european commission"),
                        entry("EQ", "other")
                )

                .filter(entry -> Optional.of(normalize(record.get(col(entry.getKey()))))
                        .filter(v -> "other".equals(entry.getValue()) ? !v.isEmpty() : "yes".equals(v))
                        .isPresent()
                )

                .map(entry -> literal(entry.getValue()));

    }

    private Optional<Literal> citizenNetwork(final CSVRecord record) {
        return Optional.ofNullable(map().get(normalize(record.get(col("ER")))));
    }

    private Optional<Literal> citizenNetworkSize(final CSVRecord record) {
        return Optional.ofNullable(map(

                entry("0", "0"),
                entry("1", "1"),
                entry("2", "2"),
                entry("3", "3"),
                entry("4", "4"),
                entry("5", "5"),
                entry("25", "25"),
                entry("over 5", "over 5"),
                entry("over 10", "over 10")

        ).get(normalize(record.get(col("ES")))));
    }

    private Optional<Literal> citizenNetworkSample(final CSVRecord record) {
        return open(record, "ET");
    }

    private Stream<Literal> citizenExpertise(final CSVRecord record) {
        return Stream

                .of(
                        entry("EU", "without expertise in the project areas"),
                        entry("EV", "partially trained in the project areas"),
                        entry("EW", "trained in the project areas"),
                        entry("EX", "self-trained in the project areas"),
                        entry("EY", "i don't know/no opinion"),
                        entry("EZ", "other")
                )

                .filter(entry -> Optional.of(normalize(record.get(col(entry.getKey()))))
                        .filter(v -> "other".equals(entry.getValue()) ? !v.isEmpty() : "yes".equals(v))
                        .isPresent()
                )

                .map(entry -> literal(entry.getValue()));
    }

    private Stream<Literal> citizenIssues(final CSVRecord record) {
        return Stream

                .of(
                        entry("FA", "political willingness/immaturity"),
                        entry("FB", "distrust culture"),
                        entry("FC", "skepticism and opposition"),
                        entry("FD", "legal issues"),
                        entry("FE", "overregulation"),
                        entry("FF", "funding and resources"),
                        entry("FG", "education"),
                        entry("FH", "technology"),
                        entry("FI", "none"),
                        entry("FJ", "other")
                )

                .filter(entry -> Optional.of(normalize(record.get(col(entry.getKey()))))
                        .filter(v -> "other".equals(entry.getValue()) ? !v.isEmpty() : "yes".equals(v))
                        .isPresent()
                )

                .map(entry -> literal(entry.getValue()));
    }

    private Optional<Literal> citizenRecruiting(final CSVRecord record) {
        return open(record, "FK");
    }

    private Optional<Literal> citizenRewarding(final CSVRecord record) {
        return open(record, "FL");
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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


    private static Optional<Literal> open(final CSVRecord record, final String col) {
        return Optional.of(normalize(record.get(col(col))))
                .filter(not(String::isEmpty))
                .map(Frame::literal);
    }

    private static Optional<Literal> other(final String value) {
        return Optional.ofNullable(value)
                .filter(not(String::isEmpty))
                .map(v -> literal("other"));
    }

}
