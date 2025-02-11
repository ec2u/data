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

package eu.ec2u.data.datasets.documents;

import com.metreeca.flow.Xtream;
import com.metreeca.flow.json.actions.Validate;
import com.metreeca.flow.text.services.Translator;
import com.metreeca.mesh.meta.jsonld.*;
import com.metreeca.mesh.meta.jsonld.Class;
import com.metreeca.mesh.meta.shacl.Pattern;
import com.metreeca.mesh.meta.shacl.Required;

import eu.ec2u.data.datasets.Localized;
import eu.ec2u.data.datasets.Reference;
import eu.ec2u.data.datasets.Resource;
import eu.ec2u.data.datasets.organizations.Organization;
import eu.ec2u.data.datasets.persons.Person;
import eu.ec2u.data.datasets.taxonomies.Taxonomies;
import eu.ec2u.data.datasets.taxonomies.Topic;
import eu.ec2u.work.ai.Embedder;

import java.net.URI;
import java.time.LocalDate;
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
import static eu.ec2u.data.datasets.documents.Documents.DOCUMENTS;
import static eu.ec2u.data.datasets.taxonomies.TopicsEC2UDocuments.EC2U_DOCUMENTS;
import static eu.ec2u.data.datasets.taxonomies.TopicsEC2UStakeholders.EC2U_STAKEHOLDERS;
import static java.util.function.Predicate.not;

@Frame
@Class("ec2u:")
@Namespace(prefix="[dct]", value="http://purl.org/dc/terms/")
@Namespace(prefix="schema", value="https://schema.org/")
public interface Document extends Resource {

    static Optional<DocumentFrame> review(final DocumentFrame document) {

        if ( document == null ) {
            throw new NullPointerException("null document");
        }

        return Optional.of(document) // translate before English-based classification
                .map(d -> localize(d, locale -> translate(d, locale)))
                .map(d -> type(d))
                .map(d -> subject(d))
                .map(d -> audience(d))
                .flatMap(new Validate<>());
    }


    private static DocumentFrame translate(final DocumentFrame document, final Locale source) {

        final Translator translator=service(translator());

        return document // translate also customized labels/comments ;(translated text must be clipped again)
                .label(Reference.label(translator.texts(document.label(), source, EN)))
                .comment(Reference.comment(translator.texts(document.comment(), source, EN)))
                .title(translator.texts(document.title(), source, EN))
                .description(translator.texts(document.description(), source, EN));
    }

    private static DocumentFrame type(final DocumentFrame document) {
        return document.type(Optional.ofNullable(document.type())
                .filter(not(Set::isEmpty))
                .orElseGet(() -> set(Stream.of(embeddable(document))
                        .flatMap(documents())
                        .limit(3)
                ))
        );
    }

    private static DocumentFrame subject(final DocumentFrame document) {
        return document; // !!!
    }

    private static DocumentFrame audience(final DocumentFrame document) {
        return document.audience(Optional.ofNullable(document.audience())
                .filter(not(Set::isEmpty))
                .orElseGet(() -> set(Stream.of(embeddable(document))
                        .flatMap(stakeholders())
                        .limit(1)
                ))
        );
    }


    private static String embeddable(final Document document) {
        return Embedder.embeddable(set(Xtream.from(
                Optional.ofNullable(document.title().get(EN)).stream(),
                Optional.ofNullable(document.description().get(EN)).stream()
        )));
    }


    private static Taxonomies.Matcher documents() {
        return new Taxonomies.Matcher(EC2U_DOCUMENTS)
                .threshold(0.6);
    }

    private static Taxonomies.Matcher stakeholders() {
        return new Taxonomies.Matcher(EC2U_STAKEHOLDERS)
                .threshold(0.6);
    }




    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    default Map<Locale, String> label() {
        return Reference.label(title());
    }

    @Override
    default Map<Locale, String> comment() {
        return Reference.comment(description());
    }


    @Override
    default Documents dataset() {
        return DOCUMENTS;
    }


    @Forward("schema:")
    Set<URI> url();

    String identifier();


    @Pattern(LANGUAGE_PATTERN)
    Set<String> language();


    @Required
    @Localized
    Map<Locale, String> title();

    @Localized
    Map<Locale, String> description();


    @Embedded
    Person creator();

    @Embedded
    Set<Person> contributor();

    @Embedded
    Organization publisher();


    LocalDate created();

    LocalDate issued();

    LocalDate modified();


    String valid();

    String rights();

    @Localized
    Map<Locale, String> accessRights();

    Reference license();


    Set<Topic> type();

    Set<Topic> subject();

    Set<Topic> audience();


    Set<Document> relation();

}
