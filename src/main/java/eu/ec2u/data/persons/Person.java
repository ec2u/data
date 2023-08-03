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

package eu.ec2u.data.persons;

import com.metreeca.http.toolkits.Strings;
import com.metreeca.link.jsonld.Namespace;
import com.metreeca.link.jsonld.Type;
import com.metreeca.link.shacl.Required;

import eu.ec2u.data.EC2U;
import eu.ec2u.data.agents.Persons;
import eu.ec2u.data.resources.Resource;
import eu.ec2u.data.universities._Universities;
import lombok.Getter;
import lombok.Setter;

import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.metreeca.http.toolkits.Strings.normalize;
import static com.metreeca.link.Frame.with;
import static com.metreeca.link.Local.local;

import static java.lang.String.format;

@Type
@Namespace("foaf:")
@Getter
@Setter
public final class Person extends Resource {

    private static final Pattern PersonPattern=Pattern.compile("([^,]+),([^(]+)(?:\\(([^)]+)\\))?");


    public static Optional<Person> person(final String string, final _Universities university) {
        return Optional.of(string)

                .map(PersonPattern::matcher)
                .filter(Matcher::matches)
                .map(matcher -> {

                    final String title=Optional.ofNullable(matcher.group(3)).map(Strings::normalize).orElse(null);
                    final String familyName=normalize(matcher.group(1));
                    final String givenName=normalize(matcher.group(2));

                    final String fullName=format("%s %s", givenName, familyName);

                    return with(new Person(), person -> {

                        person.setId(EC2U.item(Persons.Context, university, fullName).stringValue()); // !!! string

                        person.setLabel(local(university.Language, fullName)); // !!! no language / factor to getter
                        // !!! person.setUniversity(university);

                        person.setTitle(title);
                        person.setGivenName(givenName);
                        person.setFamilyName(familyName);

                    });

                });
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @com.metreeca.link.shacl.Optional // !!! clash
    @com.metreeca.link.shacl.Pattern("") // !!! clash // !!! title pattern
    private String title;

    @Required
    private String givenName;

    @Required
    private String familyName;

}

