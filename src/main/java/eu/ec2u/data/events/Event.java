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

package eu.ec2u.data.events;

import com.metreeca.flow.json.actions.Validate;
import com.metreeca.flow.text.services.Translator;
import com.metreeca.flow.work.Xtream;
import com.metreeca.mesh.meta.jsonld.Class;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Namespace;

import eu.ec2u.data.resources.Reference;
import eu.ec2u.data.resources.Resource;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.taxonomies.TopicFrame;
import eu.ec2u.work.ai.Embedder;

import java.util.Locale;
import java.util.Map;
import java.util.Optional;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.text.services.Translator.translator;
import static com.metreeca.mesh.util.Collections.set;

import static eu.ec2u.data.events.Events.EVENTS;
import static eu.ec2u.data.resources.Localized.EN;
import static eu.ec2u.data.taxonomies.EC2UStakeholders.EC2U_STAKEHOLDERS;

@Frame
@Class("ec2u:")
@Namespace("[ec2u]")
public interface Event extends Resource, SchemaEvent {

    double SUBJECT_THRESHOLD=0.4;
    double AUDIENCE_THRESHOLD=0.4;


    static Optional<EventFrame> review(final EventFrame event, final Locale source) {

        if ( event == null ) {
            throw new NullPointerException("null event");
        }

        if ( source == null ) {
            throw new NullPointerException("null source");
        }

        return Optional.of(event)
                .map(d -> translate(d, source)) // before English-based classification
                .map(v -> subject(v))
                .map(v -> audience(v))
                .flatMap(new Validate<>());
    }


    private static EventFrame translate(final EventFrame event, final Locale source) {

        final Translator translator=service(translator());

        return event // translate also customized labels/comments ;(translated text must be clipped again)
                .label(Reference.label(translator.texts(event.label(), source, EN)))
                .comment(Reference.comment(translator.texts(event.comment(), source, EN)))
                .name(translator.texts(event.name(), source, EN))
                .description(translator.texts(event.description(), source, EN));
    }

    private static EventFrame subject(final EventFrame event) {
        return event;
    }

    private static EventFrame audience(final EventFrame event) {
        return event.audience().isEmpty() ? event.audience(set(Resources
                .match(EC2U_STAKEHOLDERS, embeddable(event), AUDIENCE_THRESHOLD)
                .map(uri -> new TopicFrame(true).id(uri))
                .limit(1)
        )) : event;
    }

    private static String embeddable(final Event event) {
        return Embedder.embeddable(set(Xtream.from(
                Optional.ofNullable(event.name().get(EN)).stream(),
                Optional.ofNullable(event.description().get(EN)).stream()
        )));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    default Map<Locale, String> label() {
        return Reference.label(name());
    }

    @Override
    default Map<Locale, String> comment() {
        return Reference.comment(description());
    }


    @Override
    default Events collection() {
        return EVENTS;
    }

}
