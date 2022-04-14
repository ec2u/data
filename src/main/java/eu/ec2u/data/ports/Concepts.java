/***********************************************************************************************************************
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
 **********************************************************************************************************************/

package eu.ec2u.data.ports;

import com.metreeca.json.Shape;
import com.metreeca.rest.Handler;

import eu.ec2u.data.terms.EC2U;
import org.eclipse.rdf4j.model.vocabulary.OWL;
import org.eclipse.rdf4j.model.vocabulary.SKOS;

import static com.metreeca.json.Values.inverse;
import static com.metreeca.json.shapes.Clazz.clazz;
import static com.metreeca.json.shapes.Field.field;
import static com.metreeca.json.shapes.Guard.*;
import static com.metreeca.json.shapes.Lang.lang;
import static com.metreeca.json.shapes.Link.link;
import static com.metreeca.json.shapes.Localized.localized;
import static com.metreeca.rest.handlers.Router.router;
import static com.metreeca.rest.operators.Relator.relator;
import static com.metreeca.rest.wrappers.Driver.driver;

public final class Concepts extends Handler.Base {

    private static Shape label() {
        return field("label", SKOS.PREF_LABEL,
                localized(), convey(lang("en", "it", "fr", "pt", "es", "fi", "ro", "de"))
        );
    }


    public Concepts() {
        delegate(driver(relate(

                filter(clazz(EC2U.Theme)),

                link(OWL.SAMEAS,

                        label(), detail(

                                field("broader", SKOS.BROADER_TRANSITIVE, label(), link(inverse(OWL.SAMEAS))),

                                field(SKOS.NARROWER, label(), link(inverse(OWL.SAMEAS))),
                                field(SKOS.RELATED, label(), link(inverse(OWL.SAMEAS)))

                        ))

        )).wrap(router()

                .path("/", router()
                        .get(relator())
                )

                .path("/*", router()
                        .get(relator())
                )

        ));
    }

}