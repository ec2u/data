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

import com.metreeca.flow.handlers.Delegator;
import com.metreeca.flow.handlers.Router;
import com.metreeca.flow.handlers.Worker;
import com.metreeca.flow.json.actions.Validate;
import com.metreeca.flow.json.handlers.Driver;
import com.metreeca.flow.toolkits.Strings;
import com.metreeca.flow.work.Xtream;
import com.metreeca.mesh.Value;
import com.metreeca.mesh.meta.jsonld.Frame;

import eu.ec2u.data.agents.FOAFPerson;
import eu.ec2u.data.datasets.Dataset;
import eu.ec2u.data.organizations.OrgOrganization;
import eu.ec2u.data.organizations.OrgOrganizationFrame;
import eu.ec2u.data.taxonomies.Topics;
import eu.ec2u.data.universities.University;
import eu.ec2u.work.CSVProcessor;
import eu.ec2u.work.Parsers;
import org.apache.commons.csv.CSVRecord;

import java.net.URI;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.mesh.tools.Store.Options.FORCE;
import static com.metreeca.mesh.util.Collections.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.DATA;
import static eu.ec2u.data.datasets.Datasets.DATASETS;
import static eu.ec2u.data.persons.Person.person;
import static eu.ec2u.data.resources.Localized.EN;
import static eu.ec2u.data.taxonomies.EuroSciVoc.EUROSCIVOC;
import static eu.ec2u.data.taxonomies.OrganizationTypes.ORGANIZATIONS;
import static eu.ec2u.data.universities.University.uuid;
import static java.lang.String.format;
import static java.util.Locale.ROOT;

@Frame
public interface Units extends Dataset {

    URI UNITS=DATA.resolve("units/");

    double TYPE_THRESHOLD=0.25;
    double SUBJECT_THRESHOLD=0.5;


    static void main(final String... args) {
        exec(() -> {

            final Value update=array(list(Xtream.of(new UnitsFrame())
                    .optMap(new Validate<>())
            ));

            service(store()).partition(UNITS).update(update, FORCE);

        });
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    default URI id() {
        return UNITS;
    }


    @Override
    default Map<Locale, String> title() {
        return map(entry(EN, "EC2U Research Units and Facilities"));
    }

    @Override
    default Map<Locale, String> alternative() {
        return map(entry(EN, "EC2U Units"));
    }

    @Override
    default Map<Locale, String> description() {
        return map(entry(EN, """
                Identifying and background information about research and innovation units and supporting structures
                at EC2U allied universities."""
        ));
    }


    @Override
    default URI isDefinedBy() {
        return DATASETS.resolve("units");
    }


    @Override
    default LocalDate issued() {
        return LocalDate.parse("2022-01-01");
    }


    @Override
    Set<Unit> members();


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    final class Handler extends Delegator {

        public Handler() {
            delegate(new Router()

                    .path("/", new Worker().get(new Driver(new UnitsFrame()

                            .members(stash(query(new UnitFrame())))

                    )))

                    .path("/{code}", new Unit.Handler())
            );
        }

    }

    final class CSVLoader extends CSVProcessor<UnitFrame> {

        private static final Set<Unit> VIS=set(
                Unit.GLADE(),
                Unit.VIQE(),
                Unit.VISCC(),
                Unit.VIPJSI()
        );


        private final University university;


        CSVLoader(final University university) {

            if ( university == null ) {
                throw new NullPointerException("null university");
            }

            this.university=university;
        }


        @Override protected Optional<UnitFrame> process(final CSVRecord record, final Collection<CSVRecord> records) {
            return id(record).map(id -> new UnitFrame()

                    .generated(true)

                    .id(id)
                    .university(university)

                    .identifier(value(record, "Code")
                            .map(v -> entry(university.id(), v))
                            .orElse(null)
                    )

                    .unitOf(set(Stream.concat(

                            value(record, "Parent")
                                    .map(parent -> parents(parent, records))
                                    .orElseGet(() -> Stream.of(university)),

                            value(record, "VI")
                                    .flatMap(this::vi)
                                    .stream()

                    )))

                    .classification(set(value(record, "Type")
                            .flatMap(type -> Topics.resolve(ORGANIZATIONS, type))
                            .stream()
                    ))

                    .subject(set(Stream.concat(

                            value(record, "Sector")
                                    .flatMap(type -> Topics.resolve(EUROSCIVOC, type))
                                    .stream(),


                            Stream.concat(
                                            value(record, "Topics (English)").stream(),
                                            value(record, "Topics (Local)").stream()
                                    )
                                    .flatMap(topics -> Arrays.stream(topics.split(",")))
                                    .distinct()
                                    .flatMap(topic -> Topics.match(EUROSCIVOC, topic, SUBJECT_THRESHOLD))
                                    .limit(1)

                    )))

                    .prefLabel(map(Xtream.from(
                            value(record, "Name (English)").stream().map(v -> entry(EN, v)),
                            value(record, "Name (Local)").stream().map(v -> entry(university.locale(), v))
                    )))

                    .altLabel(map(Xtream.from(
                            value(record, "Acronym").stream().map(v -> entry(ROOT, v))
                    )))

                    .definition(map(Xtream.from(
                            value(record, "Description (English)").stream().map(v -> entry(EN, v)),
                            value(record, "Description (Local)").stream().map(v -> entry(university.locale(), v))
                    )))

                    .homepage(set(Xtream.from(

                            value(record, "Factsheet", Parsers::uri).stream(),
                            value(record, "Factsheet (English)", Parsers::uri).stream(), // !!! record language
                            value(record, "Factsheet (Local)", Parsers::uri).stream(), // !!! record language

                            value(record, "Homepage", Parsers::uri).stream(),
                            value(record, "Homepage (English)", Parsers::uri).stream(), // !!! record language
                            value(record, "Homepage (Local)", Parsers::uri).stream() // !!! record language

                    )))

                    .mbox(set(
                            value(record, "Email", Parsers::email).stream()
                    ))

                    .hasHead(set(value(record, "Head", person -> person(person, university))
                            .map(FOAFPerson.class::cast)
                            .stream()
                    ))

            );
        }


        private Optional<URI> id(final CSVRecord record) {

            final Optional<String> code=value(record, "Code");
            final Optional<String> nameEnglish=value(record, "Name (English)");
            final Optional<String> nameLocal=value(record, "Name (Local)");

            if ( nameEnglish.isEmpty() && nameLocal.isEmpty() ) {

                warning(record, "no name provided");

                return Optional.empty();

            } else {

                return Optional.of(UNITS.resolve(uuid(university, code
                        .or(() -> nameEnglish)
                        .or(() -> nameLocal)
                        .orElse("") // unexpected
                )));

            }
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

        private Optional<Unit> vi(final String code) {
            return VIS.stream()
                    .filter(vi -> entry(DATA, code).equals(vi.identifier()))
                    .findFirst();
        }

    }

}
