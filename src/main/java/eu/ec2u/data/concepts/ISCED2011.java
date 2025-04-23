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

package eu.ec2u.data.concepts;

import com.metreeca.flow.json.actions.Validate;
import com.metreeca.flow.work.Xtream;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Namespace;

import eu.ec2u.data.concepts.SKOSConceptFrame;
import eu.ec2u.data.datasets.Dataset;
import eu.ec2u.data.organizations.OrgOrganization;
import eu.ec2u.data.organizations.OrgOrganizationFrame;
import eu.ec2u.data.resources.Reference;
import eu.ec2u.data.resources.ReferenceFrame;

import java.net.URI;
import java.time.LocalDate;
import java.util.Locale;
import java.util.Map;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.tools.Store.Options.FORCE;
import static com.metreeca.mesh.util.Collections.*;
import static com.metreeca.mesh.util.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.concepts.Taxonomies.CONCEPTS;
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
@Frame
@Namespace("[dct]")
public interface ISCED2011 extends Taxonomy {

    URI ISCED2011=CONCEPTS.resolve("isced-2011");

    OrgOrganizationFrame UIS=new OrgOrganizationFrame()
            .id(uri("http://www.uis.unesco.org/"))
            .prefLabel(map(entry(EN, "UNESCO Institute for Statistics")));


    static SKOSConceptFrame Level0() {
        return new SKOSConceptFrame()
                .id(uri(ISCED2011+"/0"))
                .topConceptOf(new ISCED2011Frame())
                .inScheme(new ISCED2011Frame())
                .notation("0")
                .prefLabel(map(entry(EN, "Early childhood education")));
    }

    static SKOSConceptFrame Level1() {
        return new SKOSConceptFrame()
                .id(uri(ISCED2011+"/1"))
                .topConceptOf(new ISCED2011Frame())
                .inScheme(new ISCED2011Frame())
                .notation("1")
                .prefLabel(map(entry(EN, "Primary education")));
    }

    static SKOSConceptFrame Level2() {
        return new SKOSConceptFrame()
                .id(uri(ISCED2011+"/2"))
                .topConceptOf(new ISCED2011Frame())
                .inScheme(new ISCED2011Frame())
                .notation("2")
                .prefLabel(map(entry(EN, "Lower secondary education")));
    }

    static SKOSConceptFrame Level3() {
        return new SKOSConceptFrame()
                .id(uri(ISCED2011+"/3"))
                .topConceptOf(new ISCED2011Frame())
                .inScheme(new ISCED2011Frame())
                .notation("3")
                .prefLabel(map(entry(EN, "Upper secondary education")));
    }

    static SKOSConceptFrame Level4() {
        return new SKOSConceptFrame()
                .id(uri(ISCED2011+"/4"))
                .topConceptOf(new ISCED2011Frame())
                .inScheme(new ISCED2011Frame())
                .notation("4")
                .prefLabel(map(entry(EN, "Post-secondary non-tertiary education")));
    }

    static SKOSConceptFrame Level5() {
        return new SKOSConceptFrame()
                .id(uri(ISCED2011+"/5"))
                .topConceptOf(new ISCED2011Frame())
                .inScheme(new ISCED2011Frame())
                .notation("5")
                .prefLabel(map(entry(EN, "Short-cycle tertiary education")));
    }

    static SKOSConceptFrame Level6() {
        return new SKOSConceptFrame()
                .id(uri(ISCED2011+"/6"))
                .topConceptOf(new ISCED2011Frame())
                .inScheme(new ISCED2011Frame())
                .notation("6")
                .prefLabel(map(entry(EN, "Bachelor's or equivalent level")));
    }

    static SKOSConceptFrame Level7() {
        return new SKOSConceptFrame()
                .id(uri(ISCED2011+"/7"))
                .topConceptOf(new ISCED2011Frame())
                .inScheme(new ISCED2011Frame())
                .notation("7")
                .prefLabel(map(entry(EN, "Master's or equivalent level")));
    }

    static SKOSConceptFrame Level8() {
        return new SKOSConceptFrame()
                .id(uri(ISCED2011+"/8"))
                .topConceptOf(new ISCED2011Frame())
                .inScheme(new ISCED2011Frame())
                .notation("8")
                .prefLabel(map(entry(EN, "Doctoral or equivalent level")));
    }

    static SKOSConceptFrame Level9() {
        return new SKOSConceptFrame()
                .id(uri(ISCED2011+"/9"))
                .topConceptOf(new ISCED2011Frame())
                .inScheme(new ISCED2011Frame())
                .notation("9")
                .prefLabel(map(entry(EN, "Not elsewhere classified")));
    }


    static void main(final String... args) {
        exec(() -> service(store()).partition(ISCED2011).update(array(list(Xtream

                .of(
                        new ISCED2011Frame(),
                        UIS, // !!! deep loading

                        Level0(),
                        Level1(),
                        Level2(),
                        Level3(),
                        Level4(),
                        Level5(),
                        Level6(),
                        Level7(),
                        Level8(),
                        Level9()
                )

                .optMap(new Validate<>())

        )), FORCE));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    default URI id() {
        return ISCED2011;
    }


    @Override
    default Dataset dataset() { return new TaxonomiesFrame(); }


    @Override
    default Map<Locale, String> title() {
        return map(entry(EN, "International Standard Classification of Education 2011"));
    }

    @Override
    default Map<Locale, String> alternative() {
        return map(entry(EN, "ISCED 2011"));
    }

    @Override
    default Map<Locale, String> description() {
        return map(entry(EN, """
                The ISCED 2011 classification was adopted by the UNESCO General Conference at its 36th session in \
                November 2011. Initially developed by UNESCO in the 1970s, and first revised in 1997, the ISCED \
                classification serves as an instrument to compile and present education statistics both nationally \
                and internationally."""
        ));
    }



    @Override
    default LocalDate created() {
        return LocalDate.parse("2011-11-10");
    }

    @Override
    default LocalDate issued() {
        return LocalDate.parse("2024-01-01");
    }


    @Override
    default String rights() {
        return "Copyright © 2012 UNESCO Institute for Statistics";
    }


    @Override
    default OrgOrganization publisher() {
        return UIS;
    }

    @Override
    default Reference source() {
        return new ReferenceFrame()
                .id(uri("https://uis.unesco.org/sites/default/files/documents/international-standard-classification-of-education-isced-2011-en.pdf"));
    }

}