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

package eu.ec2u.data.tasks.concepts;

import eu.ec2u.data.terms.EC2U;
import org.eclipse.rdf4j.model.IRI;

import static com.metreeca.link.Values.iri;

/**
 * EC2U Research Unit SKOS Concept Schema.
 */
public final class Units {

    public static final IRI Name=EC2U.item("/concepts/units");
    public static final IRI Base=iri(Name, "/");


    public static final IRI Institute=iri(Base, "institute");
    public static final IRI InstituteVirtual=iri(Base, "institute-virtual");
    public static final IRI Centre=iri(Base, "centre");
    public static final IRI CentreResearch=iri(Base, "centre-research");
    public static final IRI CentreTransfer=iri(Base, "centre-transfer");
    public static final IRI Department=iri(Base, "department");
    public static final IRI Laboratory=iri(Base, "laboratory");
    public static final IRI Group=iri(Base, "group");
    public static final IRI GroupRecognized=iri(Base, "group-recognized");
    public static final IRI GroupInformal=iri(Base, "group-informal");
    public static final IRI GroupStudent=iri(Base, "group-student");
    public static final IRI Station=iri(Base, "station");


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Units() { }

}
