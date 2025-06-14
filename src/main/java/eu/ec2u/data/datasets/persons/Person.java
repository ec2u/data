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

package eu.ec2u.data.datasets.persons;

import com.metreeca.flow.json.actions.Validate;
import com.metreeca.mesh.meta.jsonld.*;
import com.metreeca.mesh.meta.jsonld.Class;
import com.metreeca.shim.Strings;

import eu.ec2u.data.datasets.Resource;
import eu.ec2u.data.datasets.organizations.Organization;
import eu.ec2u.data.datasets.universities.University;
import eu.ec2u.data.vocabularies.foaf.FOAFPerson;

import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.metreeca.shim.Collections.map;
import static com.metreeca.shim.Strings.normalize;

import static eu.ec2u.data.datasets.persons.Persons.PERSONS;
import static eu.ec2u.data.datasets.universities.University.uuid;
import static java.lang.String.format;
import static java.lang.String.join;
import static java.util.Locale.ROOT;
import static java.util.Map.entry;

@Frame
@Class
@Namespace("[ec2u]")
public interface Person extends Resource, FOAFPerson {

    Pattern PERSON_PATTERN=Pattern.compile(
            "\\s*(?<family>[^,]+)\\s*,\\s*(?<given>[^(]+)\\s*(?:\\((?<title>[^)]+)\\))?"
    );


    static Optional<PersonFrame> person(final University university, final String string) {
        return Optional.of(string)

                .map(PERSON_PATTERN::matcher)
                .filter(Matcher::matches)
                .flatMap(matcher -> {

                    final Optional<String> title=Optional.ofNullable(matcher.group(3)).map(Strings::normalize);
                    final String familyName=normalize(matcher.group(1));
                    final String givenName=normalize(matcher.group(2));

                    return review(new PersonFrame()

                            .id(PERSONS.id().resolve(uuid(university, format("%s, %s", familyName, givenName))))

                            .university(university)

                            .title(title.orElse(null))
                            .givenName(givenName)
                            .familyName(familyName)

                    );

                });
    }

    static Optional<PersonFrame> person(final University university, final String forename, final String surname) {
        return review(new PersonFrame()

                .id(PERSONS.id().resolve(uuid(university, join(", ", surname, forename))))
                .university(university)
                .dataset(PERSONS)

                .givenName(forename)
                .familyName(surname)

        );
    }



    static Optional<PersonFrame> review(final PersonFrame person) {

        if ( person == null ) {
            throw new NullPointerException("null person");
        }

        return Optional.of(person)
                .flatMap(new Validate<>());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    default Map<Locale, String> label() {
        return map(entry(ROOT, "%s, %s".formatted(familyName(), givenName())));
    }


    @Override
    default Persons dataset() {
        return PERSONS;
    }


    @Forward("org:")
    Set<Organization> headOf();

    @Forward("org:")
    @Reverse("org:hasMember")
    Set<Organization> memberOf();

}
