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

package eu.ec2u.data.utilities;

import com.metreeca.core.toolkits.Strings;
import com.metreeca.link.Frame;
import com.metreeca.xml.actions.Untag;

import eu.ec2u.data.concepts.Concepts;
import eu.ec2u.data.datasets.events.Events;
import eu.ec2u.data.ontologies.Schema;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.util.Optional;

import static com.metreeca.core.toolkits.Identifiers.md5;
import static com.metreeca.core.toolkits.Strings.TextLength;
import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.iri;
import static com.metreeca.link.Values.literal;

import static eu.ec2u.data.utilities.RSS.*;

public final class WordPress {

    public static Frame WordPress(final Frame frame, final String lang) {

        final Optional<Value> label=frame.string(Title)
                .map(text -> Strings.clip(text, TextLength))
                .map(text -> literal(text, lang));

        final Optional<Value> brief=frame.string(Encoded).or(() -> frame.string(Description))
                .map(Untag::untag)
                .map(text -> Strings.clip(text, TextLength))
                .map(text -> literal(text, lang));

        final Optional<Value> notes=frame.string(Encoded).or(() -> frame.string(Description))
                .map(Untag::untag)
                .map(text -> literal(text, lang));

        return frame(iri(Events.Context, frame.skolemize(Link)))

                .values(RDF.TYPE, Events.Event)

                .value(DCTERMS.CREATED, frame.value(PubDate))
                .value(DCTERMS.SOURCE, frame.value(Link))

                .frames(DCTERMS.SUBJECT, frame.strings(Category)
                        .map(category -> frame(iri(Concepts.Context, md5(category)))
                                .value(RDF.TYPE, SKOS.CONCEPT)
                                .value(RDFS.LABEL, literal(category, lang))
                                .value(SKOS.PREF_LABEL, literal(category, lang))
                        )
                )

                .value(Schema.name, label)
                .value(Schema.disambiguatingDescription, brief)
                .value(Schema.description, notes)
                .value(Schema.url, frame.value(Link));
    }

}
