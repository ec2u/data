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

import eu.ec2u.data.organizations.OrgOrganizationFrame;
import eu.ec2u.data.resources.ReferenceFrame;

import java.net.URI;
import java.time.LocalDate;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.tools.Store.Options.FORCE;
import static com.metreeca.mesh.util.Collections.*;
import static com.metreeca.mesh.util.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.resources.Localized.EN;
import static eu.ec2u.data.taxonomies.Taxonomies.TAXONOMIES;

/**
 * International Standard Classification of Education 2011 (ISCED 2011) SKOS Concept Scheme.
 * <p>
 * This taxonomy defines the education levels as established by the UNESCO General Conference at its 36th session in
 * November 2011. Initially developed by UNESCO in the 1970s, and first revised in 1997, the ISCED classification serves
 * as an instrument to compile and present education statistics both nationally and internationally.
 * <p>
 * The classification includes 10 levels of education, from early childhood education to doctoral studies, providing a
 * standardized framework for organizing educational programs and related qualifications.
 */
public final class ISCED2011 implements Runnable {

    private static final URI ISCED2011=TAXONOMIES.resolve("isced-2011");

    private static final OrgOrganizationFrame UNESCO_INSTITUTE_FOR_STATISTICS=new OrgOrganizationFrame()
            .id(uri("http://www.uis.unesco.org/"))
            .prefLabel(map(entry(EN, "UNESCO Institute for Statistics")));

    private static final TaxonomyFrame TAXONOMY=new TaxonomyFrame()
            .id(ISCED2011)
            .title(map(entry(EN, "International Standard Classification of Education 2011")))
            .alternative(map(entry(EN, "ISCED 2011")))
            .description(map(entry(EN, """
                    The ISCED 2011 classification was adopted by the UNESCO General Conference at its 36th session in \
                    November 2011. Initially developed by UNESCO in the 1970s, and first revised in 1997, the ISCED \
                    classification serves as an instrument to compile and present education statistics both nationally \
                    and internationally."""
            )))
            .created(LocalDate.parse("2011-11-10"))
            .issued(LocalDate.parse("2024-01-01"))
            .rights("Copyright © 2012 UNESCO Institute for Statistics")
            .publisher(UNESCO_INSTITUTE_FOR_STATISTICS)
            .source(new ReferenceFrame()
                    .id(uri("https://uis.unesco.org"+
                            "/sites/default/files/documents"+
                            "/international-standard-classification-of-education-isced-2011-en.pdf"
                    )));


    private static final TopicFrame LEVEL0=new TopicFrame()
            .id(uri(ISCED2011+"/0"))
            .topConceptOf(TAXONOMY)
            .inScheme(TAXONOMY)
            .notation("0")
            .prefLabel(map(entry(EN, "Early childhood education")))
            .definition(map(entry(EN, """
                    Encompasses programmes with a holistic approach to support young children's \
                    early cognitive, physical, social and emotional development and introduce them \
                    to organised instruction outside the family context. It includes early \
                    childhood educational development (0-2 years) and pre-primary education \
                    (3 years to start of ISCED 1). These programmes are not necessarily highly \
                    structured but provide organised and purposeful learning activities in a safe \
                    environment, often through play-based activities.""")))
            .generated(true);

    private static final TopicFrame LEVEL1=new TopicFrame()
            .id(uri(ISCED2011+"/1"))
            .topConceptOf(TAXONOMY)
            .inScheme(TAXONOMY)
            .notation("1")
            .prefLabel(map(entry(EN, "Primary education")))
            .definition(map(entry(EN, """
                    Typically designed to provide students with fundamental skills in reading, \
                    writing, and mathematics (literacy and numeracy) and establish a solid \
                    foundation for learning in core knowledge areas, personal and social \
                    development, in preparation for lower secondary education. It focuses on \
                    learning at a basic level of complexity, often organised around units, \
                    projects, or broad learning areas with an integrated approach. Typically, one \
                    main teacher is responsible for a group of pupils.""")))
            .generated(true);

    private static final TopicFrame LEVEL2=new TopicFrame()
            .id(uri(ISCED2011+"/2"))
            .topConceptOf(TAXONOMY)
            .inScheme(TAXONOMY)
            .notation("2")
            .prefLabel(map(entry(EN, "Lower secondary education")))
            .definition(map(entry(EN, """
                    Typically designed to build on the learning outcomes from [ISCED 2011 Level 1](1), \
                    aiming to lay the foundation for lifelong learning. The curriculum is usually \
                    more subject-oriented, introducing theoretical concepts across a broad range \
                    of subjects. Teachers typically have pedagogical training in specific \
                    subjects, and students may have several teachers with specialised \
                    knowledge.""")))
            .generated(true);

    private static final TopicFrame LEVEL3=new TopicFrame()
            .id(uri(ISCED2011+"/3"))
            .topConceptOf(TAXONOMY)
            .inScheme(TAXONOMY)
            .notation("3")
            .prefLabel(map(entry(EN, "Upper secondary education")))
            .definition(map(entry(EN, """
                    Typically designed to complete secondary education in preparation for \
                    tertiary education or provide skills relevant to employment, or both. \
                    Instruction is more varied, specialised, and in-depth than at [ISCED 2011 Level 2](2), \
                    with a greater range of options and streams available. Teachers are often \
                    highly qualified in their subjects.""")))
            .generated(true);

    private static final TopicFrame LEVEL4=new TopicFrame()
            .id(uri(ISCED2011+"/4"))
            .topConceptOf(TAXONOMY)
            .inScheme(TAXONOMY)
            .notation("4")
            .prefLabel(map(entry(EN, "Post-secondary non-tertiary education")))
            .definition(map(entry(EN, """
                    Provides learning experiences building on secondary education, preparing for \
                    labour market entry as well as tertiary education. It aims for the \
                    acquisition of knowledge, skills, and competencies lower than tertiary \
                    education. The content is not sufficiently complex to be tertiary but is \
                    clearly post-secondary, often more specialised or detailed than upper \
                    secondary. Entry requires completion of [ISCED 2011 Level 3](3).""")))
            .generated(true);

    private static final TopicFrame LEVEL5=new TopicFrame()
            .id(uri(ISCED2011+"/5"))
            .topConceptOf(TAXONOMY)
            .inScheme(TAXONOMY)
            .notation("5")
            .prefLabel(map(entry(EN, "Short-cycle tertiary education")))
            .definition(map(entry(EN, """
                    Often designed to provide participants with professional knowledge, skills, \
                    and competencies. Typically practically-based and occupationally-specific, \
                    preparing students for the labour market, but may also offer a pathway to \
                    other tertiary programmes. Entry requires successful completion of [ISCED \
                    Level 3](3) or [4](4) with access to tertiary education. These programmes have more \
                    complex content than [ISCED 2011 Levels 3](3) and [4](4) but are shorter and usually less \
                    theoretically-oriented than [ISCED 2011 Level 6](6), with a minimum duration of two \
                    years.""")))
            .generated(true);

    private static final TopicFrame LEVEL6=new TopicFrame()
            .id(uri(ISCED2011+"/6"))
            .topConceptOf(TAXONOMY)
            .inScheme(TAXONOMY)
            .notation("6")
            .prefLabel(map(entry(EN, "Bachelor's or equivalent level")))
            .definition(map(entry(EN, """
                    Often designed to provide participants with intermediate academic and/or \
                    professional knowledge, skills, and competencies, leading to a first degree \
                    or equivalent qualification. Typically theoretically-based but may include \
                    practical components and are informed by research or best professional \
                    practice. Entry normally requires successful completion of an [ISCED 2011 Level 3](3) \
                    or [4](4) programme with access to tertiary education. First degree programmes at \
                    this level typically have a duration of three to four years.""")))
            .generated(true);

    private static final TopicFrame LEVEL7=new TopicFrame()
            .id(uri(ISCED2011+"/7"))
            .topConceptOf(TAXONOMY)
            .inScheme(TAXONOMY)
            .notation("7")
            .prefLabel(map(entry(EN, "Master's or equivalent level")))
            .definition(map(entry(EN, """
                    Often designed to provide participants with advanced academic and/or \
                    professional knowledge, skills, and competencies, leading to a second degree \
                    or equivalent qualification. May have a substantial research component but do \
                    not yet lead to a doctoral qualification. Typically theoretically-based but \
                    may include practical components and are informed by research or best \
                    professional practice. Entry into second or further degree programmes \
                    normally requires successful completion of an [ISCED 2011 Level 6](6) or [7](7) programme. \
                    [ISCED 2011 Level 7](7) programmes have significantly more complex content than \
                    [Level 6](6) and are usually more specialised.""")))
            .generated(true);

    private static final TopicFrame LEVEL8=new TopicFrame()
            .id(uri(ISCED2011+"/8"))
            .topConceptOf(TAXONOMY)
            .inScheme(TAXONOMY)
            .notation("8")
            .prefLabel(map(entry(EN, "Doctoral or equivalent level")))
            .definition(map(entry(EN, """
                    Represents the highest level of tertiary education, typically involving \
                    advanced research and leading to a doctoral qualification. Entry usually \
                    requires successful completion of [ISCED 2011 Level 7](7). These programmes are \
                    dedicated to advanced study and original research, typically requiring the \
                    submission of a thesis or dissertation of publishable quality.""")))
            .generated(true);

    private static final TopicFrame LEVEL9=new TopicFrame()
            .id(uri(ISCED2011+"/9"))
            .topConceptOf(TAXONOMY)
            .inScheme(TAXONOMY)
            .notation("9")
            .prefLabel(map(entry(EN, "Not elsewhere classified")))
            .definition(map(entry(EN, """
                    Education programmes that cannot be classified within the ISCED 2011 Levels [0](0)-[8](8). \
                    This category is not a part of the ISCED classification itself but is \
                    provided in data collections to capture education programmes that cannot be \
                    categorized in one of the defined education levels.""")))
            .generated(true);


    public static void main(final String... args) {
        exec(() -> new ISCED2011().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Store store=service(store());


    @Override public void run() {
        store.partition(ISCED2011).update(array(list(Xtream

                .of(
                        TAXONOMY,
                        UNESCO_INSTITUTE_FOR_STATISTICS,

                        LEVEL0,
                        LEVEL1,
                        LEVEL2,
                        LEVEL3,
                        LEVEL4,
                        LEVEL5,
                        LEVEL6,
                        LEVEL7,
                        LEVEL8,
                        LEVEL9
                )

                .optMap(new Validate<>())

        )), FORCE);
    }

}