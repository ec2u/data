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

package eu.ec2u.data.ontologies;

import com.metreeca.link.Shape;

import eu.ec2u.data._cities.*;
import org.eclipse.rdf4j.model.IRI;

import java.util.Set;

import static com.metreeca.core.toolkits.Identifiers.md5;
import static com.metreeca.link.Values.iri;
import static com.metreeca.link.shapes.Localized.localized;

public final class EC2U {

    public static final String Base="https://data.ec2u.eu/";


    public static final Set<String> Languages=Set.of(
            "en",
            Coimbra.Language,
            Iasi.Language,
            Jena.Language,
            Pavia.Language,
            Poitiers.Language,
            Salamanca.Language,
            Turku.Language
    );


    public static IRI item(final String name) {
        return iri(Base, name);
    }

    public static IRI item(final IRI dataset, final IRI university, final String name) {
        return iri(dataset, md5(university+"@"+name));
    }


    public static IRI term(final String name) {
        return iri(item("/terms/"), name);
    }


    public static Shape multilingual() {
        return localized(Languages);
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private EC2U() { }

}
