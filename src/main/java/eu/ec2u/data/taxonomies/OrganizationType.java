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
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Namespace;

import eu.ec2u.data.concepts.SKOSConceptFrame;
import eu.ec2u.data.datasets.Dataset;
import eu.ec2u.data.organizations.OrgOrganization;
import eu.ec2u.data.resources.Reference;

import java.net.URI;
import java.time.LocalDate;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.tools.Store.Options.FORCE;
import static com.metreeca.mesh.util.Collections.*;
import static com.metreeca.mesh.util.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.COPYRIGHT;
import static eu.ec2u.data.EC2U.EC2U;
import static eu.ec2u.data.resources.Localized.EN;
import static eu.ec2u.data.taxonomies.Taxonomies.CONCEPTS;

/**
 * EC2U Organization Type SKOS Concept Scheme.
 * <p>
 * This taxonomy defines a hierarchical classification of organization types in the EC2U alliance context. The taxonomy
 * structure consists of:
 * <p>
 * - Top-level concepts (University, College, Association, City, Other) representing main organization categories -
 * University Unit as a special top-level concept with a rich hierarchy of specialized academic structures -
 * Second-level concepts under University Unit (Area, Network, Institute, Department, Centre, Group, Laboratory,
 * Facility) - Further specializations at the third and fourth levels (e.g., Virtual Institute, Research Centre, Library
 * Facility)
 * <p>
 * This scheme provides standardized terminology for categorizing organizations and their units within the EC2U
 * alliance, ensuring consistent classification across institutions.
 */
@Frame
@Namespace("[dct]")
public interface OrganizationType extends Taxonomy {

    URI ORGANIZATIONS=CONCEPTS.resolve("organizations");


    static SKOSConceptFrame University() {
        return new SKOSConceptFrame()
                .id(uri(ORGANIZATIONS+"/university"))
                .topConceptOf(new OrganizationTypeFrame())
                .inScheme(new OrganizationTypeFrame())
                .prefLabel(map(entry(EN, "University")));
    }

    static SKOSConceptFrame College() {
        return new SKOSConceptFrame()
                .id(uri(ORGANIZATIONS+"/college"))
                .topConceptOf(new OrganizationTypeFrame())
                .inScheme(new OrganizationTypeFrame())
                .prefLabel(map(entry(EN, "College")));
    }

    static SKOSConceptFrame Association() {
        return new SKOSConceptFrame()
                .id(uri(ORGANIZATIONS+"/association"))
                .topConceptOf(new OrganizationTypeFrame())
                .inScheme(new OrganizationTypeFrame())
                .prefLabel(map(entry(EN, "Association")));
    }

    static SKOSConceptFrame City() {
        return new SKOSConceptFrame()
                .id(uri(ORGANIZATIONS+"/city"))
                .topConceptOf(new OrganizationTypeFrame())
                .inScheme(new OrganizationTypeFrame())
                .prefLabel(map(entry(EN, "City")));
    }

    static SKOSConceptFrame Other() {
        return new SKOSConceptFrame()
                .id(uri(ORGANIZATIONS+"/other"))
                .topConceptOf(new OrganizationTypeFrame())
                .inScheme(new OrganizationTypeFrame())
                .prefLabel(map(entry(EN, "Other")));
    }

    static SKOSConceptFrame UniversityUnit() {
        return new SKOSConceptFrame()
                .id(uri(ORGANIZATIONS+"/university-unit"))
                .topConceptOf(new OrganizationTypeFrame())
                .inScheme(new OrganizationTypeFrame())
                .prefLabel(map(entry(EN, "University Unit")));
    }

    static SKOSConceptFrame Area() {
        return new SKOSConceptFrame()
                .id(uri(UniversityUnit().id()+"/area"))
                .broader(set(UniversityUnit()))
                .inScheme(new OrganizationTypeFrame())
                .prefLabel(map(entry(EN, "Research Area")))
                .definition(map(entry(EN, """
                        Thematic collaboration area gathering researchers from different disciplines to advance \
                        multidisciplinary research and education across faculty boundaries, create platforms for networks, \
                        business collaboration, innovations and strategic partnerships; part of the formal organization of \
                        the University with an appointed head/board."""
                )));
    }

    static SKOSConceptFrame Network() {
        return new SKOSConceptFrame()
                .id(uri(UniversityUnit().id()+"/network"))
                .broader(set(UniversityUnit()))
                .inScheme(new OrganizationTypeFrame())
                .prefLabel(map(entry(EN, "Research Network")))
                .definition(map(entry(EN, """
                        Networks of researchers sharing a research theme or topic; not part of the formal \
                        organization of the University; not limited to the researchers of the University"""
                )));
    }

    static SKOSConceptFrame Institute() {
        return new SKOSConceptFrame()
                .id(uri(UniversityUnit().id()+"/institute"))
                .broader(set(UniversityUnit()))
                .inScheme(new OrganizationTypeFrame())
                .prefLabel(map(entry(EN, "Institute")));
    }

    static SKOSConceptFrame VirtualInstitute() {
        return new SKOSConceptFrame()
                .id(uri(Institute().id()+"/virtual"))
                .broader(set(Institute()))
                .inScheme(new OrganizationTypeFrame())
                .prefLabel(map(entry(EN, "Virtual Institute")));
    }

    static SKOSConceptFrame Department() {
        return new SKOSConceptFrame()
                .id(uri(UniversityUnit().id()+"/department"))
                .broader(set(UniversityUnit()))
                .inScheme(new OrganizationTypeFrame())
                .prefLabel(map(entry(EN, "Department")));
    }

    static SKOSConceptFrame Centre() {
        return new SKOSConceptFrame()
                .id(uri(UniversityUnit().id()+"/centre"))
                .broader(set(UniversityUnit()))
                .inScheme(new OrganizationTypeFrame())
                .prefLabel(map(entry(EN, "Centre")))
                .hiddenLabel(map(entry(EN, set("Center"))));
    }

    static SKOSConceptFrame ResearchCentre() {
        return new SKOSConceptFrame()
                .id(uri(Centre().id()+"/research"))
                .broader(set(Centre()))
                .inScheme(new OrganizationTypeFrame())
                .prefLabel(map(entry(EN, "Research Centre")))
                .hiddenLabel(map(entry(EN, set("Research Center"))));
    }

    static SKOSConceptFrame InterdepartmentalResearchCentre() {
        return new SKOSConceptFrame()
                .id(uri(ResearchCentre().id()+"/interdepartmental"))
                .broader(set(ResearchCentre()))
                .inScheme(new OrganizationTypeFrame())
                .prefLabel(map(entry(EN, "Interdepartmental Research Center")))
                .hiddenLabel(map(entry(EN, set("Interdepartmental Research Center"))));
    }

    static SKOSConceptFrame TransferCentre() {
        return new SKOSConceptFrame()
                .id(uri(Centre().id()+"/transfer"))
                .broader(set(Centre()))
                .inScheme(new OrganizationTypeFrame())
                .prefLabel(map(entry(EN, "Technology Transfer Centre")))
                .hiddenLabel(map(entry(EN, set("Technology Transfer Center"))));
    }

    static SKOSConceptFrame ServiceCentre() {
        return new SKOSConceptFrame()
                .id(uri(Centre().id()+"/service"))
                .broader(set(Centre()))
                .inScheme(new OrganizationTypeFrame())
                .prefLabel(map(entry(EN, "Service Centre")))
                .hiddenLabel(map(entry(EN, set("Service Center"))));
    }

    static SKOSConceptFrame Group() {
        return new SKOSConceptFrame()
                .id(uri(UniversityUnit().id()+"/group"))
                .broader(set(UniversityUnit()))
                .inScheme(new OrganizationTypeFrame())
                .prefLabel(map(entry(EN, "Research Group")));
    }

    static SKOSConceptFrame RecognizedGroup() {
        return new SKOSConceptFrame()
                .id(uri(Group().id()+"/recognized"))
                .broader(set(Group()))
                .inScheme(new OrganizationTypeFrame())
                .prefLabel(map(entry(EN, "Recognized Research Group")));
    }

    static SKOSConceptFrame InformalGroup() {
        return new SKOSConceptFrame()
                .id(uri(Group().id()+"/informal"))
                .broader(set(Group()))
                .inScheme(new OrganizationTypeFrame())
                .prefLabel(map(entry(EN, "Informal Research Group")));
    }

    static SKOSConceptFrame StudentGroup() {
        return new SKOSConceptFrame()
                .id(uri(Group().id()+"/student"))
                .broader(set(Group()))
                .inScheme(new OrganizationTypeFrame())
                .prefLabel(map(entry(EN, "Student Research Group")));
    }

    static SKOSConceptFrame Laboratory() {
        return new SKOSConceptFrame()
                .id(uri(UniversityUnit().id()+"/laboratory"))
                .broader(set(UniversityUnit()))
                .inScheme(new OrganizationTypeFrame())
                .prefLabel(map(entry(EN, "Laboratory")));
    }

    static SKOSConceptFrame Facility() {
        return new SKOSConceptFrame()
                .id(uri(UniversityUnit().id()+"/facility"))
                .broader(set(UniversityUnit()))
                .inScheme(new OrganizationTypeFrame())
                .prefLabel(map(entry(EN, "Research Facility")));
    }

    static SKOSConceptFrame LibraryFacility() {
        return new SKOSConceptFrame()
                .id(uri(Facility().id()+"/library"))
                .broader(set(Facility()))
                .inScheme(new OrganizationTypeFrame())
                .prefLabel(map(entry(EN, "Research Library")));
    }

    static SKOSConceptFrame CollectionFacility() {
        return new SKOSConceptFrame()
                .id(uri(Facility().id()+"/collection"))
                .broader(set(Facility()))
                .inScheme(new OrganizationTypeFrame())
                .prefLabel(map(entry(EN, "Research Collection")))
                .definition(map(entry(EN, "Museum, archive, bio-bank, …")));
    }

    static SKOSConceptFrame InstrumentFacility() {
        return new SKOSConceptFrame()
                .id(uri(Facility().id()+"/instrument"))
                .broader(set(Facility()))
                .inScheme(new OrganizationTypeFrame())
                .prefLabel(map(entry(EN, "Research Instrument")))
                .definition(map(entry(EN, """
                        Large research instrument with dedicated management (telescope, reactor, accelerator, …)"""
                )));
    }

    static SKOSConceptFrame StationFacility() {
        return new SKOSConceptFrame()
                .id(uri(Facility().id()+"/station"))
                .broader(set(Facility()))
                .inScheme(new OrganizationTypeFrame())
                .prefLabel(map(entry(EN, "Research Station")))
                .altLabel(map(entry(EN, set("Research Base"))));
    }


    static void main(final String... args) {
        exec(() -> service(store()).partition(ORGANIZATIONS).update(array(list(Xtream

                .of(

                        new OrganizationTypeFrame(),

                        University(),
                        College(),
                        Association(),
                        City(),
                        Other(),
                        UniversityUnit(),
                        Area(),
                        Network(),
                        Institute(),
                        VirtualInstitute(),
                        Department(),
                        Centre(),
                        ResearchCentre(),
                        InterdepartmentalResearchCentre(),
                        TransferCentre(),
                        ServiceCentre(),
                        Group(),
                        RecognizedGroup(),
                        InformalGroup(),
                        StudentGroup(),
                        Laboratory(),
                        Facility(),
                        LibraryFacility(),
                        CollectionFacility(),
                        InstrumentFacility(),
                        StationFacility()

                )

                .optMap(new Validate<>())

        )), FORCE));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    default URI id() {
        return ORGANIZATIONS;
    }


    @Override
    default Dataset dataset() { return new TaxonomiesFrame(); }


    @Override
    default Map<Locale, String> title() {
        return map(entry(EN, "EC2U Organization Types"));
    }

    @Override
    default Map<Locale, String> description() {
        return map(entry(EN,
                "Standardized terminology for categorizing organizations and their units within the EC2U Alliance"
        ));
    }


    @Override
    default LocalDate issued() {
        return LocalDate.parse("2024-01-01");
    }

    @Override
    default String rights() {
        return COPYRIGHT;
    }

    @Override
    default OrgOrganization publisher() {
        return EC2U;
    }

    @Override
    default Set<Reference> license() {
        return set(CCBYNCND40);
    }

}