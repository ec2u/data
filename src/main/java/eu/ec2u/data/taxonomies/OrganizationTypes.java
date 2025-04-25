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

package eu.ec2u.data.taxonomies;

import com.metreeca.flow.json.actions.Validate;
import com.metreeca.flow.work.Xtream;
import com.metreeca.mesh.tools.Store;

import java.net.URI;
import java.time.LocalDate;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.tools.Store.Options.FORCE;
import static com.metreeca.mesh.util.Collections.*;
import static com.metreeca.mesh.util.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.COPYRIGHT;
import static eu.ec2u.data.EC2U.EC2U;
import static eu.ec2u.data.resources.Collection.CCBYNCND40;
import static eu.ec2u.data.resources.Localized.EN;
import static eu.ec2u.data.taxonomies.Taxonomies.TAXONOMIES;

/**
 * EC2U Organization Type SKOS Concept Scheme.
 * <p>
 * This taxonomy defines a hierarchical classification of organization types in the EC2U alliance context. The taxonomy
 * structure consists of:
 * <p>
 * - Top-level taxonomies (University, College, Association, City, Other) representing main organization categories -
 * University Unit as a special top-level concept with a rich hierarchy of specialized academic structures -
 * Second-level taxonomies under University Unit (Area, Network, Institute, Department, Centre, Group, Laboratory,
 * Facility) - Further specializations at the third and fourth levels (e.g., Virtual Institute, Research Centre, Library
 * Facility)
 * <p>
 * This scheme provides standardized terminology for categorizing organizations and their units within the EC2U
 * alliance, ensuring consistent classification across institutions.
 */
public final class OrganizationTypes implements Runnable {

    private static final URI ORGANIZATIONS=TAXONOMIES.resolve("organizations");

    private static final TaxonomyFrame TAXONOMY=new TaxonomyFrame()
            .id(ORGANIZATIONS)
            .title(map(entry(EN, "EC2U Organization Types")))
            .alternative(map(entry(EN, "EC2U Organizations")))
            .description(map(entry(EN,
                    "Standardized terminology for categorizing organizations and their units within the EC2U Alliance"
            )))
            .issued(LocalDate.parse("2024-01-01"))
            .rights(COPYRIGHT)
            .publisher(EC2U)
            .license(set(CCBYNCND40));


    private static final TopicFrame UNIVERSITY=new TopicFrame().generated(true)
            .id(uri(ORGANIZATIONS+"/university"))
            .topConceptOf(TAXONOMY)
            .inScheme(TAXONOMY)
            .prefLabel(map(entry(EN, "University")))
            .definition(map(entry(EN, """
                    A higher education institution that grants academic degrees in various fields of study and conducts research. \
                    Within the EC2U Alliance, a university is one of the institutions that forms the European \
                    Campus of City-Universities collaborative network, sharing resources, expertise, and programs to address \
                    educational, research, and societal challenges across European cities and regions.""")));

    private static final TopicFrame COLLEGE=new TopicFrame().generated(true)
            .id(uri(ORGANIZATIONS+"/college"))
            .topConceptOf(TAXONOMY)
            .inScheme(TAXONOMY)
            .prefLabel(map(entry(EN, "College")))
            .definition(map(entry(EN, """
                    An educational institution or organizational unit that typically offers undergraduate education or specialized \
                    programs in specific fields. Within the EC2U context, colleges may serve as academic divisions within the \
                    alliance universities, offering focused curricula, interdisciplinary studies, or specialized training \
                    complementing broader university programs.""")));

    private static final TopicFrame ASSOCIATION=new TopicFrame().generated(true)
            .id(uri(ORGANIZATIONS+"/association"))
            .topConceptOf(TAXONOMY)
            .inScheme(TAXONOMY)
            .prefLabel(map(entry(EN, "Association")))
            .definition(map(entry(EN, """
                    A formal group of people or organizations with a shared purpose, structured with defined membership and objectives. \
                    In the EC2U context, associations may include academic societies, student organizations, alumni networks, \
                    professional consortia, or cooperative entities that collaborate with the alliance universities \
                    to enhance educational outcomes, research initiatives, or community engagement.""")));

    private static final TopicFrame CITY=new TopicFrame().generated(true)
            .id(uri(ORGANIZATIONS+"/city"))
            .topConceptOf(TAXONOMY)
            .inScheme(TAXONOMY)
            .prefLabel(map(entry(EN, "City")))
            .definition(map(entry(EN, """
                    A large urban settlement with defined boundaries and municipal governance. In the EC2U Alliance, cities are crucial partners \
                    connected to member universities, forming the "City-Universities" alliance. These cities—Coimbra, Iași, Jena, Pavia, Poitiers, \
                    Salamanca, and Turku—provide infrastructure, community resources, and collaboration opportunities for cultural, economic, \
                    and social initiatives linked to alliance activities.""")));

    private static final TopicFrame OTHER=new TopicFrame().generated(true)
            .id(uri(ORGANIZATIONS+"/other"))
            .topConceptOf(TAXONOMY)
            .inScheme(TAXONOMY)
            .prefLabel(map(entry(EN, "Other")))
            .definition(map(entry(EN, """
                    Organizations that do not fit into the predefined categories of University, College, Association, or City, \
                    but still maintain relationships with EC2U Alliance institutions. These may include businesses, NGOs, government agencies, \
                    cultural institutions, research foundations, startups, or other entities that collaborate with alliance members \
                    on educational programs, research initiatives, knowledge transfer, or community projects.""")));

    private static final TopicFrame UNIVERSITY_UNIT=new TopicFrame().generated(true)
            .id(uri(ORGANIZATIONS+"/university-unit"))
            .topConceptOf(TAXONOMY)
            .inScheme(TAXONOMY)
            .prefLabel(map(entry(EN, "University Unit")))
            .definition(map(entry(EN, """
                    A distinct organizational entity within a university structure that serves specific educational, research, \
                    administrative, or support functions. In the EC2U Alliance, university units represent the diverse internal \
                    organizational structures of member institutions, including academic departments, research centers, administrative \
                    offices, and specialized facilities that collectively enable the university's mission of education, research, \
                    and community service.""")));

    private static final TopicFrame AREA=new TopicFrame().generated(true)
            .id(uri(UNIVERSITY_UNIT.id()+"/area"))
            .broader(set(UNIVERSITY_UNIT))
            .inScheme(TAXONOMY)
            .prefLabel(map(entry(EN, "Research Area")))
            .definition(map(entry(EN, """
                    Thematic collaboration area gathering researchers from different disciplines to advance \
                    multidisciplinary research and education across faculty boundaries, create platforms for networks, \
                    business collaboration, innovations and strategic partnerships; part of the formal organization of \
                    the University with an appointed head/board."""
            )));

    private static final TopicFrame NETWORK=new TopicFrame().generated(true)
            .id(uri(UNIVERSITY_UNIT.id()+"/network"))
            .broader(set(UNIVERSITY_UNIT))
            .inScheme(TAXONOMY)
            .prefLabel(map(entry(EN, "Research Network")))
            .definition(map(entry(EN, """
                    Networks of researchers sharing a research theme or topic; not part of the formal \
                    organization of the University; not limited to the researchers of the University"""
            )));

    private static final TopicFrame INSTITUTE=new TopicFrame().generated(true)
            .id(uri(UNIVERSITY_UNIT.id()+"/institute"))
            .broader(set(UNIVERSITY_UNIT))
            .inScheme(TAXONOMY)
            .prefLabel(map(entry(EN, "Institute")))
            .definition(map(entry(EN, """
                    A specialized research or educational organization within a university structure, often focused on a particular \
                    field or interdisciplinary area. Within EC2U institutions, institutes typically engage in focused research activities, \
                    offer specialized educational programs, facilitate knowledge exchange, and foster international collaborations. \
                    They may operate with varying degrees of autonomy while maintaining connections to their parent universities.""")));

    public static final TopicFrame VIRTUAL_INSTITUTE=new TopicFrame().generated(true) // !!! hide
            .id(uri(INSTITUTE.id()+"/virtual"))
            .broader(set(INSTITUTE))
            .inScheme(TAXONOMY)
            .prefLabel(map(entry(EN, "Virtual Institute")))
            .definition(map(entry(EN, """
                    A joint institute "without physical walls" hosting international inter-disciplinary teams of students, teachers, \
                    researchers and innovators from the seven universities composing the EC2U Alliance. This innovative format fosters \
                    rapid integration of research results and innovation into education through challenge-based curricula and short-term \
                    trainings like internships, summer/winter schools, and workshops. These knowledge-creating teams develop solutions to \
                    local, national, European and global challenges by collaborating across institutional boundaries.""")));

    private static final TopicFrame DEPARTMENT=new TopicFrame().generated(true)
            .id(uri(UNIVERSITY_UNIT.id()+"/department"))
            .broader(set(UNIVERSITY_UNIT))
            .inScheme(TAXONOMY)
            .prefLabel(map(entry(EN, "Department")))
            .definition(map(entry(EN, """
                    A primary academic division within a university organized around a specific discipline or field of study. \
                    Departments in EC2U universities typically serve as administrative units that coordinate teaching activities, \
                    support faculty research, develop curriculum, offer degree programs, and foster academic community within their \
                    discipline. They form the core organizational structure through which academic activities are planned, delivered, \
                    and assessed.""")));

    private static final TopicFrame CENTRE=new TopicFrame().generated(true)
            .id(uri(UNIVERSITY_UNIT.id()+"/centre"))
            .broader(set(UNIVERSITY_UNIT))
            .inScheme(TAXONOMY)
            .prefLabel(map(entry(EN, "Centre")))
            .hiddenLabel(map(entry(EN, set("Center"))))
            .definition(map(entry(EN, """
                    An organizational unit within a university that focuses on a specific area of research, education, or service, often \
                    with a multidisciplinary approach. In EC2U institutions, centres typically operate with defined missions, dedicated \
                    resources, and formal governance structures. They may conduct specialized research, offer unique educational programs, \
                    provide specialized services, or engage with external communities, serving as hubs for collaboration across traditional \
                    academic boundaries.""")));

    private static final TopicFrame RESEARCH_CENTRE=new TopicFrame().generated(true)
            .id(uri(CENTRE.id()+"/research"))
            .broader(set(CENTRE))
            .inScheme(TAXONOMY)
            .prefLabel(map(entry(EN, "Research Centre")))
            .hiddenLabel(map(entry(EN, set("Research Center"))))
            .definition(map(entry(EN, """
                    A specialized university unit dedicated to conducting advanced research in a particular field or addressing specific \
                    research challenges, often with an interdisciplinary approach. Within EC2U universities, research centres typically maintain \
                    focused research agendas, dedicated research staff, specialized equipment, and external funding sources. They serve as \
                    concentrated environments for research excellence, knowledge creation, and innovation within their domains of specialization.""")));

    private static final TopicFrame INTERDEPARTMENTAL_RESEARCH_CENTRE=new TopicFrame().generated(true)
            .id(uri(RESEARCH_CENTRE.id()+"/interdepartmental"))
            .broader(set(RESEARCH_CENTRE))
            .inScheme(TAXONOMY)
            .prefLabel(map(entry(EN, "Interdepartmental Research Center")))
            .hiddenLabel(map(entry(EN, set("Interdepartmental Research Center"))))
            .definition(map(entry(EN, """
                    A research center that formally spans multiple academic departments, facilitating collaboration across disciplinary boundaries. \
                    In EC2U universities, interdepartmental research centers bring together researchers from different departments to address \
                    complex research questions that require diverse expertise. These centers typically have governance structures representing \
                    multiple departments, shared research facilities, and funding mechanisms that encourage cross-departmental projects and \
                    knowledge integration.""")));

    private static final TopicFrame TRANSFER_CENTRE=new TopicFrame().generated(true)
            .id(uri(CENTRE.id()+"/transfer"))
            .broader(set(CENTRE))
            .inScheme(TAXONOMY)
            .prefLabel(map(entry(EN, "Technology Transfer Centre")))
            .hiddenLabel(map(entry(EN, set("Technology Transfer Center"))))
            .definition(map(entry(EN, """
                    A specialized unit focused on transferring university-generated knowledge, technologies, and innovations to external \
                    entities for practical application. Within EC2U institutions, technology transfer centres facilitate the movement of \
                    research outputs to industry, manage intellectual property, support commercialization activities, foster entrepreneurship, \
                    and build partnerships with businesses and other organizations. They serve as bridges between academic research and \
                    practical implementation.""")));

    private static final TopicFrame SERVICE_CENTRE=new TopicFrame().generated(true)
            .id(uri(CENTRE.id()+"/service"))
            .broader(set(CENTRE))
            .inScheme(TAXONOMY)
            .prefLabel(map(entry(EN, "Service Centre")))
            .hiddenLabel(map(entry(EN, set("Service Center"))))
            .definition(map(entry(EN, """
                    A specialized university unit established to provide specific services to internal or external communities. \
                    In the EC2U context, service centres may offer technical assistance, consulting services, analytical testing, \
                    professional development, community outreach, or other specialized support functions. These centers typically \
                    operate with service-oriented missions, dedicated staff with specialized expertise, and systems for managing \
                    service requests and delivery.""")));

    private static final TopicFrame GROUP=new TopicFrame().generated(true)
            .id(uri(UNIVERSITY_UNIT.id()+"/group"))
            .broader(set(UNIVERSITY_UNIT))
            .inScheme(TAXONOMY)
            .prefLabel(map(entry(EN, "Research Group")))
            .definition(map(entry(EN, """
                    A collective of researchers working collaboratively on shared research interests or projects. In EC2U universities, \
                    research groups typically consist of faculty members, researchers, doctoral students, and other staff who coordinate \
                    their efforts to advance knowledge in a specialized field or interdisciplinary area. These groups may vary in their \
                    formal recognition, size, structure, and duration while serving as key units for research collaboration.""")));

    private static final TopicFrame RECOGNIZED_GROUP=new TopicFrame().generated(true)
            .id(uri(GROUP.id()+"/recognized"))
            .broader(set(GROUP))
            .inScheme(TAXONOMY)
            .prefLabel(map(entry(EN, "Recognized Research Group")))
            .definition(map(entry(EN, """
                    A research group that has been formally acknowledged and sanctioned by its university through an official \
                    evaluation or registration process. Within EC2U institutions, recognized research groups typically receive \
                    institutional support, have clearly defined leadership structures, established membership criteria, and may \
                    qualify for internal funding. They are integrated into the university's formal research infrastructure and \
                    contribute to the institution's strategic research goals.""")));

    private static final TopicFrame INFORMAL_GROUP=new TopicFrame().generated(true)
            .id(uri(GROUP.id()+"/informal"))
            .broader(set(GROUP))
            .inScheme(TAXONOMY)
            .prefLabel(map(entry(EN, "Informal Research Group")))
            .definition(map(entry(EN, """
                    A collaborative research arrangement formed through voluntary association without formal university recognition or structure. \
                    In EC2U universities, informal research groups typically emerge organically around shared research interests, specific \
                    projects, or intellectual affinities. These groups operate with flexible membership, minimal administrative overhead, \
                    and self-determined objectives, allowing for dynamic research collaborations that may evolve into more formal structures \
                    over time.""")));

    private static final TopicFrame STUDENT_GROUP=new TopicFrame().generated(true)
            .id(uri(GROUP.id()+"/student"))
            .broader(set(GROUP))
            .inScheme(TAXONOMY)
            .prefLabel(map(entry(EN, "Student Research Group")))
            .definition(map(entry(EN, """
                    A research-oriented organization primarily led by and composed of undergraduate or graduate students with faculty \
                    supervision. Within EC2U universities, student research groups provide opportunities for hands-on research experience, \
                    peer collaboration, and professional development outside the formal curriculum. These groups often focus on specific \
                    research questions, participate in competitions, organize workshops, or contribute to larger research initiatives while \
                    developing students' research skills.""")));

    private static final TopicFrame LABORATORY=new TopicFrame().generated(true)
            .id(uri(UNIVERSITY_UNIT.id()+"/laboratory"))
            .broader(set(UNIVERSITY_UNIT))
            .inScheme(TAXONOMY)
            .prefLabel(map(entry(EN, "Laboratory")))
            .definition(map(entry(EN, """
                    A facility equipped for conducting scientific research, experiments, or technical analysis in controlled conditions. \
                    Within EC2U institutions, laboratories provide specialized spaces, equipment, and technical support for empirical \
                    research across various disciplines. They enable practical training for students, support faculty research \
                    initiatives, and often serve as collaborative spaces for interdisciplinary or inter-university research projects.""")));

    private static final TopicFrame FACILITY=new TopicFrame().generated(true)
            .id(uri(UNIVERSITY_UNIT.id()+"/facility"))
            .broader(set(UNIVERSITY_UNIT))
            .inScheme(TAXONOMY)
            .prefLabel(map(entry(EN, "Research Facility")))
            .definition(map(entry(EN, """
                    A specialized physical infrastructure, equipment, or installation that supports research activities across multiple \
                    departments or disciplines. In EC2U institutions, research facilities provide shared access to advanced technologies, \
                    specialized spaces, or unique resources that would be impractical for individual departments to maintain. These facilities \
                    are typically managed by dedicated staff and serve researchers from various fields, enabling complex research projects \
                    and interdisciplinary collaboration.""")));

    private static final TopicFrame LIBRARY_FACILITY=new TopicFrame().generated(true)
            .id(uri(FACILITY.id()+"/library"))
            .broader(set(FACILITY))
            .inScheme(TAXONOMY)
            .prefLabel(map(entry(EN, "Research Library")))
            .definition(map(entry(EN, """
                    A specialized library that focuses on collecting, preserving, and providing access to scholarly resources for advanced \
                    research purposes. Within EC2U universities, research libraries maintain comprehensive collections in specific disciplines, \
                    offer specialized information services, provide access to rare or unique materials, and support scholarly publishing. \
                    They serve as essential infrastructure for researchers across disciplines, preserving knowledge and facilitating its \
                    discovery and use.""")));

    private static final TopicFrame COLLECTION_FACILITY=new TopicFrame().generated(true)
            .id(uri(FACILITY.id()+"/collection"))
            .broader(set(FACILITY))
            .inScheme(TAXONOMY)
            .prefLabel(map(entry(EN, "Research Collection")))
            .definition(map(entry(EN, """
                    A facility dedicated to systematically acquiring, preserving, organizing, and providing access to objects, specimens, \
                    or materials for research purposes. In EC2U universities, research collections include museums, archives, biobanks, \
                    geological repositories, seed banks, and other specialized collections. These facilities maintain curatorial expertise, \
                    preservation infrastructure, cataloging systems, and access protocols that enable researchers to study unique materials \
                    essential for various disciplines.""")));

    private static final TopicFrame INSTRUMENT_FACILITY=new TopicFrame().generated(true)
            .id(uri(FACILITY.id()+"/instrument"))
            .broader(set(FACILITY))
            .inScheme(TAXONOMY)
            .prefLabel(map(entry(EN, "Research Instrument")))
            .definition(map(entry(EN, """
                    A large-scale specialized scientific apparatus or equipment system requiring dedicated management, technical expertise, \
                    and supporting infrastructure. Within EC2U universities, these research instruments include sophisticated technologies \
                    such as telescopes, particle accelerators, nuclear reactors, high-performance computing clusters, or advanced imaging \
                    systems. These facilities typically serve multiple research groups, require significant investment, and enable research \
                    that would be impossible without specialized equipment."""
            )));

    private static final TopicFrame STATION_FACILITY=new TopicFrame().generated(true)
            .id(uri(FACILITY.id()+"/station"))
            .broader(set(FACILITY))
            .inScheme(TAXONOMY)
            .prefLabel(map(entry(EN, "Research Station")))
            .altLabel(map(entry(EN, set("Research Base"))))
            .definition(map(entry(EN, """
                    A dedicated facility located in a particular geographic environment to support field-based research activities. \
                    In the EC2U context, research stations provide specialized infrastructure for data collection, monitoring, experimentation, \
                    or observation in specific environmental settings (marine, alpine, forest, urban, etc.). These stations enable in-situ \
                    research that requires sustained presence in the field, supporting both educational activities and long-term research \
                    projects requiring direct environmental engagement.""")));


    public static void main(final String... args) {
        exec(() -> new OrganizationTypes().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Store store=service(store());


    @Override public void run() {
        store.partition(ORGANIZATIONS).update(array(list(Xtream

                .of(

                        TAXONOMY,

                        UNIVERSITY,
                        COLLEGE,
                        ASSOCIATION,
                        CITY,
                        OTHER,
                        UNIVERSITY_UNIT,
                        AREA,
                        NETWORK,
                        INSTITUTE,
                        VIRTUAL_INSTITUTE,
                        DEPARTMENT,
                        CENTRE,
                        RESEARCH_CENTRE,
                        INTERDEPARTMENTAL_RESEARCH_CENTRE,
                        TRANSFER_CENTRE,
                        SERVICE_CENTRE,
                        GROUP,
                        RECOGNIZED_GROUP,
                        INFORMAL_GROUP,
                        STUDENT_GROUP,
                        LABORATORY,
                        FACILITY,
                        LIBRARY_FACILITY,
                        COLLECTION_FACILITY,
                        INSTRUMENT_FACILITY,
                        STATION_FACILITY

                )

                .optMap(new Validate<>())

        )), FORCE);
    }

}