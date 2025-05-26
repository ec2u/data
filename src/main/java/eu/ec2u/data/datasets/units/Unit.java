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

package eu.ec2u.data.datasets.units;

import com.metreeca.flow.Xtream;
import com.metreeca.flow.json.actions.Validate;
import com.metreeca.flow.text.services.Translator;
import com.metreeca.mesh.meta.jsonld.Class;
import com.metreeca.mesh.meta.jsonld.Forward;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Namespace;

import eu.ec2u.data.datasets.Reference;
import eu.ec2u.data.datasets.organizations.Organization;
import eu.ec2u.data.datasets.persons.Person;
import eu.ec2u.data.datasets.taxonomies.Taxonomies.Matcher;
import eu.ec2u.data.datasets.taxonomies.Topic;
import eu.ec2u.data.vocabularies.org.OrgOrganizationalUnit;
import eu.ec2u.work.ai.Embedder;

import java.util.Locale;
import java.util.Optional;
import java.util.Set;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.text.services.Translator.translator;
import static com.metreeca.shim.Collections.map;
import static com.metreeca.shim.Collections.set;
import static com.metreeca.shim.URIs.uri;

import static eu.ec2u.data.datasets.Localized.EN;
import static eu.ec2u.data.datasets.Resource.localize;
import static eu.ec2u.data.datasets.organizations.Organizations.EC2U;
import static eu.ec2u.data.datasets.taxonomies.TopicsEC2UOrganizations.EC2U_ORGANIZATIONS;
import static eu.ec2u.data.datasets.taxonomies.TopicsEC2UOrganizations.VIRTUAL_INSTITUTE;
import static eu.ec2u.data.datasets.taxonomies.TopicsEuroSciVoc.EUROSCIVOC;
import static eu.ec2u.data.datasets.units.Units.UNITS;
import static java.util.Locale.ROOT;
import static java.util.Map.entry;
import static java.util.function.Predicate.not;

@Frame
@Class
@Namespace("[ec2u]")
@Namespace(prefix="dct", value="http://purl.org/dc/terms/")
public interface Unit extends Organization, OrgOrganizationalUnit {

    UnitFrame GLADE=new UnitFrame()
            .id(UNITS.id().resolve("glade"))
            .prefLabel(map(entry(EN, "Virtual Institute for Good Health and Well‑Being")))
            .altLabel(map(entry(ROOT, "GLADE")))
            .definition(map(entry(EN, """
                    GLADE is the EC2U Alliance’s Virtual Institute aimed to develop specific approaches in education,
                    research, innovation and service transfer to the community in areas of the third UNSDG: Good
                    Health and Well-being for All.
                    
                    The Virtual Institute GLADE is the headquarter for:
                    
                    - EC2U Glade Literacy LAB that encourages itinerant conferences of EC2U specialists, Summer Schools
                    and short video trainings in the area of good health and well-being for all;
                    - EC2U GLADE Transformative Research HUB that initiates and supports studies, guidelines for local
                    authorities, policy paperspolicy papers on Good Health and Well-being;
                    - EC2U GLADE Healthy Campus Services that focuses on a brand new approach of Health in Campuses.
                    
                    The main objective of the GLADE Virtual Institute is to develop cooperation’s contexts for
                    promoting health and well-being in the 7 EC2U universities and their cities.
                    """
            )))
            .homepage(set(uri("https://ec2u.eu/virtual-institutes-staff/glade-for-researchers-staff/")))
            .unitOf(set(EC2U))
            .classification(set(VIRTUAL_INSTITUTE));

    UnitFrame VIQE=new UnitFrame()
            .id(UNITS.id().resolve("viqe"))
            .prefLabel(map(entry(EN, "Virtual Institute for Quality Education")))
            .altLabel(map(entry(ROOT, "VIQE")))
            .definition(map(entry(EN, """
                    Virtual Institutes are a completely new way of approaching and solving a given challenge. The
                    VIQE, Virtual Institue for Quality Edication combines education, research and innovation for
                    advanced studies in quality education.
                    
                    In practice, VIQE will carry out the following activities:
                    
                    - Language Policy Research Project
                    - Research Seed Mobility Programme on Language and Cultural Diversity
                    - Joint PhD training activities for the existing PhD programmes on European languages and
                      cultures.
                    """
            )))
            .homepage(set(uri("https://ec2u.eu/virtual-institutes-staff/virtual-institute-for-quality-education-viqe/")))
            .unitOf(set(EC2U))
            .classification(set(VIRTUAL_INSTITUTE));

    UnitFrame VISCC=new UnitFrame()
            .id(UNITS.id().resolve("viscc"))
            .prefLabel(map(entry(EN, "Virtual Institute for Sustainable Cities and Communities")))
            .altLabel(map(entry(ROOT, "VISCC")))
            .definition(map(entry(EN, """
                    The Virtual Institute for Sustainable Cities and Communities (VISCC) aims at bringing together
                    research, education and innovation, and outreaching in the field of the United Nation’s
                    sustainable development goal n°11: “Sustainable Cities and Communities”.
                    
                    The VISCC carries out scientific activities that promote interdisciplinarity, collaborative work
                    and mobility between the EC2U Partner Universities, the cities and the citizens.
                    
                    What does the VISCC offer?
                    
                    - A Joint Master Degree in Sustainable Cities and Communities (more info)
                    - PhD training activities and thesis projects in co-supervision
                    - Online courses
                    - Winter and Summer Schools
                    - Research projects
                    """
            )))
            .homepage(set(uri("https://ec2u.eu/virtual-institutes-staff/virtual-institute-for-sustainable-cities-and-communities/")))
            .unitOf(set(EC2U))
            .classification(set(VIRTUAL_INSTITUTE));

    UnitFrame VIPJSI=new UnitFrame()
            .id(UNITS.id().resolve("vipjsi"))
            .prefLabel(map(entry(EN, "Virtual Institute for Peace, Justice and Strong Institutions")))
            .altLabel(map(entry(ROOT, "VIPJSI")))
            .definition(map(entry(EN, """
                    The Virtual Institute for Peace, Justice and Strong Institutions (VIPJSI) carries out scientific
                    activities that promote interdisciplinarity, collaborative work and mobility between the EC2U
                    Partner Universities, the cities and the citizens.
                    
                    The VIPJSI aims at bringing together interdisciplinary research, education and innovation, and
                    outreaching in the field of the United Nation’s Sustainable Development Goal #16: Promote
                    peaceful and inclusive societies for sustainable development, provide access to justice for all
                    and build effective, accountable and inclusive institutions at all levels.
                    
                    Our research deals with current questions regarding Peace, Justice and Strong Institutions in
                    Europe from different points of view: law, politics, history and ethics.
                    
                    The VIPJSI offers:
                    
                    - A Joint Master Program in Peace, Justice and Good Governance (starting 2027)
                    - PhD training activities and thesis projects in co-supervision (starting 2025)
                    - Online courses
                    - Winter and Summer Schools
                    - Thinktanks & Conferences (starting 2025: Conference on Solidarity in Pavia in Spring and in Jena
                      in autumn)
                    """
            )))
            .homepage(set(uri("https://ec2u.eu/virtual-institutes-staff/virtual-institute-for-peace-justice-and-strong-institutions/")))
            .unitOf(set(EC2U))
            .classification(set(VIRTUAL_INSTITUTE));


    Set<UnitFrame> VIS=set(
            GLADE,
            VIQE,
            VISCC,
            VIPJSI
    );


    static Optional<UnitFrame> vi(final String code) {
        return VIS.stream()
                .filter(vi -> code.equalsIgnoreCase(vi.altLabel().get(ROOT)))
                .findFirst();
    }


    static Optional<UnitFrame> review(final UnitFrame unit) {

        if ( unit == null ) {
            throw new NullPointerException("null unit");
        }

        return Optional.of(unit) // translate before English-based classification
                .map(u -> localize(u, locale -> translate(u, locale)))
                .map(Unit::classify)
                .flatMap(new Validate<>());
    }


    private static UnitFrame translate(final UnitFrame unit, final Locale source) {

        final Translator translator=service(translator());

        return unit // translate also customized labels/comments ;(translated text must be clipped again)
                .label(Reference.label(translator.texts(unit.label(), source, EN)))
                .comment(Reference.comment(translator.texts(unit.comment(), source, EN)))
                .prefLabel(translator.texts(unit.prefLabel(), source, EN))
                .altLabel(translator.texts(unit.altLabel(), source, EN))
                .definition(translator.texts(unit.definition(), source, EN));
    }

    private static UnitFrame classify(final UnitFrame unit) {
        return unit.subject(Optional.of(unit.subject()).filter(not(Set::isEmpty)).orElseGet(() -> set(euroscivoc()
                .apply(embeddable(unit))
                .limit(3)
        )));
    }

    private static String embeddable(final Unit unit) {
        return Embedder.embeddable(set(Xtream.from(
                Optional.ofNullable(unit.prefLabel().get(EN)).stream(),
                Optional.ofNullable(unit.altLabel().get(EN)).stream(),
                Optional.ofNullable(unit.definition().get(EN)).stream()
        )));
    }


    static Matcher organizations() {
        return new Matcher(EC2U_ORGANIZATIONS)
                .threshold(0.75);
    }

    static Matcher euroscivoc() {
        return new Matcher(EUROSCIVOC)
                .narrowing(1.1)
                .tolerance(0.1);
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    default Units dataset() {
        return UNITS;
    }

    @Override
    Set<? extends Organization> unitOf();


    @Forward("dct:")
    Set<Topic> subject();


    //̸// !!! Factor on Organization ///////////////////////////////////////////////////////////////////////////////////

    @Override
    Set<Topic> classification();


    @Override
    Set<? extends Organization> subOrganizationOf();

    @Override
    Set<? extends Organization> hasSubOrganization();

    @Override
    Set<? extends Unit> hasUnit();


    @Override
    Set<? extends Person> hasHead();

    @Override
    Set<? extends Person> hasMember();

}
