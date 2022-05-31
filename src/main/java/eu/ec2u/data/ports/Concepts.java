/*
 * Copyright © 2021-2022 EC2U Consortium
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

package eu.ec2u.data.ports;

import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.handlers.Router;
import com.metreeca.jsonld.handlers.Driver;
import com.metreeca.jsonld.handlers.Relator;
import com.metreeca.link.Shape;

import eu.ec2u.data.terms.EC2U;
import org.eclipse.rdf4j.model.vocabulary.OWL;
import org.eclipse.rdf4j.model.vocabulary.SKOS;

import static com.metreeca.http.Handler.handler;
import static com.metreeca.link.Values.inverse;
import static com.metreeca.link.shapes.Clazz.clazz;
import static com.metreeca.link.shapes.Field.field;
import static com.metreeca.link.shapes.Guard.*;
import static com.metreeca.link.shapes.Lang.lang;
import static com.metreeca.link.shapes.Link.link;
import static com.metreeca.link.shapes.Localized.localized;

public final class Concepts extends Delegator {

    private static Shape label() {
        return field("label", SKOS.PREF_LABEL,
                localized(), convey(lang("en", "it", "fr", "pt", "es", "fi", "ro", "de"))
        );
    }


    public Concepts() {
        delegate(handler(

                new Driver(relate(

                        filter(clazz(EC2U.Theme)),

                        link(OWL.SAMEAS,

                                label(), detail(

                                        field("broader", SKOS.BROADER_TRANSITIVE, label(), link(inverse(OWL.SAMEAS))),

                                        field(SKOS.NARROWER, label(), link(inverse(OWL.SAMEAS))),
                                        field(SKOS.RELATED, label(), link(inverse(OWL.SAMEAS)))

                                ))

                )),

                new Router()

                        .path("/", new Router()
                                .get(new Relator())
                        )

                        .path("/*", new Router()
                                .get(new Relator())
                        )

        ));
    }

}