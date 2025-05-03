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

import com.metreeca.flow.json.actions.Validate;
import com.metreeca.flow.text.services.Translator;
import com.metreeca.flow.work.Xtream;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Namespace;

import eu.ec2u.data.resources.Reference;
import eu.ec2u.data.resources.Resource;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.taxonomies.TopicFrame;
import eu.ec2u.data.things.SchemaOrganization;
import eu.ec2u.work.ai.Embedder;

import java.util.Locale;
import java.util.Map;
import java.util.Optional;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.text.services.Translator.translator;
import static com.metreeca.mesh.util.Collections.*;

import static eu.ec2u.data.organizations.Organizations.ORGANIZATIONS;
import static eu.ec2u.data.resources.Localized.EN;
import static eu.ec2u.data.taxonomies.EC2UOrganizations.EC2U_ORGANIZATIONS;
import static java.util.function.Predicate.not;

@Frame
@Namespace("[ec2u]")
public interface Organization extends Resource, OrgOrganization, SchemaOrganization {

    double CLASSIFICATIOION_THRESHOLD=0.4;


    static Optional<OrganizationFrame> review(final OrganizationFrame document, final Locale source) {

        if ( document == null ) {
            throw new NullPointerException("null document");
        }

        if ( source == null ) {
            throw new NullPointerException("null source");
        }

        return Optional.of(document)
                .map(d -> translate(d, source)) // before English-based classification
                .map(v -> classification(v))
                .flatMap(new Validate<>());
    }


    private static OrganizationFrame translate(final OrganizationFrame document, final Locale source) {

        final Translator translator=service(translator());

        return document // translate also customized labels/comments ;(translated text must be clipped again)
                .label(Reference.label(translator.texts(document.label(), source, EN)))
                .comment(Reference.comment(translator.texts(document.comment(), source, EN)))
                .prefLabel(translator.texts(document.prefLabel(), source, EN))
                .definition(translator.texts(document.definition(), source, EN));
    }

    private static OrganizationFrame classification(final OrganizationFrame document) {
        return document.classification().isEmpty() ? document.classification(set(Resources
                .match(EC2U_ORGANIZATIONS, embeddable(document), CLASSIFICATIOION_THRESHOLD)
                .map(uri -> new TopicFrame(true).id(uri))
                .limit(3)
        )) : document;
    }

    private static String embeddable(final Organization document) {
        return Embedder.embeddable(set(Xtream.from(
                Optional.ofNullable(document.prefLabel().get(EN)).stream(),
                Optional.ofNullable(document.definition().get(EN)).stream()
        )));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    default Map<Locale, String> label() {
        return Reference.label(
                Optional.ofNullable(acronym()).filter(not(String::isEmpty))
                        .map(acronym -> map(prefLabel().entrySet().stream().map(e ->
                                entry(e.getKey(), "%s - %s".formatted(acronym, e.getValue()))
                        )))
                        .orElseGet(this::prefLabel)
        );
    }

    @Override
    default Map<Locale, String> comment() {
        return Reference.comment(definition());
    }


    @Override
    default Map<Locale, String> name() { return prefLabel(); }

    @Override
    default Map<Locale, String> description() { return definition(); }


    @Override
    default Organizations collection() {
        return ORGANIZATIONS;
    }

}
