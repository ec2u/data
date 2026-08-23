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
import org.eclipse.rdf4j.model.vocabulary.RDFS;
import org.eclipse.rdf4j.model.vocabulary.SKOS;
import org.eclipse.rdf4j.repository.Repository;
import org.eclipse.rdf4j.repository.sparql.SPARQLRepository;

import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static java.lang.Double.parseDouble;
import static org.eclipse.rdf4j.model.util.Values.iri;


/**
 * Wikidata RDF vocabulary.
 *
 * @see <a href="https://www.wikidata.org/">Wikidata</a>
 */
public final class Wikidata {

    public static final String WB="http://wikiba.se/ontology#";
    public static final String WD="http://www.wikidata.org/entity/";
    public static final String WDP="http://www.wikidata.org/prop/";
    public static final String WDT="http://www.wikidata.org/prop/direct/";

    public static final IRI ITEM=wb("Item");
    public static final IRI PROPERTY=wb("Property");
    public static final IRI SITELINKS=wb("sitelinks");

    public static final IRI P31=wdt("P31"); // instance of
    public static final IRI P279=wdt("P279"); // subclass of
    public static final IRI P1647=wdt("P1647"); // subproperty of
    public static final IRI P625=wdt("P625"); // coordinate location
    public static final IRI P1549=wdt("P1549"); // demonym

    public static final IRI Q4167410=wd("Q4167410"); // Wikimedia disambiguation page

    public static final List<IRI> NAMES=List.of(RDFS.LABEL, SKOS.ALT_LABEL);


    private static final Pattern COORD_PATTERN=Pattern.compile("[-+]?(?:\\d*\\.)?\\d+");
    private static final Pattern POINT_PATTERN=Pattern.compile("Point\\(("+COORD_PATTERN+")\\s+("+COORD_PATTERN+")\\)");


    public static record Point(double longitude, double latitude) { }


    public static IRI wb(final String name) {

        if ( name == null ) {
            throw new NullPointerException("null name");
        }

        return iri(WB, name);
    }

    public static IRI wd(final String name) {

        if ( name == null ) {
            throw new NullPointerException("null name");
        }

        return iri(WD, name);
    }

    public static IRI wdt(final String name) {

        if ( name == null ) {
            throw new NullPointerException("null name");
        }

        return iri(WDT, name);
    }


    public static Repository repository() {
        return new SPARQLRepository("https://query.wikidata.org/sparql");
    }


    public static Optional<Point> point(final String literal) {
        return Optional.ofNullable(literal)
                .map(POINT_PATTERN::matcher)
                .filter(Matcher::matches)
                .map(matcher -> new Point(
                        parseDouble(matcher.group(1)),
                        parseDouble(matcher.group(2))
                ));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Wikidata() { }

}
