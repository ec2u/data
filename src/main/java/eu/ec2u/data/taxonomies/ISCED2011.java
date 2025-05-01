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

import eu.ec2u.data.organizations.OrgOrganizationFrame;
import eu.ec2u.data.resources.ReferenceFrame;

import java.net.URI;
import java.time.LocalDate;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.toolkits.Resources.resource;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.tools.Store.Options.FORCE;
import static com.metreeca.mesh.util.Collections.*;
import static com.metreeca.mesh.util.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.resources.Localized.EN;

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

    private static final URI ISCED2011=Taxonomies.TAXONOMIES.id().resolve("isced-2011");

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


    public static void main(final String... args) {
        exec(() -> new ISCED2011().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        service(store()).partition(ISCED2011).update(array(list(Xtream.from(

                Xtream.of(
                        TAXONOMY,
                        UNESCO_INSTITUTE_FOR_STATISTICS
                ).optMap(new Validate<>()),

                Stream.of(resource(ISCED2011.class, ".csv").toString())
                        .flatMap(new Taxonomy.Loader(TAXONOMY))

        ))), FORCE);
    }

}