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

package eu.ec2u.work.feeds;

import com.metreeca.flow.xml.actions.Untag;
import com.metreeca.link.Frame;

import eu.ec2u.data.events.Events;
import eu.ec2u.data.things.Schema;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.SKOS;

import java.util.Optional;

import static com.metreeca.flow.toolkits.Strings.TextLength;
import static com.metreeca.flow.toolkits.Strings.clip;
import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.EC2U.skolemize;
import static eu.ec2u.work.feeds.RSS.*;

public final class WordPress {

    public static Frame WordPress(final Frame frame, final String lang) {

        final Optional<Value> name=frame.value(Title, asString())
                .map(text -> clip(text, TextLength))
                .map(text -> literal(text, lang));

        final Optional<Value> disambiguatingDescription=frame.value(Encoded, asString())
                .or(() -> frame.value(Description, asString()))

                .map(Untag::untag)
                .map(text -> clip(text, TextLength))
                .map(text -> literal(text, lang));

        final Optional<Value> description=frame.value(Encoded, asString())
                .or(() -> frame.value(Description, asString()))

                .map(Untag::untag)
                .map(text -> literal(text, lang));

        return frame(

                field(ID, iri(Events.Context, skolemize(frame, Link))),

                field(RDF.TYPE, Events.Event),

                field(Schema.url, frame.value(Link)),
                field(Schema.name, name),
                field(Schema.disambiguatingDescription, disambiguatingDescription),
                field(Schema.description, description),

                field(Schema.about, frame.values(Category, asString()).map(category -> frame(

                        field(ID, item(Events.Topics, category)),

                        field(RDF.TYPE, SKOS.CONCEPT),
                        field(SKOS.TOP_CONCEPT_OF, Events.Topics),
                        field(SKOS.PREF_LABEL, literal(category, lang))

                )))

        );
    }

}
