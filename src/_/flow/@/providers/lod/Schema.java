/*
 * Copyright © 2013-2025 Metreeca srl
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

package com.metreeca.flow.lod;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;

import java.util.Collection;
import java.util.stream.Stream;

import static java.util.stream.Collectors.toList;
import static org.eclipse.rdf4j.model.util.Statements.statement;
import static org.eclipse.rdf4j.model.util.Values.iri;

/**
 * Schema.org RDF vocabulary.
 *
 * @see <a href="https://schema.org/">Schema.org</a>
 */
public final class Schema {

    public static final String NAMESPACE="https://schema.org/";
    public static final String NAMESPACE_LEGACY="http://schema.org/";


    /**
     * Creates a term in the schema.org namespace.
     *
     * @param id the identifer of the term to be created
     *
     * @return the schema.org term identified by {@code id}
     *
     * @throws NullPointerException if {@code id} is null
     */
    public static IRI term(final String id) {

        if ( id == null ) {
            throw new NullPointerException("null id");
        }

        return iri(NAMESPACE, id);
    }


    /**
     * Upgrades legacy {@value #NAMESPACE_LEGACY} references.
     *
     * @param model the RDF model to be normalized
     *
     * @return a normalized {@code model} where legacy {@value #NAMESPACE_LEGACY} references are upgraded to
     *         {@value #NAMESPACE}
     *
     * @throws NullPointerException if {@code model} is null or contains null elements
     */
    public static Collection<Statement> normalize(final Collection<Statement> model) {

        if ( model == null ) {
            throw new NullPointerException("null model");
        }

        return model.stream().map(Schema::normalize).collect(toList());
    }

    /**
     * Upgrades legacy {@value #NAMESPACE_LEGACY} references.
     *
     * @param model the RDF model to be normalized
     *
     * @return a normalized {@code model} where legacy {@value #NAMESPACE_LEGACY} references are upgraded to
     *         {@value #NAMESPACE}
     *
     * @throws NullPointerException if {@code model} is null or contains null elements
     */
    public static Stream<Statement> normalize(final Stream<Statement> model) {

        if ( model == null ) {
            throw new NullPointerException("null model");
        }

        return model.map(Schema::normalize);
    }

    /**
     * Upgrades legacy {@value #NAMESPACE_LEGACY} references.
     *
     * @param statement the RDF statement to be normalized
     *
     * @return a normalized {@code statement} where legacy {@value #NAMESPACE_LEGACY} references are upgraded to
     *         {@value #NAMESPACE}
     *
     * @throws NullPointerException if {@code statement} is null
     */
    public static Statement normalize(final Statement statement) {

        if ( statement == null ) {
            throw new NullPointerException("null statement");
        }

        return statement(
                normalize(statement.getSubject()),
                normalize(statement.getPredicate()),
                normalize(statement.getObject()),
                statement.getContext()
        );
    }

    /**
     * Upgrades legacy {@value #NAMESPACE_LEGACY} references.
     *
     * @param value the RDF value to be normalized
     *
     * @return a normalized {@code value} where legacy {@value #NAMESPACE_LEGACY} references are upgraded to
     *         {@value #NAMESPACE}
     *
     * @throws NullPointerException if {@code value} is null
     */
    public static Value normalize(final Value value) {

        if ( value == null ) {
            throw new NullPointerException("null value");
        }

        return value.isIRI() ? normalize((IRI)value) : value;
    }

    /**
     * Upgrades legacy {@value #NAMESPACE_LEGACY} references.
     *
     * @param resource the RDF resource to be normalized
     *
     * @return a normalized {@code resource} where legacy {@value #NAMESPACE_LEGACY} references are upgraded to
     *         {@value #NAMESPACE}
     *
     * @throws NullPointerException if {@code value} is null
     */
    public static Resource normalize(final Resource resource) {

        if ( resource == null ) {
            throw new NullPointerException("null resource");
        }

        return resource.isIRI() ? normalize((IRI)resource) : resource;
    }

    /**
     * Upgrades legacy {@value #NAMESPACE_LEGACY} references.
     *
     * @param iri the RDF resource to be normalized
     *
     * @return a normalized {@code iri} where legacy {@value #NAMESPACE_LEGACY} references are upgraded to
     *         {@value #NAMESPACE}
     *
     * @throws NullPointerException if {@code iri} is null
     */
    public static IRI normalize(final IRI iri) {

        if ( iri == null ) {
            throw new NullPointerException("null iri");
        }

        return iri.getNamespace().equals(NAMESPACE_LEGACY) ? iri(NAMESPACE, iri.getLocalName()) : iri;
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Schema() { }

}
