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

package eu.ec2u.data.datasets.events;

import com.metreeca.flow.Xtream;
import com.metreeca.flow.json.actions.Validate;
import com.metreeca.flow.text.services.Translator;
import com.metreeca.mesh.meta.jsonld.Class;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Hidden;
import com.metreeca.mesh.meta.jsonld.Namespace;
import com.metreeca.mesh.meta.shacl.Pattern;

import eu.ec2u.data.datasets.Reference;
import eu.ec2u.data.datasets.Resource;
import eu.ec2u.data.datasets.organizations.Organization;
import eu.ec2u.data.datasets.taxonomies.Taxonomies;
import eu.ec2u.data.datasets.taxonomies.Topic;
import eu.ec2u.data.datasets.taxonomies.TopicsEC2UEvents;
import eu.ec2u.data.datasets.taxonomies.TopicsEC2UStakeholders;
import eu.ec2u.data.vocabularies.schema.SchemaEvent;
import eu.ec2u.work.ai.Embedder;

import java.time.ZonedDateTime;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.text.services.Translator.translator;
import static com.metreeca.shim.Collections.set;

import static eu.ec2u.data.datasets.Localized.EN;
import static eu.ec2u.data.datasets.Resource.localize;
import static eu.ec2u.data.datasets.events.Events.EVENTS;
import static eu.ec2u.data.datasets.taxonomies.TopicsEC2UEvents.EC2U_EVENTS;
import static eu.ec2u.data.datasets.taxonomies.TopicsEC2UStakeholders.EC2U_STAKEHOLDERS;
import static java.util.function.Predicate.not;

@Frame
@Class("ec2u:")
@Namespace("[ec2u]")
public interface Event extends Resource, SchemaEvent {

    static Optional<EventFrame> review(final EventFrame event) {

        if ( event == null ) {
            throw new NullPointerException("null event");
        }

        return Optional.of(event) // translate before English-based classification
                .map(e -> localize(e, locale -> translate(e, locale)))
                .map(e -> about(e))
                .map(e -> audience(e))
                .flatMap(new Validate<>());
    }


    private static EventFrame translate(final EventFrame event, final Locale source) {

        final Translator translator=service(translator());

        return event // translate also customized labels/comments ;(translated text must be clipped again)
                .label(Reference.label(translator.texts(event.label(), source, EN)))
                .comment(Reference.comment(translator.texts(event.comment(), source, EN)))
                .name(translator.texts(event.name(), source, EN))
                .description(translator.texts(event.description(), source, EN))
                .disambiguatingDescription(translator.texts(event.disambiguatingDescription(), source, EN));
    }

    private static EventFrame about(final EventFrame event) {
        return event.about(Optional.ofNullable(event.about())
                .filter(not(Set::isEmpty))
                .orElseGet(() -> set(Stream.of(embeddable(event))
                        .flatMap(events())
                        .limit(1)
                ))
        );
    }

    private static EventFrame audience(final EventFrame event) {
        return event.about(Optional.ofNullable(event.about())
                .filter(not(Set::isEmpty))
                .orElseGet(() -> set(Stream.of(embeddable(event))
                        .flatMap(stakeholders())
                        .limit(1)
                ))
        );
    }


    private static String embeddable(final Event event) {
        return Embedder.embeddable(set(Xtream.from(
                Optional.ofNullable(event.name().get(EN)).stream(),
                Optional.ofNullable(event.description().get(EN)).stream()
        )));
    }


    static Taxonomies.Matcher events() {
        return new Taxonomies.Matcher(EC2U_EVENTS)
                .threshold(0.6);
    }

    static Taxonomies.Matcher stakeholders() {
        return new Taxonomies.Matcher(EC2U_STAKEHOLDERS)
                .threshold(0.6);
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    default Map<Locale, String> label() {
        return Reference.label(name());
    }

    @Override
    default Map<Locale, String> comment() {
        return Reference.comment(disambiguatingDescription(), description());
    }


    @Override
    default Events dataset() {
        return EVENTS;
    }


    @Override
    Organization publisher();


    @Override
    @Pattern("^"+TopicsEC2UEvents.PATH+".*$") // !!! @Prefix
    Set<Topic> about();

    @Override
    @Pattern("^"+TopicsEC2UStakeholders.PATH+".*$") // !!! @Prefix
    Set<Topic> audience();


    /**
     * Last validity dateTime.
     *
     * <p>Supports stale event {@linkplain Events.Reaper reaping}.</p>
     *
     * @return the latest between {@link #startDate()} and {@link #endDate()}
     */
    @Hidden
    default ZonedDateTime validDate() {
        return endDate() != null ? endDate() : startDate();
    }

}
