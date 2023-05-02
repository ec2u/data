/*
 * Copyright © 2020-2023 EC2U Alliance
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

import com.metreeca.rdf4j.actions.Upload;

import eu.ec2u.data.EC2U;
import org.eclipse.rdf4j.model.IRI;

import java.util.stream.Stream;

import static com.metreeca.rdf.Values.iri;
import static com.metreeca.rdf.formats.RDF.rdf;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.item;

/**
 * EC2U Research Unit SKOS Concept Scheme.
 */
public final class UnitTypes implements Runnable {

    public static final IRI Scheme=item("/concepts/units");


    public static final IRI Area=iri(Scheme, "/area");
    public static final IRI Network=iri(Scheme, "/network");
    public static final IRI Institute=iri(Scheme, "/institute");
    public static final IRI InstituteVirtual=iri(Scheme, "/institute/virtual");
    public static final IRI Centre=iri(Scheme, "/centre");
    public static final IRI CentreResearch=iri(Scheme, "/centre/research");
    public static final IRI CentreTransfer=iri(Scheme, "/centre/transfer");
    public static final IRI Department=iri(Scheme, "/department");
    public static final IRI Laboratory=iri(Scheme, "/laboratory");
    public static final IRI Group=iri(Scheme, "/group");
    public static final IRI GroupRecognized=iri(Scheme, "/group/recognized");
    public static final IRI GroupInformal=iri(Scheme, "/group/informal");
    public static final IRI GroupStudent=iri(Scheme, "/group-student");
    public static final IRI Facility=iri(Scheme, "/facility");
    public static final IRI FacilityLibrary=iri(Scheme, "/facility/library");
    public static final IRI FacilityCollection=iri(Scheme, "/facility/collection");
    public static final IRI FacilityInstrument=iri(Scheme, "/facility/instrument");
    public static final IRI FacilityStation=iri(Scheme, "/facility/station");


    public static void main(final String... args) {
        exec(() -> new UnitTypes().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        Stream

                .of(rdf(this, ".ttl", EC2U.Base))

                .forEach(new Upload()
                        .contexts(Scheme)
                        .clear(true)
                );
    }

}
