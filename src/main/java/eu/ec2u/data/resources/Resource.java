
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

package eu.ec2u.data.resources;

import com.metreeca.link.Shape;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDFS;

import static com.metreeca.link.Shape.*;

import static eu.ec2u.data._EC2U.term;
import static eu.ec2u.data.concepts.Concepts.SKOSConcept;
import static eu.ec2u.data.resources.Resources.Reference;
import static eu.ec2u.data.universities.Universities.University;

public abstract class Resource {

    public static final IRI university=term("university");


    public static Shape Resource() {
        return shape(Reference(),

                property(university, () -> shape(required(), University())),

                property(DCTERMS.TITLE, required(), local()),
                property(DCTERMS.ALTERNATIVE, optional(), local()),
                property(DCTERMS.DESCRIPTION, optional(), local()),

                property(DCTERMS.CREATED, optional(), dateTime()),
                property(DCTERMS.ISSUED, optional(), dateTime()),
                property(DCTERMS.MODIFIED, optional(), dateTime()),

                property(DCTERMS.SOURCE, () -> shape(optional(), Resource())),
                property(DCTERMS.PUBLISHER, () -> shape(optional(), Publisher.Publisher())),

                property(DCTERMS.TYPE, () -> shape(SKOSConcept())),
                property(DCTERMS.SUBJECT, () -> shape(SKOSConcept())),

                property(RDFS.SEEALSO, reference())

        );
    }

}
