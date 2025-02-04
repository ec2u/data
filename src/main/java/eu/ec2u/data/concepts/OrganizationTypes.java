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

import com.metreeca.flow.rdf4j.actions.Upload;

import org.eclipse.rdf4j.model.IRI;

import java.util.stream.Stream;

import static com.metreeca.flow.rdf.formats.RDF.rdf;
import static com.metreeca.flow.toolkits.Resources.resource;
import static com.metreeca.link.Frame.iri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.BASE;
import static eu.ec2u.data.EC2U.update;

/**
 * EC2U Research Unit SKOS Concept Scheme.
 */
public final class OrganizationTypes implements Runnable {

    public static final IRI OrganizationTypes=iri(Concepts.Context, "/organizations");
    public static final IRI UnitTypes=iri(OrganizationTypes, "/university-unit");


    public static final IRI University=iri(OrganizationTypes, "/university");
    public static final IRI College=iri(OrganizationTypes, "/college");
    public static final IRI Association=iri(OrganizationTypes, "/association");
    public static final IRI City=iri(OrganizationTypes, "/city");
    public static final IRI Other=iri(OrganizationTypes, "/other");

    public static final IRI Area=iri(UnitTypes, "/area");
    public static final IRI Network=iri(UnitTypes, "/network");
    public static final IRI Institute=iri(UnitTypes, "/institute");
    public static final IRI InstituteVirtual=iri(UnitTypes, "/institute/virtual");
    public static final IRI Centre=iri(UnitTypes, "/centre");
    public static final IRI CentreResearch=iri(UnitTypes, "/centre/research");
    public static final IRI CentreResearchInterdepartmental=iri(UnitTypes, "/centre/research/interdepartmental");
    public static final IRI CentreTransfer=iri(UnitTypes, "/centre/transfer");
    public static final IRI CentreService=iri(UnitTypes, "/centre/service");
    public static final IRI Department=iri(UnitTypes, "/department");
    public static final IRI Laboratory=iri(UnitTypes, "/laboratory");
    public static final IRI Group=iri(UnitTypes, "/group");
    public static final IRI GroupRecognized=iri(UnitTypes, "/group/recognized");
    public static final IRI GroupInformal=iri(UnitTypes, "/group/informal");
    public static final IRI GroupStudent=iri(UnitTypes, "/group-student");
    public static final IRI Facility=iri(UnitTypes, "/facility");
    public static final IRI FacilityLibrary=iri(UnitTypes, "/facility/library");
    public static final IRI FacilityCollection=iri(UnitTypes, "/facility/collection");
    public static final IRI FacilityInstrument=iri(UnitTypes, "/facility/instrument");
    public static final IRI FacilityStation=iri(UnitTypes, "/facility/station");


    public static void main(final String... args) {
        exec(() -> new OrganizationTypes().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        update(connection -> Stream

                .of(rdf(resource(this, ".ttl"), BASE))

                .forEach(new Upload()
                        .contexts(OrganizationTypes)
                        .clear(true)
                )

        );
    }

}
