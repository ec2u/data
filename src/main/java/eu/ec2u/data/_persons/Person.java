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

package eu.ec2u.data._persons;

import com.metreeca.flow.toolkits.Strings;
import com.metreeca.mesh.meta.jsonld.Class;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Namespace;

import eu.ec2u.data._agents.FOAFPerson;
import eu.ec2u.data._resources.Resource;
import eu.ec2u.data._universities.University;

import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.metreeca.flow.toolkits.Strings.normalize;

import static eu.ec2u.data._persons.Persons.PERSONS;
import static eu.ec2u.data._universities.University.uuid;
import static java.lang.String.format;

@Frame
@Class
@Namespace("[ec2u]")
public interface Person extends Resource, FOAFPerson {

    Pattern PERSON_PATTERN=Pattern.compile("([^,]+),([^(]+)(?:\\(([^)]+)\\))?");


    static Optional<Person> person(final String string, final University university) {
        return Optional.of(string)

                .map(PERSON_PATTERN::matcher)
                .filter(Matcher::matches)
                .map(matcher -> {

                    final Optional<String> title=Optional.ofNullable(matcher.group(3)).map(Strings::normalize);
                    final String familyName=normalize(matcher.group(1));
                    final String givenName=normalize(matcher.group(2));

                    return PersonFrame.Person()
                            .id(PERSONS.resolve(uuid(university, format("%s, %s", familyName, givenName))))
                            .university(university);

                    // return frame(
                    //
                    //         field(ID, item(Persons.Context, _university, format("%s, %s", familyName, givenName))),
                    //         field(TYPE, FOAF.PERSON),
                    //
                    //         field(university, _university.id),
                    //
                    //         field(FOAF.TITLE, title.map(Values::literal)),
                    //         field(FOAF.GIVEN_NAME, literal(givenName)),
                    //         field(FOAF.FAMILY_NAME, literal(familyName))
                    //
                    // );

                });
    }

}
