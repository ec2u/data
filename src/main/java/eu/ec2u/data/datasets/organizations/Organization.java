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

package eu.ec2u.data.datasets.organizations;

import com.metreeca.flow.Xtream;
import com.metreeca.flow.json.actions.Validate;
import com.metreeca.flow.text.services.Translator;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Internal;
import com.metreeca.mesh.meta.jsonld.Namespace;
import com.metreeca.mesh.meta.shacl.Pattern;

import eu.ec2u.data.datasets.Reference;
import eu.ec2u.data.datasets.Resource;
import eu.ec2u.data.datasets.persons.Person;
import eu.ec2u.data.datasets.taxonomies.Taxonomies;
import eu.ec2u.data.datasets.taxonomies.Topic;
import eu.ec2u.data.datasets.taxonomies.TopicsEC2UOrganizations;
import eu.ec2u.data.datasets.units.Unit;
import eu.ec2u.data.vocabularies.org.OrgOrganization;
import eu.ec2u.data.vocabularies.schema.SchemaOrganization;
import eu.ec2u.work.ai.Embedder;

import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.text.services.Translator.translator;
import static com.metreeca.shim.Collections.*;

import static eu.ec2u.data.datasets.Localized.EN;
import static eu.ec2u.data.datasets.Resource.localize;
import static eu.ec2u.data.datasets.organizations.Organizations.ORGANIZATIONS;
import static eu.ec2u.data.datasets.taxonomies.TopicsEC2UOrganizations.EC2U_ORGANIZATIONS;
import static java.util.Locale.ROOT;
import static java.util.function.Predicate.not;

@Frame
@Namespace("[ec2u]")
public interface Organization extends Resource, OrgOrganization, SchemaOrganization {

    static Optional<OrganizationFrame> review(final OrganizationFrame organization) {

        if ( organization == null ) {
            throw new NullPointerException("null organization");
        }

        return Optional.of(organization) // translate before English-based classification
                .map(o -> localize(o, locale -> translate(o, locale)))
                .map(o -> classification(o))
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

    private static OrganizationFrame classification(final OrganizationFrame organization) {
        return organization.classification(Optional.ofNullable(organization.classification())
                .filter(not(Set::isEmpty))
                .orElseGet(() -> set(Stream.of(embeddable(organization))
                        .flatMap(organizations())
                        .limit(3)
                ))
        );
    }


    private static String embeddable(final Organization document) {
        return Embedder.embeddable(set(Xtream.from(
                Optional.ofNullable(document.prefLabel().get(EN)).stream(),
                Optional.ofNullable(document.definition().get(EN)).stream()
        )));
    }


    private static Taxonomies.Matcher organizations() {
        return new Taxonomies.Matcher(EC2U_ORGANIZATIONS)
                .threshold(0.6);
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    default Map<Locale, String> label() { // !!! review
        return Reference.label(
                Optional.ofNullable(acronym()).filter(not(String::isEmpty))
                        .map(acronym -> map(prefLabel().entrySet().stream().map(e ->
                                entry(e.getKey(), "%s - %s".formatted(acronym, e.getValue()))
                        )))
                        .orElseGet(this::prefLabel),
                Optional.ofNullable(acronym()).filter(not(String::isEmpty))
                        .map(acronym -> map(name().entrySet().stream().map(e ->
                                entry(e.getKey(), "%s - %s".formatted(acronym, e.getValue()))
                        )))
                        .orElseGet(this::name)
        );
    }

    @Override
    default Map<Locale, String> comment() {
        return Reference.comment(definition(), description());
    }


    @Override
    default Organizations dataset() {
        return ORGANIZATIONS;
    }


    @Override
    @Pattern("^"+TopicsEC2UOrganizations.PATH+".*$") // !!! @Prefix
    Set<Topic> classification();


    @Internal
    default String acronym() {
        return altLabel().get(ROOT);
    }


    @Override
    Set<? extends Organization> subOrganizationOf();

    @Override
    Set<? extends Organization> hasSubOrganization();

    @Override
    Set<? extends Unit> hasUnit();


    @Override
    Set<? extends Person> hasHead();

    @Override
    Set<? extends Person> hasMember();
    
}
