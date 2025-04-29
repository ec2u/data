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

package eu.ec2u.data.units;

import com.metreeca.flow.handlers.Delegator;
import com.metreeca.flow.handlers.Worker;
import com.metreeca.flow.json.actions.Validate;
import com.metreeca.flow.json.handlers.Driver;
import com.metreeca.flow.services.Translator;
import com.metreeca.flow.work.Xtream;
import com.metreeca.mesh.meta.jsonld.Class;
import com.metreeca.mesh.meta.jsonld.Forward;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Namespace;

import eu.ec2u.data.datasets.Dataset;
import eu.ec2u.data.organizations.OrgOrganizationalUnit;
import eu.ec2u.data.resources.Resource;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.taxonomies.Topic;
import eu.ec2u.data.taxonomies.TopicFrame;
import eu.ec2u.work.ai.Embedder;

import java.util.Locale;
import java.util.Optional;
import java.util.Set;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.services.Translator.translator;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.tools.Store.Options.FORCE;
import static com.metreeca.mesh.util.Collections.*;
import static com.metreeca.mesh.util.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.EC2U;
import static eu.ec2u.data.resources.Localized.EN;
import static eu.ec2u.data.taxonomies.EuroSciVoc.EUROSCIVOC;
import static eu.ec2u.data.taxonomies.OrganizationTypes.VIRTUAL_INSTITUTE;
import static eu.ec2u.data.units.Units.SUBJECT_THRESHOLD;
import static eu.ec2u.data.units.Units.UNITS;
import static java.util.Locale.ROOT;
import static java.util.Map.entry;

@Frame
@Class
@Namespace("[ec2u]")
@Namespace(prefix="dct", value="http://purl.org/dc/terms/")
public interface Unit extends Resource, OrgOrganizationalUnit {

    static UnitFrame GLADE() {
        return new UnitFrame()
                .id(UNITS.resolve("glade"))
                .identifier("GLADE")
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
    }

    static UnitFrame VIQE() {
        return new UnitFrame()
                .id(UNITS.resolve("viqe"))
                .identifier("VIQE")
                .prefLabel(map(entry(EN, "Virtual Institute for Quality Education")))
                .altLabel(map(entry(EN, "VIQE")))
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
    }

    static UnitFrame VISCC() {
        return new UnitFrame()
                .id(UNITS.resolve("viscc"))
                .identifier("VISCC")
                .prefLabel(map(entry(EN, "Virtual Institute for Sustainable Cities and Communities")))
                .altLabel(map(entry(EN, "VISCC")))
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
    }

    static UnitFrame VIPJSI() {
        return new UnitFrame()
                .id(UNITS.resolve("vipjsi"))
                .identifier("VIPJSI")
                .prefLabel(map(entry(EN, "Virtual Institute for Peace, Justice and Strong Institutions")))
                .altLabel(map(entry(EN, "VIPJSI")))
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
    }


    static UnitFrame refine(final UnitFrame unit, final Locale source) {

        if ( unit == null ) {
            throw new NullPointerException("null unit");
        }

        if ( source == null ) {
            throw new NullPointerException("null source");
        }

        return Optional.of(unit)
                .map(u -> translate(u, source))
                .map(Unit::classify)
                .orElse(unit);
    }


    private static UnitFrame translate(final UnitFrame unit, final Locale source) {

        final Translator translator=service(translator());

        return unit
                .prefLabel(translator.texts(unit.prefLabel(), source, EN))
                .altLabel(translator.texts(unit.altLabel(), source, EN))
                .definition(translator.texts(unit.definition(), source, EN));
    }

    private static UnitFrame classify(final UnitFrame unit) {
        return unit.subject().isEmpty() ? unit.subject(set(Resources
                .match(EUROSCIVOC, embeddable(unit), SUBJECT_THRESHOLD)
                .map(uri -> new TopicFrame(true).id(uri))
                .limit(1)
        )) : unit;
    }

    private static String embeddable(final Unit unit) {
        return Embedder.embeddable(Xtream.from(
                Optional.ofNullable(unit.prefLabel().get(EN)).stream(),
                Optional.ofNullable(unit.altLabel().get(EN)).stream(),
                Optional.ofNullable(unit.definition().get(EN)).stream()
        ));
    }


    static void main(final String... args) {
        exec(() -> service(store()).partition(UNITS).update(array(list(Xtream

                .of(
                        GLADE(),
                        VIQE(),
                        VISCC(),
                        VIPJSI()
                )

                .optMap(new Validate<>())

        )), FORCE));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    default Dataset collection() { return new UnitsFrame(); }


    @Forward("dct:")
    Set<Topic> subject();


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    final class Handler extends Delegator {

        public Handler() {
            delegate(new Worker().get(new Driver(new UnitFrame())));
        }

    }

}
