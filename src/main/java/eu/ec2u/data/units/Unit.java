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

package eu.ec2u.data.units;

import com.metreeca.link.Frame;

import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.universities.University;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.vocabulary.FOAF;
import org.eclipse.rdf4j.model.vocabulary.ORG;
import org.eclipse.rdf4j.model.vocabulary.RDFS;
import org.eclipse.rdf4j.model.vocabulary.SKOS;

import java.net.URI;
import java.util.Locale;
import java.util.Map.Entry;
import java.util.Optional;

import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.EC2U.item;

public final class Unit {

    //̸// !!! Factor ///////////////////////////////////////////////////////////////////////////////////////////////////

    private static Optional<IRI> value(final URI uri) {
        return Optional.ofNullable(uri).map(Frame::iri);
    }

    private static Optional<Literal> value(final Entry<String, Locale> text) {
        return Optional.ofNullable(text).map(v -> literal(v.getKey(), v.getValue()));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private boolean analyzed;

    private University university;

    private String acronym;
    private Entry<String, Locale> name;

    private Entry<String, Locale> summary;
    private Entry<String, Locale> description;

    private URI url;
    private IRI classification;


    public boolean isAnalyzed() {
        return analyzed;
    }

    public Unit setAnalyzed(final boolean analyzed) {

        this.analyzed=analyzed;

        return this;
    }


    public University getUniversity() {
        return university;
    }

    public Unit setUniversity(final University university) {

        this.university=university;

        return this;
    }


    public String getAcronym() {
        return acronym;
    }

    public Unit setAcronym(final String acronym) {

        this.acronym=acronym;

        return this;
    }


    public Entry<String, Locale> getName() {
        return name;
    }

    public Unit setName(final Entry<String, Locale> name) {

        this.name=name;

        return this;
    }


    public Entry<String, Locale> getSummary() {
        return summary;
    }

    public Unit setSummary(final Entry<String, Locale> summary) {

        this.summary=summary;

        return this;
    }


    public Entry<String, Locale> getDescription() {
        return description;
    }

    public Unit setDescription(final Entry<String, Locale> description) {

        this.description=description;

        return this;
    }


    public URI getUrl() {
        return url;
    }

    public Unit setUrl(final URI url) {

        this.url=url;

        return this;
    }


    public IRI getClassification() {
        return classification;
    }

    public Unit setClassification(final IRI classification) {

        this.classification=classification;

        return this;
    }


    public Optional<Frame> toFrame() {
        return Optional.ofNullable(url).map(URI::toASCIIString)
                .or(() -> Optional.ofNullable(name).map(Entry::getKey))

                .filter(id -> name != null)

                .map(id -> frame(

                        field(ID, item(Units.Context, university, id)),
                        field(TYPE, Units.Unit),

                        // field(RDFS.LABEL, Optional.ofNullable(acronym)
                        //         .map(a -> literal(a+" - "+name.getKey(), name.getValue()))
                        //         .or(() -> value(name))
                        // ),

                        field(RDFS.LABEL, value(name)),
                        field(RDFS.COMMENT, value(summary)),

                        field(Resources.generated, literal(true)),
                        field(Resources.university, university.id),

                        field(SKOS.PREF_LABEL, value(name)),
                        field(SKOS.DEFINITION, value(description)),

                        field(FOAF.HOMEPAGE, value(url)),

                        field(ORG.UNIT_OF, university.id),

                        field(ORG.CLASSIFICATION, classification)

                ));
    }

}
