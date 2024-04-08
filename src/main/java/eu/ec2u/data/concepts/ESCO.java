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

import org.eclipse.rdf4j.model.IRI;

import static com.metreeca.link.Frame.iri;


public final class ESCO {

    // https://esco.ec.europa.eu/en/classification/occupation_main

    public static final IRI Occupations=iri(Concepts.Context, "/esco-occupations");


    // https://esco.ec.europa.eu/en/classification/skill_main

    public static final IRI Skills=iri(Concepts.Context, "/esco-skils");


    // https://esco.ec.europa.eu/en/classification/qualifications

    public static final IRI Qualifications=iri(Concepts.Context, "/esco-qualifications");

}
