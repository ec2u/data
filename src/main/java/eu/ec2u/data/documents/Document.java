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

package eu.ec2u.data.documents;

import com.metreeca.flow.json.actions.Validate;
import com.metreeca.flow.text.services.Translator;
import com.metreeca.flow.work.Xtream;
import com.metreeca.mesh.meta.jsonld.Class;
import com.metreeca.mesh.meta.jsonld.Forward;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Namespace;
import com.metreeca.mesh.meta.shacl.MaxLength;
import com.metreeca.mesh.meta.shacl.Required;

import eu.ec2u.data.organizations.OrgOrganization;
import eu.ec2u.data.persons.Person;
import eu.ec2u.data.resources.Localized;
import eu.ec2u.data.resources.Reference;
import eu.ec2u.data.resources.Resource;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.taxonomies.EC2UDocuments;
import eu.ec2u.data.taxonomies.EC2UStakeholders;
import eu.ec2u.data.taxonomies.Topic;
import eu.ec2u.data.taxonomies.TopicFrame;
import eu.ec2u.work.ai.Embedder;

import java.net.URI;
import java.time.LocalDate;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.text.services.Translator.translator;
import static com.metreeca.mesh.util.Collections.set;

import static eu.ec2u.data.documents.Documents.DOCUMENTS;
import static eu.ec2u.data.resources.Localized.EN;

@Frame
@Class("ec2u:")
@Namespace(prefix="[dct]", value="http://purl.org/dc/terms/")
@Namespace(prefix="schema", value="https://schema.org/")
public interface Document extends Resource {

    int TITLE_LENGTH=500;
    int DESCRIPTION_LENGTH=5000;

    double TYPE_THRESHOLD=0.6;
    double SUBJECT_THRESHOLD=0.6;
    double AUDIENCE_THRESHOLD=0.6;


    static Optional<DocumentFrame> review(final DocumentFrame document, final Locale source) {

        if ( document == null ) {
            throw new NullPointerException("null document");
        }

        if ( source == null ) {
            throw new NullPointerException("null source");
        }

        return Optional.of(document)
                .map(d -> translate(d, source)) // before English-based classification
                .map(v -> type(v))
                .map(v -> subject(v))
                .map(v -> audience(v))
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
        return document.type().isEmpty() ? document.type(set(Resources
                .match(EC2UDocuments.EC2U_DOCUMENTS.id(), embeddable(document), TYPE_THRESHOLD)
                .map(uri -> new TopicFrame(true).id(uri))
                .limit(3)
        )) : document;
    }

    private static DocumentFrame subject(final DocumentFrame document) {
        return document;
    }

    private static DocumentFrame audience(final DocumentFrame document) {
        return document.audience().isEmpty() ? document.audience(set(Resources
                .match(EC2UStakeholders.EC2U_STAKEHOLDERS.id(), embeddable(document), AUDIENCE_THRESHOLD)
                .map(uri -> new TopicFrame(true).id(uri))
                .limit(1)
        )) : document;
    }

    private static String embeddable(final Document document) {
        return Embedder.embeddable(set(Xtream.from(
                Optional.ofNullable(document.title().get(EN)).stream(),
                Optional.ofNullable(document.description().get(EN)).stream()
        )));
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
    default Documents collection() {
        return DOCUMENTS;
    }


    @Forward("schema:")
    Set<URI> url();


    String identifier();

    Set<String> language();


    @Required
    @Localized
    @MaxLength(TITLE_LENGTH)
    Map<Locale, String> title();

    @Localized
    @MaxLength(DESCRIPTION_LENGTH)
    Map<Locale, String> description();


    Person creator();

    Set<Person> contributor();

    OrgOrganization publisher();


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
