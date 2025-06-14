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

package eu.ec2u.data.datasets.universities;

import com.metreeca.flow.json.actions.Validate;
import com.metreeca.mesh.meta.jsonld.*;
import com.metreeca.mesh.meta.jsonld.Class;
import com.metreeca.mesh.meta.shacl.MinCount;
import com.metreeca.mesh.meta.shacl.Required;
import com.metreeca.shim.URIs;

import eu.ec2u.data.datasets.GeoReference;
import eu.ec2u.data.datasets.Reference;
import eu.ec2u.data.datasets.organizations.Organization;
import eu.ec2u.data.datasets.persons.Person;
import eu.ec2u.data.datasets.taxonomies.Topic;
import eu.ec2u.data.datasets.units.Unit;
import eu.ec2u.data.vocabularies.org.OrgFormalOrganization;

import java.net.URI;
import java.time.Year;
import java.time.ZoneId;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static com.metreeca.shim.Collections.*;
import static com.metreeca.shim.URIs.uri;

import static eu.ec2u.data.datasets.Localized.*;
import static eu.ec2u.data.datasets.organizations.Organizations.EC2U;
import static eu.ec2u.data.datasets.universities.Universities.UNIVERSITIES;

@Frame
@Class
@Namespace("[ec2u]")
public interface University extends Organization, GeoReference, OrgFormalOrganization {

    UniversityFrame COIMBRA=new UniversityFrame()
            .id(UNIVERSITIES.id().resolve("coimbra"))
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

    UniversityFrame IASI=new UniversityFrame()
            .id(UNIVERSITIES.id().resolve("iasi"))
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

    UniversityFrame JENA=new UniversityFrame()
            .id(UNIVERSITIES.id().resolve("jena"))
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

    UniversityFrame LINZ=new UniversityFrame()
            .id(UNIVERSITIES.id().resolve("linz"))
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

    UniversityFrame PAVIA=new UniversityFrame()
            .id(UNIVERSITIES.id().resolve("pavia"))
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

    UniversityFrame POITIERS=new UniversityFrame()
            .id(UNIVERSITIES.id().resolve("poitiers"))
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

    UniversityFrame SALAMANCA=new UniversityFrame()
            .id(UNIVERSITIES.id().resolve("salamanca"))
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

    UniversityFrame TURKU=new UniversityFrame()
            .id(UNIVERSITIES.id().resolve("turku"))
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

    UniversityFrame UMEA=new UniversityFrame()
            .id(UNIVERSITIES.id().resolve("umea"))
            .prefLabel(map(
                    entry(EN, "Umeå University"),
                    entry(SV, "Umeå universitet")
            ))
            .altLabel(map(
                    entry(EN, "Umeå"),
                    entry(SV, "Umeå")
            ))
            .definition(map(
                    entry(EN, """
                            Umeå University is a comprehensive university with around 38,000 students and 4,600 \
                            staff. It offers over 40 undergraduate and Master’s degree programmes in a wide range of \
                            academic fields, including science and technology, the social sciences, business, health \
                            and medicine, and the arts and humanities. In total, the university provides 150 study \
                            programmes and 1,800 courses. The international students at Umeå University have bestowed \
                            the institution with outstanding ratings across various categories in the International \
                            Student Barometer (ISB). Umeå University has been ranked first of all participating \
                            universities in the world for student satisfaction, living and support.""")
            ))
            .homepage(set(
                    uri("https://www.umu.se/en"),
                    uri("https://www.umu.se")
            ))
            .depiction(set(
                    uri("/blobs/umea.png")
            ))
            .seeAlso(set(
                    uri("http://www.wikidata.org/entity/Q1144565")
            ))
            .locale(SV)
            .zone(ZoneId.of("Europe/Stockholm"));


    Set<UniversityFrame> PARTNERS=set(
            COIMBRA,
            IASI,
            JENA,
            LINZ,
            PAVIA,
            POITIERS,
            SALAMANCA,
            TURKU,
            UMEA
    );


    static String uuid(final University university, final String name) {

        if ( university == null ) {
            throw new NullPointerException("null university");
        }

        if ( name == null ) {
            throw new NullPointerException("null name");
        }

        return URIs.uuid(university.id()+"@"+name);
    }

    static Optional<UniversityFrame> review(final UniversityFrame university) {

        if ( university == null ) {
            throw new NullPointerException("null university");
        }

        return Optional.of(university)
                .flatMap(new Validate<>());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override default Map<Locale, String> label() {
        return Reference.label(
                altLabel(),
                prefLabel()
        );
    }


    @Override
    default Universities dataset() {
        return UNIVERSITIES;
    }

    @Override
    default Set<Organization> subOrganizationOf() { return set(EC2U); }


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
    @Embedded
    GeoReference city();

    @Required
    @Embedded
    GeoReference country();


    @Internal
    Locale locale();

    @Internal
    ZoneId zone();


    //̸// !!! Factor on Organization ///////////////////////////////////////////////////////////////////////////////////

    @Override
    Set<Topic> classification();


    @Override
    Set<? extends Organization> hasSubOrganization();

    @Override
    Set<? extends Unit> hasUnit();


    @Override
    Set<? extends Person> hasHead();

    @Override
    Set<? extends Person> hasMember();

}
