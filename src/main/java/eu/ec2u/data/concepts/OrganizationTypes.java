/*
 * Copyright © 2020-2024 EC2U Alliance
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

import com.metreeca.http.rdf4j.actions.Upload;

import org.eclipse.rdf4j.model.IRI;

import java.util.stream.Stream;

import static com.metreeca.http.rdf.formats.RDF.rdf;
import static com.metreeca.http.toolkits.Resources.resource;
import static com.metreeca.link.Frame.iri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.Data.txn;
import static eu.ec2u.data.EC2U.Base;

/**
 * EC2U Research Unit SKOS Concept Scheme.
 */
public final class OrganizationTypes implements Runnable {

    public static final IRI Scheme=iri(Concepts.Context, "/organizations");
    public static final IRI Unit=iri(Scheme, "/university-unit");


    public static final IRI Area=iri(Unit, "/area");
    public static final IRI Network=iri(Unit, "/network");
    public static final IRI Institute=iri(Unit, "/institute");
    public static final IRI InstituteVirtual=iri(Unit, "/institute/virtual");
    public static final IRI Centre=iri(Unit, "/centre");
    public static final IRI CentreResearch=iri(Unit, "/centre/research");
    public static final IRI CentreTransfer=iri(Unit, "/centre/transfer");
    public static final IRI Department=iri(Unit, "/department");
    public static final IRI Laboratory=iri(Unit, "/laboratory");
    public static final IRI Group=iri(Unit, "/group");
    public static final IRI GroupRecognized=iri(Unit, "/group/recognized");
    public static final IRI GroupInformal=iri(Unit, "/group/informal");
    public static final IRI GroupStudent=iri(Unit, "/group-student");
    public static final IRI Facility=iri(Unit, "/facility");
    public static final IRI FacilityLibrary=iri(Unit, "/facility/library");
    public static final IRI FacilityCollection=iri(Unit, "/facility/collection");
    public static final IRI FacilityInstrument=iri(Unit, "/facility/instrument");
    public static final IRI FacilityStation=iri(Unit, "/facility/station");


    public static void main(final String... args) {
        exec(() -> new OrganizationTypes().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        txn(
                this::upload,
                Concepts::update
        );
    }


    private void upload() {
        Stream

                .of(rdf(resource(this, ".ttl"), Base))

                .forEach(new Upload()
                        .contexts(Scheme)
                        .clear(true)
                );
    }

}
