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

package eu.ec2u.data.universities;

import com.metreeca.flow.handlers.Delegator;
import com.metreeca.flow.handlers.Worker;
import com.metreeca.flow.json.actions.Validate;
import com.metreeca.flow.json.handlers.Driver;
import com.metreeca.flow.lod.actions.Wikidata;
import com.metreeca.flow.rdf4j.actions.GraphQuery;
import com.metreeca.flow.rdf4j.services.Graph;
import com.metreeca.flow.work.Xtream;
import com.metreeca.mesh.Value;
import com.metreeca.mesh.meta.jsonld.Class;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Internal;
import com.metreeca.mesh.meta.jsonld.Namespace;
import com.metreeca.mesh.meta.shacl.MinCount;
import com.metreeca.mesh.meta.shacl.Required;
import com.metreeca.mesh.util.Locales;
import com.metreeca.mesh.util.URIs;

import eu.ec2u.data.datasets.Dataset;
import eu.ec2u.data.organizations.OrgFormalOrganization;
import eu.ec2u.data.organizations.OrgOrganization;
import eu.ec2u.data.resources.GeoReference;
import eu.ec2u.data.resources.GeoReferenceFrame;
import eu.ec2u.data.resources.Resource;
import eu.ec2u.work.Rover;
import org.eclipse.rdf4j.repository.sparql.SPARQLRepository;

import java.net.URI;
import java.time.Year;
import java.time.ZoneId;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.toolkits.Resources.resource;
import static com.metreeca.flow.toolkits.Resources.text;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.tools.Store.Options.DEEP;
import static com.metreeca.mesh.tools.Store.Options.FORCE;
import static com.metreeca.mesh.util.Collections.*;
import static com.metreeca.mesh.util.Strings.fill;
import static com.metreeca.mesh.util.URIs.term;
import static com.metreeca.mesh.util.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.EC2U;
import static eu.ec2u.data.resources.Localized.*;
import static eu.ec2u.work.Rover.rover;
import static java.util.stream.Collectors.joining;

@Frame
@Class
@Namespace("[ec2u]")
public interface University extends Resource, GeoReference, OrgFormalOrganization {

    UniversityFrame COIMBRA=Coimbra();
    UniversityFrame IASI=Iasi();
    UniversityFrame JENA=Jena();
    UniversityFrame LINZ=Linz();
    UniversityFrame PAVIA=Pavia();
    UniversityFrame POITIERS=Poitiers();
    UniversityFrame SALAMANCA=Salamanca();
    UniversityFrame TURKU=Turku();

    Set<UniversityFrame> UNIVERSITIES=set(
            COIMBRA,
            IASI,
            JENA,
            LINZ,
            PAVIA,
            POITIERS,
            SALAMANCA,
            TURKU
    );


    private static UniversityFrame Coimbra() {
        return new UniversityFrame()
                .id(eu.ec2u.data.universities.Universities.UNIVERSITIES.resolve("coimbra"))
                .prefLabel(map(
                        entry(EN, "University of Coimbra"),
                        entry(PT, "Universidade de Coimbra")
                ))
                .altLabel(map(
                        entry(EN, "Coimbra"),
                        entry(PT, "Coimbra")
                ))
                .definition(map(
                        entry(EN, """
                                Focused on the future and recognized as major promoter of change, the University of \
                                Coimbra has more than 7 centuries of experience in the creation and dissemination of \
                                knowledge, culture, science and technology through study, teaching, cutting-edge \
                                research and innovation in the most diverse areas of knowledge."""
                        )
                ))
                .homepage(set(
                        uri("https://www.uc.pt/en/"),
                        uri("https://www.uc.pt/pt")
                ))
                .depiction(set(
                        uri("/blobs/coimbra.png")
                ))
                .seeAlso(set(
                        uri("http://www.wikidata.org/entity/Q368643")
                ))
                .locale(PT)
                .zone(ZoneId.of("Europe/Lisbon"));
    }

    private static UniversityFrame Iasi() {
        return new UniversityFrame()
                .id(eu.ec2u.data.universities.Universities.UNIVERSITIES.resolve("iasi"))
                .prefLabel(map(
                        entry(EN, "Alexandru Ioan Cuza University of Iaşi"),
                        entry(RO, "Universitatea Alexandru Ioan Cuza din Iași")
                ))
                .altLabel(map(
                        entry(EN, "Iași"),
                        entry(RO, "Iași")
                ))
                .definition(map(
                        entry(EN, """
                                Alexandru Ioan Cuza University of Iași, the first modern university founded in Romania \
                                (in 1860), is constantly ranked 1 – 3 among Romanian universities in terms of \
                                research, education and institutional transparency. With about 23000 students and 2000 \
                                full-time staff in its 15 faculties, our university's academic offer includes 80 \
                                degrees at bachelor level (4 in English, 1 in French), 116 master level programmes \
                                (14 in English, 1 in French) and 27 fields of study at the doctoral level (all offered \
                                in English as well)."""
                        )
                ))
                .homepage(set(
                        uri("https://www.uaic.ro/en/"),
                        uri("https://www.uaic.ro/")
                ))
                .depiction(set(
                        uri("/blobs/iasi.png")
                ))
                .seeAlso(set(
                        uri("http://www.wikidata.org/entity/Q1523902")
                ))
                .locale(RO)
                .zone(ZoneId.of("Europe/Bucharest"));
    }

    private static UniversityFrame Jena() {
        return new UniversityFrame()
                .id(eu.ec2u.data.universities.Universities.UNIVERSITIES.resolve("jena"))
                .prefLabel(map(
                        entry(EN, "Friedrich Schiller University Jena"),
                        entry(DE, "Friedrich-Schiller-Universität Jena")
                ))
                .altLabel(map(
                        entry(EN, "Jena"),
                        entry(DE, "Jena")
                ))
                .definition(map(
                        entry(EN, """
                                Founded in 1558, the Friedrich Schiller University Jena is one of the oldest \
                                universities in Germany. Once the centre of German philosophical thought, it has \
                                become a broad-based, research-intensive institution with a global reach and a \
                                thriving international community of more than 18,000 undergraduate and postgraduate \
                                students from over 110 countries worldwide."""
                        )
                ))
                .homepage(set(
                        uri("https://www.uni-jena.de/en"),
                        uri("https://www.uni-jena.de/")
                ))
                .depiction(set(
                        uri("/blobs/jena.png")
                ))
                .seeAlso(set(
                        uri("http://www.wikidata.org/entity/Q154561")
                ))
                .locale(DE)
                .zone(ZoneId.of("Europe/Berlin"));
    }

    private static UniversityFrame Linz() {
        return new UniversityFrame()
                .id(eu.ec2u.data.universities.Universities.UNIVERSITIES.resolve("linz"))
                .prefLabel(map(
                        entry(EN, "Johannes Kepler University Linz (JKU)"),
                        entry(DE, "Johannes Kepler Universität Linz (JKU)")
                ))
                .altLabel(map(
                        entry(EN, "Linz"),
                        entry(DE, "Linz")
                ))
                .definition(map(
                        entry(EN, """
                                The Johannes Kepler University Linz (JKU), with 24,000 students, offers diverse \
                                programs in law, business, social sciences, engineering, natural sciences, and \
                                medicine. It prioritizes impactful research in AI, medical tech, and sustainable \
                                polymers, with a focus on social and environmental responsibility. The university \
                                aims for climate neutrality by 2030 and actively engages students in groundbreaking \
                                endeavors, fostering a passion for shaping the future."""
                        )
                ))
                .homepage(set(
                        uri("https://www.jku.at/en"),
                        uri("https://www.jku.at")
                ))
                .depiction(set(
                        uri("/blobs/linz.png")
                ))
                .seeAlso(set(
                        uri("http://www.wikidata.org/entity/Q682739")
                ))
                .locale(DE)
                .zone(ZoneId.of("Europe/Vienna"));
    }

    private static UniversityFrame Pavia() {
        return new UniversityFrame()
                .id(eu.ec2u.data.universities.Universities.UNIVERSITIES.resolve("pavia"))
                .prefLabel(map(
                        entry(EN, "University of Pavia"),
                        entry(IT, "Università di Pavia")
                ))
                .altLabel(map(
                        entry(EN, "Pavia"),
                        entry(IT, "Pavia")
                ))
                .definition(map(
                        entry(EN, """
                                The University of Pavia (UNIPV) is one of the world's oldest academic institutions: \
                                it was founded in 1361 and until the 20th century it was the only University in the \
                                Milan Area and the region of Lombardy."""
                        )
                ))
                .homepage(set(
                        uri("https://web-en.unipv.it"),
                        uri("https://portale.unipv.it/it")
                ))
                .depiction(set(
                        uri("/blobs/pavia.png")
                ))
                .seeAlso(set(
                        uri("http://www.wikidata.org/entity/Q219317")
                ))
                .locale(IT)
                .zone(ZoneId.of("Europe/Rome"));
    }

    private static UniversityFrame Poitiers() {
        return new UniversityFrame()
                .id(eu.ec2u.data.universities.Universities.UNIVERSITIES.resolve("poitiers"))
                .prefLabel(map(
                        entry(EN, "University of Poitiers"),
                        entry(FR, "Université de Poitiers")
                ))
                .altLabel(map(
                        entry(EN, "Poitiers"),
                        entry(FR, "Poitiers")
                ))
                .definition(map(
                        entry(EN, """
                                Founded in 1431, the University of Poitiers is a multidisciplinary university which \
                                enrols 29,000 students, 4200 of which are international students from 120 different \
                                countries, supervised by 2700 staff members (administrative, teaching staff and \
                                researchers). Poitiers ranks 2nd in the overall ranking of major student cities in \
                                France in 2018-2019 and is above the national average with 16% of foreign students."""
                        )
                ))
                .homepage(set(
                        uri("https://www.univ-poitiers.fr/en/"),
                        uri("https://www.univ-poitiers.fr")
                ))
                .depiction(set(
                        uri("/blobs/poitiers.png")
                ))
                .seeAlso(set(
                        uri("http://www.wikidata.org/entity/Q661056")
                ))
                .locale(FR)
                .zone(ZoneId.of("Europe/Paris"));
    }

    private static UniversityFrame Salamanca() {
        return new UniversityFrame()
                .id(eu.ec2u.data.universities.Universities.UNIVERSITIES.resolve("salamanca"))
                .prefLabel(map(
                        entry(EN, "University of Salamanca"),
                        entry(ES, "Universidad de Salamanca")
                ))
                .altLabel(map(
                        entry(EN, "Salamanca"),
                        entry(ES, "Salamanca")
                ))
                .definition(map(
                        entry(EN, """
                                The University of Salamanca was founded in 1218 and is one of the three oldest \
                                universities in Europe, boasting a wide range of Faculties and Research Institutes \
                                in Sciences and Arts. In 2011, it was awarded the Campus of International Excellence \
                                status. It is the university of reference in its region and beyond (Castile and León) \
                                and the "Alma Mater" of nearly all historical Latin American universities."""
                        )
                ))
                .homepage(set(
                        uri("https://www.usal.es")
                ))
                .depiction(set(
                        uri("/blobs/salamanca.png")
                ))
                .seeAlso(set(
                        uri("http://www.wikidata.org/entity/Q308963")
                ))
                .locale(ES)
                .zone(ZoneId.of("Europe/Madrid"));
    }

    private static UniversityFrame Turku() {
        return new UniversityFrame()
                .id(eu.ec2u.data.universities.Universities.UNIVERSITIES.resolve("turku"))
                .prefLabel(map(
                        entry(EN, "University of Turku"),
                        entry(FI, "Turun Yliopisto")
                ))
                .altLabel(map(
                        entry(EN, "Turku"),
                        entry(FI, "Turku")
                ))
                .definition(map(
                        entry(EN, """
                                The University of Turku (UTU) is a renowned research institution with a diverse \
                                community of 25,000 individuals from over 100 countries. Situated in Turku's historic \
                                city center, it offers study and research options across seven faculties and special \
                                units. With its convenient campus, exceptional services, and vibrant academic \
                                environment, UTU ensures that international students and scholars feel welcomed and \
                                supported throughout their time in Finland.""")
                ))
                .homepage(set(
                        uri("https://www.utu.fi/en"),
                        uri("https://www.utu.fi/fi")
                ))
                .depiction(set(
                        uri("/blobs/turku.png")
                ))
                .seeAlso(set(
                        uri("http://www.wikidata.org/entity/Q501841")
                ))
                .locale(FI)
                .zone(ZoneId.of("Europe/Helsinki"));
    }


    static String uuid(final University university, final String name) {

        if ( university == null ) {
            throw new NullPointerException("null university");
        }

        if ( name == null ) {
            throw new NullPointerException("null name");
        }

        return URIs.uuid(university.id()+"@"+name);
    }


    static void main(final String... args) {
        exec(() -> exec(() -> {

            final Rover wikidata=rover(Stream.of(text(resource(University.class, ".qlt")))

                    .map(query -> fill(query, map(

                            entry("universities", UNIVERSITIES.stream()
                                    .map(u -> u.seeAlso().stream().findFirst().orElseThrow())
                                    .map("<%s>"::formatted)
                                    .collect(joining("\n"))
                            ),

                            entry("languages", LANGUAGES.stream()
                                    .map(Locales::locale)
                                    .map("\"%s\""::formatted)
                                    .collect(joining(", "))
                            )

                    )))

                    .flatMap(new GraphQuery()
                            .graph(new Graph(new SPARQLRepository("https://query.wikidata.org/sparql")))
                    )

                    .toList()
            );

            final Value update=array(list(Xtream.from(UNIVERSITIES)

                    .map(university -> {

                        final Rover focus=wikidata.focus(university.seeAlso().stream().findFirst().orElseThrow());
                        final Rover city=focus.get(term("city"));
                        final Rover country=focus.get(term("country"));

                        final Optional<Wikidata.Point> coordinates=focus
                                .get(term("coordinates"))
                                .lexical()
                                .flatMap(Wikidata::point);

                        final Optional<Wikidata.Point> cityCoordinates=city
                                .get(term("coordinates"))
                                .lexical()
                                .flatMap(Wikidata::point);

                        final Optional<Wikidata.Point> countyCoordinates=country
                                .get(term("coordinates"))
                                .lexical()
                                .flatMap(Wikidata::point);

                        return university
                                .students(focus.get(term("students")).integral().map(Long::intValue).orElse(0))
                                .inception(focus.get(term("inception")).year().orElse(null))
                                .longitude(coordinates.map(Wikidata.Point::longitude).orElse(0.0D))
                                .latitude(coordinates.map(Wikidata.Point::latitude).orElse(0.0D))
                                .city(new GeoReferenceFrame()
                                        .id(city.uri().orElse(null))
                                        .label(city.get(term("name")).texts().orElse(null))
                                        .longitude(cityCoordinates.map(Wikidata.Point::longitude).orElse(0.0D))
                                        .latitude(cityCoordinates.map(Wikidata.Point::latitude).orElse(0.0D))
                                )
                                .country(new GeoReferenceFrame()
                                        .id(country.uri().orElse(null))
                                        .label(country.get(term("name")).texts().orElse(null))
                                        .longitude(countyCoordinates.map(Wikidata.Point::longitude).orElse(0.0D))
                                        .latitude(coordinates.map(Wikidata.Point::latitude).orElse(0.0D))
                                );
                    })

                    .optMap(new Validate<>())

            ));

            service(store()).partition(eu.ec2u.data.universities.Universities.UNIVERSITIES).update(update, FORCE, DEEP);

        }));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    default Dataset dataset() { return new UniversitiesFrame(); }

    @Override
    default Set<OrgOrganization> subOrganizationOf() { return set(EC2U); }


    @Required
    @Override
    Set<URI> depiction();

    @MinCount(1)
    @Override
    Set<URI> homepage();

    @Required
    Year inception();

    @Required
    int students();

    @Required
    GeoReference city();

    @Required
    GeoReference country();


    @Internal
    Locale locale();

    @Internal
    ZoneId zone();


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    final class Handler extends Delegator {

        public Handler() {
            delegate(new Worker().get(new Driver(new UniversityFrame()
                    .inception(null) // !!!
                    .students(0))));
        }

    }

}