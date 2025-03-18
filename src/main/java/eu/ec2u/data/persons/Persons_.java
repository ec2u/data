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

package eu.ec2u.data.persons;

import com.metreeca.flow.rdf.Values;
import com.metreeca.flow.toolkits.Strings;

import eu.ec2u.data.universities.University;
import eu.ec2u.work._junk.Frame;
import org.eclipse.rdf4j.model.vocabulary.FOAF;

import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.metreeca.flow.rdf.Values.literal;
import static com.metreeca.flow.toolkits.Strings.normalize;

import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.resources.Resources.university;
import static eu.ec2u.work._junk.Frame.field;
import static eu.ec2u.work._junk.Frame.frame;
import static java.lang.String.format;
import static org.eclipse.rdf4j.model.vocabulary.RDF.TYPE;
import static org.eclipse.rdf4j.model.vocabulary.XSD.ID;

public final class Persons_ {

    private static final Pattern PersonPattern=Pattern.compile("([^,]+),([^(]+)(?:\\(([^)]+)\\))?");


    public static Optional<Frame> person(final String string, final University _university) {
        return Optional.of(string)

                .map(PersonPattern::matcher)
                .filter(Matcher::matches)
                .map(matcher -> {

                    final Optional<String> title=Optional.ofNullable(matcher.group(3)).map(Strings::normalize);
                    final String familyName=normalize(matcher.group(1));
                    final String givenName=normalize(matcher.group(2));

                    return frame(

                            field(ID, item(Persons.Context, _university, format("%s, %s", familyName, givenName))),
                            field(TYPE, FOAF.PERSON),

                            field(university, _university.id),

                            field(FOAF.TITLE, title.map(Values::literal)),
                            field(FOAF.GIVEN_NAME, literal(givenName)),
                            field(FOAF.FAMILY_NAME, literal(familyName))

                    );

                });
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Persons_() { }

}
