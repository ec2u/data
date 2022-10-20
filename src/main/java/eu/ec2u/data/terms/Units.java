/*
 * Copyright © 2020-2022 EC2U Alliance
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

package eu.ec2u.data.terms;

import org.eclipse.rdf4j.model.IRI;

import static com.metreeca.link.Values.iri;

/**
 * EC2U Research Unit SKOS Concept Schema.
 */
public final class Units {

    public static final IRI Name=EC2U.item("/concepts/units");
    public static final IRI Base=iri(Name, "/");


    public static final IRI Institute=iri(Base, "institute");
    public static final IRI Center=iri(Base, "center");
    public static final IRI Department=iri(Base, "department");
    public static final IRI Laboratory=iri(Base, "laboratory");
    public static final IRI Group=iri(Base, "group");
    public static final IRI GroupRecognized=iri(Base, "group-recognized");
    public static final IRI GroupInformal=iri(Base, "group-informal");


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Units() { }

}
