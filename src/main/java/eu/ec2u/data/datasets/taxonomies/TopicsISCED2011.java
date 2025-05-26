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

package eu.ec2u.data.datasets.taxonomies;

import eu.ec2u.data.datasets.ReferenceFrame;

import java.time.LocalDate;
import java.util.Map;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.Value.value;
import static com.metreeca.mesh.queries.Criterion.criterion;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.shim.Collections.*;
import static com.metreeca.shim.Resources.resource;
import static com.metreeca.shim.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.Localized.EN;

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
public final class TopicsISCED2011 implements Runnable {

    public static final String PATH=Taxonomies.PATH+"isced-2011/";

    private static final TaxonomyFrame ISCED2011=new TaxonomyFrame()
            .id(uri(PATH))
            .title(map(entry(EN, "International Standard Classification of Education 2011")))
            .alternative(map(entry(EN, "ISCED 2011")))
            .description(map(entry(EN, """
                    The ISCED 2011 classification was adopted by the UNESCO General Conference at its 36th session in \
                    November 2011. Initially developed by UNESCO in the 1970s, and first revised in 1997, the ISCED \
                    classification serves as an instrument to compile and present education statistics both nationally \
                    and internationally."""
            )))
            .issued(LocalDate.parse("2011-11-10"))
            .rights("Copyright © 2012 UNESCO Institute for Statistics")
            .publisher(TopicsISCED.UNESCO_INSTITUTE_FOR_STATISTICS)
            .source(new ReferenceFrame()
                    .id(uri("https://uis.unesco.org"
                            +"/sites/default/files/documents"
                            +"/international-standard-classification-of-education-isced-2011-en.pdf"
                    ))
            );

    public static final TopicFrame LEVEL_0=new TopicFrame(true).id(uri(ISCED2011.id()+"/0"));
    public static final TopicFrame LEVEL_1=new TopicFrame(true).id(uri(ISCED2011.id()+"/1"));
    public static final TopicFrame LEVEL_2=new TopicFrame(true).id(uri(ISCED2011.id()+"/2"));
    public static final TopicFrame LEVEL_3=new TopicFrame(true).id(uri(ISCED2011.id()+"/3"));
    public static final TopicFrame LEVEL_4=new TopicFrame(true).id(uri(ISCED2011.id()+"/4"));
    public static final TopicFrame LEVEL_5=new TopicFrame(true).id(uri(ISCED2011.id()+"/5"));
    public static final TopicFrame LEVEL_6=new TopicFrame(true).id(uri(ISCED2011.id()+"/6"));
    public static final TopicFrame LEVEL_7=new TopicFrame(true).id(uri(ISCED2011.id()+"/7"));
    public static final TopicFrame LEVEL_8=new TopicFrame(true).id(uri(ISCED2011.id()+"/8"));
    public static final TopicFrame LEVEL_9=new TopicFrame(true).id(uri(ISCED2011.id()+"/9"));


    public static final Map<Integer, Topic> LEVELS=map(
            entry(1, LEVEL_1),
            entry(2, LEVEL_2),
            entry(3, LEVEL_3),
            entry(4, LEVEL_4),
            entry(5, LEVEL_5),
            entry(6, LEVEL_6),
            entry(7, LEVEL_7),
            entry(8, LEVEL_8),
            entry(9, LEVEL_9)
    );


    public static void main(final String... args) {
        exec(() -> new TopicsISCED2011().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        service(store()).modify(

                array(list(Stream.concat(

                        Stream.of(ISCED2011),

                        Stream.of(resource(TopicsISCED2011.class, ".csv").toString())
                                .flatMap(new Taxonomies.Loader(ISCED2011))

                ))),

                value(query(new TopicFrame(true)).where("inScheme", criterion().any(ISCED2011)))

        );
    }

}