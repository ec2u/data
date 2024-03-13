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

package eu.ec2u.data.datasets;

import com.metreeca.link.Shape;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDFS;
import org.eclipse.rdf4j.model.vocabulary.VOID;

import static com.metreeca.link.Shape.*;

import static eu.ec2u.data._EC2U.term;
import static eu.ec2u.data.resources.Reference.Reference;
import static eu.ec2u.data.resources.Resource.Resource;

public final class Dataset {

    static final IRI Dataset=term("Dataset");


    public static Shape Dataset() {
        return shape(Resource(),

                property(DCTERMS.AVAILABLE, optional(), instant()), // !!! vs dct:issued?

                property(DCTERMS.RIGHTS, required(), string()),
                property(DCTERMS.ACCESS_RIGHTS, optional(), local()),
                property(DCTERMS.LICENSE, optional(), Reference()),

                property(VOID.URI_SPACE, optional(), string()),
                property(VOID.ENTITIES, optional(), integer()),
                property(RDFS.ISDEFINEDBY, optional(), reference())

        );
    }

    public static Shape Dataset(final Shape shape) {

        if ( shape == null ) {
            throw new NullPointerException("null shape");
        }

        return shape(virtual(true), // !!! make only rdf:member virtual // Dataset(),

                property("members", RDFS.MEMBER, shape)

        );
    }


    private Dataset() { }

}
