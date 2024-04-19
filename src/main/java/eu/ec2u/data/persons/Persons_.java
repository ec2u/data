/*
 * Copyright © 2020-2024 EC2U Alliance
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

import com.metreeca.http.toolkits.Strings;
import com.metreeca.link.Frame;

import eu.ec2u.data.universities.University;
import org.eclipse.rdf4j.model.vocabulary.FOAF;
import org.eclipse.rdf4j.model.vocabulary.RDFS;

import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.metreeca.http.toolkits.Strings.normalize;
import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.resources.Resources.partner;
import static java.lang.String.format;

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

                    final String fullName=format("%s %s", givenName, familyName);

                    return frame(

                            field(ID, item(Persons.Context, _university, fullName)),

                            field(RDFS.LABEL, literal(fullName, _university.language)), // !!! no language
                            field(partner, _university.id),

                            field(FOAF.TITLE, title.map(Frame::literal)),
                            field(FOAF.GIVEN_NAME, literal(givenName)),
                            field(FOAF.FAMILY_NAME, literal(familyName))

                    );

                });
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Persons_() { }

}
