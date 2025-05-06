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

import com.metreeca.flow.http.handlers.Delegator;
import com.metreeca.flow.http.handlers.Router;
import com.metreeca.flow.http.handlers.Worker;
import com.metreeca.flow.json.handlers.Driver;
import com.metreeca.flow.toolkits.Strings;
import com.metreeca.flow.work.Xtream;
import com.metreeca.mesh.Valuable;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.util.Collections;

import eu.ec2u.data.datasets.Dataset;
import eu.ec2u.data.organizations.OrgOrganization;
import eu.ec2u.data.organizations.OrgOrganizationFrame;
import eu.ec2u.data.persons.PersonFrame;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.taxonomies.EC2UOrganizations;
import eu.ec2u.data.taxonomies.EuroSciVoc;
import eu.ec2u.data.taxonomies.TopicFrame;
import eu.ec2u.data.universities.University;
import eu.ec2u.work.CSVProcessor;
import eu.ec2u.work.Parsers;
import org.apache.commons.csv.CSVRecord;

import java.net.URI;
import java.time.LocalDate;
import java.util.*;
import java.util.Map.Entry;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.mesh.util.Collections.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.*;
import static eu.ec2u.data.persons.Person.person;
import static eu.ec2u.data.resources.Localized.EN;
import static eu.ec2u.data.units.Unit.review;
import static eu.ec2u.data.universities.University.uuid;
import static java.lang.String.format;
import static java.util.Locale.ROOT;

@Frame
public interface Units extends Dataset {

    double TYPE_THRESHOLD=0.6;
    double SUBJECT_THRESHOLD=0.6;


    UnitsFrame UNITS=new UnitsFrame()
            .id(DATA.resolve("units/"))
            .isDefinedBy(DATA.resolve("datasets/units"))
            .title(map(entry(EN, "EC2U Research Units and Facilities")))
            .alternative(map(entry(EN, "EC2U Units")))
            .description(map(entry(EN, """
                    Identifying and background information about research and innovation units and supporting structures
                    at EC2U allied universities."""
            )))
            .publisher(EC2U)
            .rights(COPYRIGHT)
            .license(set(CCBYNCND40))
            .issued(LocalDate.parse("2022-01-01"));


    static void main(final String... args) {
        exec(() -> service(store()).insert(UNITS));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    Set<Unit> members();


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    final class Handler extends Delegator {

        public Handler() {
            delegate(new Router()

                    .path("/", new Worker().get(new Driver(new UnitsFrame(true)

                            .members(stash(query(new UnitFrame(true))))

                    )))

                    .path("/{code}", new Worker().get(new Driver(new UnitFrame(true))))
            );
        }

    }

    final class Loader extends CSVProcessor<Valuable> {

        private final University university;


        Loader(final University university) {

            if ( university == null ) {
                throw new NullPointerException("null university");
            }

            this.university=university;
        }


        @Override
        protected Stream<Valuable> process(final CSVRecord record, final Collection<CSVRecord> records) {
            return id(record).map(id -> new UnitFrame()

                    .generated(true)

                    .id(id)
                    .university(university)

                    .identifier(identifier(record).orElse(null))

                    .prefLabel(map(prefLabel(record)))
                    .altLabel(map(altLabel(record)))
                    .definition(map(definition(record)))

                    .homepage(set(homepage(record)))
                    .mbox(set(mbox(record)))

                    .classification(set(classification(record)))
                    .subject(set(subject(record)))

                    .unitOf(set(unitOf(record, records)))

            ).flatMap(unit ->

                    review(unit, university.locale()) // !!! review after setting linked objects

            ).stream().flatMap(unit -> {

                final Optional<PersonFrame> head=head(record);

                return Xtream.from(

                        Stream.of(unit
                                .hasHead(head.map(Collections::set).orElse(null))
                                .hasMember(head.map(Collections::set).orElse(null))
                        ),

                        head.stream()

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

                    value(record, "Factsheet", Parsers::uri).stream(),
                    value(record, "Factsheet (English)", Parsers::uri).stream(), // !!! track language
                    value(record, "Factsheet (Local)", Parsers::uri).stream(), // !!! track language

                    value(record, "Homepage", Parsers::uri).stream(),
                    value(record, "Homepage (English)", Parsers::uri).stream(), // !!! track language
                    value(record, "Homepage (Local)", Parsers::uri).stream() // !!! track language

            );
        }

        private Stream<String> mbox(final CSVRecord record) {
            return value(record, "Email", Parsers::email).stream();
        }

        private Stream<TopicFrame> classification(final CSVRecord record) {
            return value(record, "Type")
                    .flatMap(type2 -> Resources.match(EC2UOrganizations.EC2U_ORGANIZATIONS.id(), type2))
                    .map(uri -> new TopicFrame(true).id(uri))
                    .stream();
        }

        private Stream<TopicFrame> subject(final CSVRecord record) {
            return Stream.concat(

                    value(record, "Sector")
                            .flatMap(type -> Resources.match(EuroSciVoc.EUROSCIVOC.id(), type))
                            .map(uri -> new TopicFrame(true).id(uri))
                            .stream(),


                    Stream.concat(
                                    value(record, "Topics (English)").stream(),
                                    value(record, "Topics (Local)").stream()
                            )
                            .flatMap(topics -> Arrays.stream(topics.split(";")))
                            .distinct()
                            .flatMap(topic -> Resources.match(EuroSciVoc.EUROSCIVOC.id(), topic, SUBJECT_THRESHOLD))
                            .map(uri -> new TopicFrame(true).id(uri))
                            .limit(1)

            );
        }

        private Stream<OrgOrganization> unitOf(final CSVRecord record, final Collection<CSVRecord> records) {
            return Stream.concat(

                    value(record, "Parent")
                            .map(parent -> parents(parent, records))
                            .orElseGet(() -> Stream.of(university)),

                    value(record, "VI")
                            .flatMap(Unit::vi)
                            .stream()

            );
        }

        private Stream<OrgOrganization> parents(final String parent, final Collection<CSVRecord> records) {

            final List<OrgOrganization> parents=Xtream.of(parent)
                    .flatMap(Strings::split)
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
                    .map(id -> (OrgOrganization)new OrgOrganizationFrame().id(id))
                    .toList();

            return parents.isEmpty() ? Stream.of(university) : parents.stream();
        }

        private Optional<PersonFrame> head(final CSVRecord record) {
            return value(record, "Head", person -> person(person, university));
        }

    }

}
