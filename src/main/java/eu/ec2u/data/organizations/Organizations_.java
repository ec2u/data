/*
 * Copyright © 2020-2025 EC2U Alliance
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

package eu.ec2u.data.organizations;


import eu.ec2u.data.things.Schema;
import eu.ec2u.work._junk.Frame;
import eu.ec2u.work.focus.Focus;

import java.util.Optional;

import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.EC2U.skolemize;
import static eu.ec2u.work._junk.Frame.*;
import static org.eclipse.rdf4j.model.util.Values.literal;
import static org.eclipse.rdf4j.model.vocabulary.RDF.TYPE;
import static org.eclipse.rdf4j.model.vocabulary.XSD.ID;

public final class Organizations_ {

    public static Optional<Frame> organization(final Focus focus, final String lang) {
        return Optional

                .of(frame(

                        field(ID, item(Organizations.Context, skolemize(focus, Schema.name, Schema.legalName))),

                        field(TYPE, Schema.Organization),

                        field(Schema.url, focus.seq(Schema.url).value()),
                        field(Schema.identifier, focus.seq(Schema.identifier).value()),

                        field(Schema.image, focus.seq(Schema.identifier)
                                .value()
                                .map(iri -> frame(
                                        field(ID, iri),
                                        field(TYPE, Schema.ImageObject),
                                        field(Schema.url, iri)
                                ))
                        ),

                        field(Schema.name, focus.seq(Schema.name).value(asString()).map(v -> literal(v, lang))),
                        field(Schema.legalName, focus.seq(Schema.legalName).value(asString()).map(v -> literal(v, lang))),

                        field(Schema.description, focus.seq(Schema.description).value(asString()).map(v -> literal(v, lang))),
                        field(Schema.disambiguatingDescription, focus.seq(Schema.disambiguatingDescription).value(asString()).map(v -> literal(v, lang))),

                        field(Schema.email, focus.seq(Schema.email).value()),
                        field(Schema.telephone, focus.seq(Schema.telephone).value())

                ))

                .filter(frame -> frame.value(Schema.name).isPresent());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Organizations_() { }

}
