/*
 * Copyright © 2020-2023 EC2U Alliance
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

import com.metreeca.http.rdf.Frame;
import com.metreeca.http.rdf.Values;
import com.metreeca.http.toolkits.Strings;

import eu.ec2u.data.EC2U;
import eu.ec2u.data.EC2U.University;
import eu.ec2u.data.agents.Persons;
import eu.ec2u.data.resources.Resources;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.FOAF;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.RDFS;
import org.eclipse.rdf4j.model.vocabulary.SKOS;

import java.time.LocalDate;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.metreeca.http.rdf.Frame.frame;
import static com.metreeca.http.rdf.Values.guarded;
import static com.metreeca.http.rdf.Values.literal;
import static com.metreeca.http.toolkits.Strings.*;

import static java.lang.String.format;

public final class Parsers {

    private static final Pattern PersonPattern=Pattern.compile("([^,]+),([^(]+)(?:\\(([^)]+)\\))?");
    private static final Pattern URLPattern=Pattern.compile("^https?://\\S+$");
    private static final Pattern EmailPattern=Pattern.compile("^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$");


    private Parsers() { }


    public static Optional<IRI> url(final String url) {
        return Optional.of(url)
                .filter(URLPattern.asMatchPredicate())
                .map(Values::iri);
    }

    public static Optional<String> email(final String email) {
        return Optional.of(email)
                .filter(EmailPattern.asMatchPredicate());
    }

    public static Optional<LocalDate> localDate(final String value) {
        return Optional.of(value)
                .map(guarded(LocalDate::parse));
    }


    public static Optional<Frame> person(final String person, final University university) {
        return Optional.of(person)

                .map(PersonPattern::matcher)
                .filter(Matcher::matches)
                .map(matcher -> {

                    final String title=matcher.group(3);
                    final String familyName=normalize(matcher.group(1));
                    final String givenName=normalize(matcher.group(2));

                    final String fullName=format("%s %s", givenName, familyName);

                    return frame(EC2U.item(Persons.Context, university, fullName))

                            .value(RDF.TYPE, Persons.Person)

                            .value(RDFS.LABEL, literal(fullName, university.Language)) // !!! no language

                            .value(Resources.university, university.Id)

                            .value(FOAF.TITLE, Optional.ofNullable(title).map(Strings::normalize).map(Values::literal))
                            .value(FOAF.GIVEN_NAME, literal(givenName))
                            .value(FOAF.FAMILY_NAME, literal(familyName));

                });
    }

    public static Optional<Frame> concept(final IRI scheme, final String label, final String language) {
        return Optional.of(frame(EC2U.item(scheme, lower(label)))
                .value(RDF.TYPE, SKOS.CONCEPT)
                .value(SKOS.TOP_CONCEPT_OF, scheme)
                .value(SKOS.PREF_LABEL, literal(title(label), language))
        );
    }

}
