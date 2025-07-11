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

package eu.ec2u.data.datasets.units;

import com.metreeca.flow.Xtream;
import com.metreeca.flow.csv.actions.Transform;
import com.metreeca.flow.http.handlers.Delegator;
import com.metreeca.flow.http.handlers.Router;
import com.metreeca.flow.json.handlers.Driver;
import com.metreeca.mesh.Valuable;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.pipe.Store;
import com.metreeca.shim.Collections;
import com.metreeca.shim.Locales;
import com.metreeca.shim.URIs;

import eu.ec2u.data.Data;
import eu.ec2u.data.datasets.Datasets;
import eu.ec2u.data.datasets.Reference;
import eu.ec2u.data.datasets.organizations.Organization;
import eu.ec2u.data.datasets.organizations.OrganizationFrame;
import eu.ec2u.data.datasets.organizations.Organizations;
import eu.ec2u.data.datasets.persons.PersonFrame;
import eu.ec2u.data.datasets.taxonomies.Topic;
import eu.ec2u.data.datasets.universities.University;
import eu.ec2u.work.Page;
import org.apache.commons.csv.CSVRecord;

import java.net.URI;
import java.time.LocalDate;
import java.util.*;
import java.util.Map.Entry;
import java.util.function.BiFunction;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.shim.Collections.*;
import static com.metreeca.shim.Lambdas.lenient;
import static com.metreeca.shim.Streams.concat;
import static com.metreeca.shim.Strings.split;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.Localized.EN;
import static eu.ec2u.data.datasets.persons.Person.person;
import static eu.ec2u.data.datasets.units.Unit.*;
import static eu.ec2u.data.datasets.universities.University.uuid;
import static eu.ec2u.work.ai.Analyzer.analyzer;
import static java.lang.String.format;
import static java.util.Locale.ROOT;
import static java.util.Map.entry;
import static java.util.function.Function.identity;

@Frame
public interface Units extends Organizations {

    UnitsFrame UNITS=new UnitsFrame()
            .id(Data.DATA.resolve("units/"))
            .isDefinedBy(Data.DATA.resolve("datasets/units"))
            .title(map(entry(EN, "EC2U Research Units and Facilities")))
            .alternative(map(entry(EN, "EC2U Units")))
            .description(map(entry(EN, """
                    Information about research units and supporting structures at EC2U partner universities.
                    """
            )))
            .publisher(EC2U)
            .rights(Datasets.COPYRIGHT)
            .license(set(Datasets.CCBYNCND40))
            .issued(LocalDate.parse("2022-01-01"));


    static void main(final String... args) {
        exec(() -> {

            final Store store=service(store());

            store.insert(UNITS);
            store.insert(array(VIS));

        });
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    Set<Unit> members();


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    final class Handler extends Delegator {

        public Handler() {
            delegate(new Router()

                    .path("/", new Driver().retrieve(new UnitsFrame(true)

                            .members(stash(query(new UnitFrame(true))))

                    )))

                    .path("/{code}", new Driver().retrieve(new UnitFrame(true))))
            );
        }

    }

    final class Loader extends Transform<Valuable> {

        private final University university;


        Loader(final University university) {

            if ( university == null ) {
                throw new NullPointerException("null university");
            }

            this.university=university;
        }


        @Override
        protected Stream<Valuable> process(final CSVRecord record, final Collection<CSVRecord> records) {
            return id(record).stream().flatMap(id -> {

                final Optional<PersonFrame> head=head(record);

                return concat(

                        review(new UnitFrame()

                                .generated(true)

                                .id(id)
                                .university(university)

                                .identifier(identifier(record).orElse(null))

                                .prefLabel(map(prefLabel(record)))
                                .altLabel(map(altLabel(record)))
                                .definition(map(definition(record)))

                                .homepage(set(homepage(record)))
                                .mbox(set(mbox(record)))

                                .classification(set(classification(record).stream()))
                                .subject(set(subject(record)))

                                .unitOf(set(unitOf(record, records)))

                                .hasHead(head.map(Collections::set).orElse(null))
                                .hasMember(head.map(Collections::set).orElse(null))

                        ),

                        head

                );

            });
        }


        //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////

        private Optional<URI> id(final CSVRecord record) {

            final Optional<String> code=value(record, "Code");
            final Optional<String> nameEnglish=value(record, "Name (English)");
            final Optional<String> nameLocal=value(record, "Name (Local)");

            if ( nameEnglish.isEmpty() && nameLocal.isEmpty() ) {

                warning(record, "no name provided");

                return Optional.empty();

            } else {

                return Optional.of(UNITS.id().resolve(uuid(university, code
                        .or(() -> nameEnglish)
                        .or(() -> nameLocal)
                        .orElse("") // unexpected
                )));

            }
        }

        private Optional<String> identifier(final CSVRecord record) {
            return value(record, "Code");
        }

        private Stream<Entry<Locale, String>> prefLabel(final CSVRecord record) {
            return Xtream.from(
                    value(record, "Name (English)").stream().map(v -> entry(EN, v)),
                    value(record, "Name (Local)").stream().map(v -> entry(university.locale(), v))
            );
        }

        private Stream<Entry<Locale, String>> altLabel(final CSVRecord record) {
            return Xtream.from(
                    value(record, "Acronym").stream().map(v -> entry(ROOT, v))
            );
        }

        private Stream<Entry<Locale, String>> definition(final CSVRecord record) {
            return Xtream.from(
                    value(record, "Description (English)").stream().map(v -> entry(EN, v)),
                    value(record, "Description (Local)").stream().map(v -> entry(university.locale(), v))
            );
        }

        private Stream<URI> homepage(final CSVRecord record) {
            return Xtream.from(

                    value(record, "Factsheet", URIs::fuzzy).stream(),
                    value(record, "Factsheet (English)", URIs::fuzzy).stream(), // !!! track language
                    value(record, "Factsheet (Local)", URIs::fuzzy).stream(), // !!! track language

                    value(record, "Homepage", URIs::fuzzy).stream(),
                    value(record, "Homepage (English)", URIs::fuzzy).stream(), // !!! track language
                    value(record, "Homepage (Local)", URIs::fuzzy).stream() // !!! track language

            );
        }

        private Stream<String> mbox(final CSVRecord record) {
            return value(record, "Email", Reference::email).stream();
        }

        private Optional<Topic> classification(final CSVRecord record) {
            return value(record, "Type").stream()
                    .flatMap(organizations())
                    .findFirst();
        }

        private Stream<Topic> subject(final CSVRecord record) {
            return Stream.of(
                            value(record, "Name (English)").stream(),
                            value(record, "Name (Local)").stream(),
                            value(record, "Topics (English)").stream(),
                            value(record, "Topics (Local)").stream()
                    )
                    .flatMap(identity())
                    .flatMap(topics -> Arrays.stream(topics.split(";")))
                    .distinct()
                    .flatMap(euroscivoc())
                    .limit(3);
        }

        private Stream<Organization> unitOf(final CSVRecord record, final Collection<CSVRecord> records) {
            return Stream.concat(

                    value(record, "Parent")
                            .map(parent -> parents(parent, records))
                            .orElseGet(() -> Stream.of(university)),

                    value(record, "VI")
                            .flatMap(Unit::vi)
                            .stream()

            );
        }

        private Stream<Organization> parents(final String parent, final Collection<CSVRecord> records) {

            final List<Organization> parents=Xtream.of(parent)
                    .flatMap(v -> split(v, ";"))
                    .optMap(ref -> {

                        final Optional<URI> id=records.stream()

                                .filter(record -> value(record, "Code").filter(ref::equalsIgnoreCase)
                                        .or(() -> value(record, "Acronym").filter(ref::equalsIgnoreCase))
                                        .or(() -> value(record, "Name (English)").filter(ref::equalsIgnoreCase))
                                        .or(() -> value(record, "Name (Local)").filter(ref::equalsIgnoreCase))
                                        .isPresent()
                                )

                                .findFirst()

                                .flatMap(this::id);

                        if ( id.isEmpty() ) {
                            warning(format("unknown parent <%s>", ref));
                        }

                        return id;

                    })
                    .map(id -> (Organization)new OrganizationFrame().id(id))
                    .toList();

            return parents.isEmpty() ? Stream.of(university) : parents.stream();
        }

        private Optional<PersonFrame> head(final CSVRecord record) {
            return value(record, "Head", person -> person(university, person));
        }

    }

    final class Scanner implements BiFunction<Page, UnitFrame, Optional<UnitFrame>> {

        @Override
        public Optional<UnitFrame> apply(final Page page, final UnitFrame unit) {
            return Optional.of(page.body()).flatMap(service(analyzer()).prompt("""
                    Extract the following properties from the provided markdown document describing an academic unit:
                    
                    - official name
                    - acronym, verbatim as defined in the document and only if absolutely confident about it
                    - plain text summary of about 500 characters
                    - full description as included in the document in markdown format; remove H1 (#) headings containing
                      the name of the unit; make absolutely sure not to include any description of ongoing and upcoming events
                    - document language as a 2-letter ISO tag
                    
                    Remove personal email addresses.
                    
                    Respond in the document original language.
                    Respond with a JSON object.
                    """, """
                    {
                      "name": "unit",
                      "schema": {
                        "type": "object",
                        "properties": {
                          "name": {
                            "type": "string"
                          },
                          "acronym": {
                            "type": "string"
                          },
                          "summary": {
                            "type": "string"
                          },
                          "description": {
                            "type": "string"
                          },
                          "language": {
                            "type": "string",
                            "pattern": "^[a-zA-Z]{2}$"
                          }
                        },
                        "required": [
                          "name",
                          "summary",
                          "description",
                          "language"
                        ],
                        "additionalProperties": false
                      }
                    }"""
            )).flatMap(json -> {

                final Locale locale=json.get("language").string()
                        .flatMap(lenient(Locales::locale))
                        .orElseGet(unit.university()::locale);

                return review(new UnitFrame()

                        .generated(true)

                        .id(UNITS.id().resolve(uuid(unit.university(), page.id().toString())))

                        .comment(json.get("summary").string()
                                .map(summary -> map(entry(locale, summary)))
                                .orElse(null)
                        )

                        .university(unit.university())
                        .unitOf(set(unit.university()))

                        .homepage(set(page.id()))

                        .altLabel(json.get("acronym").string()
                                .map(acronym -> map(entry(ROOT, acronym)))
                                .orElse(null)
                        )

                        .prefLabel(json.get("name").string()
                                .map(name -> map(entry(locale, name)))
                                .orElse(null)
                        )

                        .definition(json.get("description").string()
                                .map(description -> map(entry(locale, description)))
                                .orElse(null)
                        )

                );

            });
        }

    }
}
