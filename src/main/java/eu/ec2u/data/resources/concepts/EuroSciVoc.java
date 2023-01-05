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

package eu.ec2u.data.resources.concepts;

import org.eclipse.rdf4j.model.IRI;

import static com.metreeca.link.Values.iri;

/**
 * European Science Vocabulary (EuroSciVoc).
 *
 * <p>European Science Vocabulary (EuroSciVoc) is the taxonomy of fields of science based on OECD's 2015 Frascati Manual
 * taxonomy. It was extended with fields of science categories extracted from CORDIS content through a semi-automatic
 * process developed with Natural Language Processing (NLP) techniques</p>
 *
 * @see <a
 * href="https://op.europa.eu/en/web/eu-vocabularies/dataset/-/resource?uri=http://publications.europa
 * .eu/resource/dataset/euroscivoc">European
 * Science Vocabulary (EuroSciVoc)</a> .eu/resource/dataset/euroscivoc
 */
public final class EuroSciVoc {

    public static final IRI Scheme=iri(Concepts.Id, "/euro-sci-voc");


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private EuroSciVoc() { }

}
