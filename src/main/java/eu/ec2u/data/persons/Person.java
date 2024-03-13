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

// @Namespace("foaf:")

public final class Person /*extends Resource*/ {

    // private static final Pattern PersonPattern=Pattern.compile("([^,]+),([^(]+)(?:\\(([^)]+)\\))?");
    //
    //
    // public static Optional<Person> person(final String string, final _Universities university) {
    //     return Optional.of(string)
    //
    //             .map(PersonPattern::matcher)
    //             .filter(Matcher::matches)
    //             .map(matcher -> {
    //
    //                 final String title=Optional.ofNullable(matcher.group(3)).map(Strings::normalize).orElse(null);
    //                 final String familyName=normalize(matcher.group(1));
    //                 final String givenName=normalize(matcher.group(2));
    //
    //                 final String fullName=format("%s %s", givenName, familyName);
    //
    //                 return with(new Person(), person -> {
    //
    //                     person.setId(EC2U.item(Persons.Context, university, fullName).stringValue()); // !!! string
    //
    //                     person.setLabel(local(university.Language, fullName)); // !!! no language / factor to getter
    //                     // !!! person.setUniversity(university);
    //
    //                     person.setTitle(title);
    //                     person.setGivenName(givenName);
    //                     person.setFamilyName(familyName);
    //
    //                 });
    //
    //             });
    // }
    //
    //
    // ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // @Format("") // !!!
    // private String title;
    //
    // @Required
    // @Format("") // !!!
    // private String givenName;
    //
    // @Required
    // @Format("") // !!!
    // private String familyName;

}

