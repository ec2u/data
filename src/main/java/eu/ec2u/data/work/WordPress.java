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

package eu.ec2u.data.work;

import com.metreeca.core.Strings;
import com.metreeca.link.Frame;

import eu.ec2u.data.terms.EC2U;
import eu.ec2u.data.terms.Schema;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.util.Optional;

import static com.metreeca.core.Identifiers.md5;
import static com.metreeca.core.Strings.TextLength;
import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.iri;
import static com.metreeca.link.Values.literal;

import static eu.ec2u.data.work.RSS.*;
import static eu.ec2u.data.work.Work.localize;

public final class WordPress {

    public static Frame WordPress(final Frame frame, final String lang) {

        final Optional<Value> label=frame.string(Title)
                .map(text -> Strings.clip(text, TextLength))
                .map(text -> literal(text, lang));

        final Optional<Value> brief=frame.string(Encoded)
                .map(text -> Strings.clip(text, TextLength))
                .map(text -> literal(text, lang));

        return frame(iri(EC2U.events, frame.skolemize(Link)))

                .values(RDF.TYPE, Schema.Event)

                .value(DCTERMS.CREATED, frame.value(PubDate))
                .value(DCTERMS.SOURCE, frame.value(Link))

                .frames(DCTERMS.SUBJECT, frame.strings(Category)
                        .map(category -> frame(iri(EC2U.concepts, md5(category)))
                                .value(RDF.TYPE, SKOS.CONCEPT)
                                .value(RDFS.LABEL, literal(category, lang))
                                .value(SKOS.PREF_LABEL, literal(category, lang))
                        )
                )

                .value(Schema.name, label)
                .value(Schema.disambiguatingDescription, brief)
                .value(Schema.description, frame.value(Encoded).map(value -> localize(value, lang)))
                .value(Schema.url, frame.value(Link));
    }

}
