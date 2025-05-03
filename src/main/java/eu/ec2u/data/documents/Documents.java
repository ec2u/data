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

package eu.ec2u.data.documents;

import com.metreeca.flow.http.handlers.Delegator;
import com.metreeca.flow.http.handlers.Router;
import com.metreeca.flow.http.handlers.Worker;
import com.metreeca.flow.json.actions.Validate;
import com.metreeca.flow.json.handlers.Driver;
import com.metreeca.flow.toolkits.Strings;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.util.URIs;

import eu.ec2u.data.datasets.Dataset;
import eu.ec2u.data.organizations.OrgOrganization;
import eu.ec2u.data.organizations.OrgOrganizationFrame;
import eu.ec2u.data.resources.ReferenceFrame;
import eu.ec2u.data.universities.University;
import eu.ec2u.work.CSVProcessor;
import eu.ec2u.work.Parsers;
import org.apache.commons.csv.CSVRecord;

import java.net.URI;
import java.time.LocalDate;
import java.util.Collection;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.toolkits.Strings.lower;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.mesh.util.Collections.*;
import static com.metreeca.mesh.util.Locales.locale;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.*;
import static eu.ec2u.data.documents.Document.review;
import static eu.ec2u.data.organizations.Organizations.ORGANIZATIONS;
import static eu.ec2u.data.persons.Person.person;
import static eu.ec2u.data.resources.Localized.EN;
import static eu.ec2u.data.universities.University.uuid;
import static eu.ec2u.work.Parsers.url;
import static java.lang.String.format;

@Frame
public interface Documents extends Dataset {

    DocumentsFrame DOCUMENTS=new DocumentsFrame()
            .id(DATA.resolve("documents/"))
            .isDefinedBy(DATA.resolve("datasets/documents"))
            .title(map(entry(EN, "EC2U Institutional Documents")))
            .alternative(map(entry(EN, "EC2U Documents")))
            .description(map(entry(EN, "Institutional documents shared by EC2U allied partners.")))
            .publisher(EC2U)
            .rights(COPYRIGHT)
            .license(set(LICENSE))
            .issued(LocalDate.parse("2023-07-15"));


    static void main(final String... args) {
        exec(() -> service(store()).partition(DOCUMENTS.id()).insert(DOCUMENTS));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    Set<Document> members();


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    final class Handler extends Delegator {

        public Handler() {
            delegate(new Router()

                    .path("/", new Worker().get(new Driver(new DocumentsFrame(true)

                            .members(stash(query(new DocumentFrame(true))))

                    )))

                    .path("/{code}", new Worker().get(new Driver(new DocumentFrame(true))))
            );
        }

    }

    final class Loader extends CSVProcessor<DocumentFrame> {

        private static final Pattern VALID_PATTERN=Pattern.compile("\\d{4}(?:/\\d{4})?");


        private final University university;


        public Loader(final University university) {
            this.university=university;
        }


        @Override
        protected Optional<DocumentFrame> process(final CSVRecord record, final Collection<CSVRecord> records) {

            final Optional<String> titleEnglish=value(record, "Title (English)");
            final Optional<String> titleLocal=value(record, "Title (Local)");

            return id(record).map(id -> new DocumentFrame()

                    .generated(true)

                    .id(id)

                    .university(university)

                    .url(set(Stream.concat(
                            value(record, "URL (English)", Parsers::uri).stream(),
                            value(record, "URL (Local)", Parsers::uri).stream()
                    )))

                    .identifier(value(record, "Identifier")
                            .orElse(null)
                    )

                    .language(set(Stream.concat(
                            titleEnglish.map(v -> locale(EN)).stream(),
                            titleLocal.map(v -> locale(university.locale())).stream()
                    )))

                    .title(map(Stream.concat(
                            titleEnglish.map(v -> entry(EN, v)).stream(),
                            titleLocal.map(v -> entry(university.locale(), v)).stream()
                    )))

                    .description(map(Stream.concat(
                            value(record, "Description (English)").map(v -> entry(EN, v)).stream(),
                            value(record, "Description (Local)").map(v -> entry(university.locale(), v)).stream()
                    )))


                    .created(value(record, "Created", Parsers::localDate)
                            .orElse(null)
                    )

                    .issued(value(record, "Issued", Parsers::localDate)
                            .orElse(null)
                    )

                    .modified(value(record, "Modified", Parsers::localDate)
                            .orElse(null)
                    )

                    .valid(value(record, "Valid", this::valid)
                            .orElse(null)
                    )

                    .publisher(publisher(record)
                            .orElse(null)
                    )

                    .creator(value(record, "Contact", person -> person(person, university))
                            .orElse(null)
                    )

                    .contributor(set(values(record, "Contributor", person -> person(person, university))))

                    .rights(value(record, "Rights")
                            .orElse(null)
                    )

                    .accessRights(value(record, "License", this::license)
                            .map(license -> url(license).isEmpty() ? map(entry(EN, license)) : null) // !!! language
                            .orElse(null)
                    )

                    .license(value(record, "License", this::license)
                            .flatMap(Parsers::url)
                            .map(URIs::uri)
                            .map(v -> new ReferenceFrame(true).id(v))
                            .orElse(null)
                    )

                    .relation(set(values(record, "Related", related ->
                            related(related, records)
                                    .map(r -> new DocumentFrame(true).id(r))
                    )))

            ).flatMap(document -> review(document, university.locale()));
        }


        //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////

        private Optional<URI> id(final CSVRecord record) {

            final Optional<String> identifier=value(record, "Identifier");
            final Optional<String> titleEnglish=value(record, "Title (English)");
            final Optional<String> titleLocal=value(record, "Title (Local)");

            if ( titleEnglish.isEmpty() && titleLocal.isEmpty() ) {

                warning(record, "no english/local title provided");

                return Optional.empty();

            } else {

                return Optional.of(DOCUMENTS.id().resolve(uuid(university, identifier
                        .or(() -> titleEnglish)
                        .or(() -> titleLocal)
                        .orElse("") // unexpected
                )));

            }
        }

        private Optional<OrgOrganization> publisher(final CSVRecord record) {

            final Optional<URI> home=value(record, "Home", Parsers::uri);
            final Optional<String> nameEnglish=value(record, "Publisher (English)");
            final Optional<String> nameLocal=value(record, "Publisher (Local)");

            return home.map(URI::toString)

                    .or(() -> nameEnglish)
                    .or(() -> nameLocal)

                    .map(id -> {

                        if ( nameEnglish.isEmpty() && nameLocal.isEmpty() ) {

                            warning(record, "no english/local publisher name provided");

                            return null;

                        }

                        return new OrgOrganizationFrame()

                                .id(ORGANIZATIONS.id().resolve(uuid(university, lower(id))))

                                .prefLabel(map(Stream.concat(
                                        nameEnglish.map(v -> entry(EN, v)).stream(),
                                        nameLocal.map(v -> entry(university.locale(), v)).stream()
                                )))

                                .homepage(set(home.stream()));

                    })

                    .flatMap(new Validate<>());


        }

        private Optional<URI> related(final String reference, final Collection<CSVRecord> records) {

            final Collection<URI> matches=records.stream()

                    .filter(record -> value(record, "Identifier").filter(reference::equalsIgnoreCase)
                            .or(() -> value(record, "Title (English)").filter(reference::equalsIgnoreCase))
                            .or(() -> value(record, "Title (Local)").filter(reference::equalsIgnoreCase))
                            .isPresent()
                    )

                    .map(this::id)
                    .flatMap(Optional::stream)

                    .toList();

            if ( matches.isEmpty() ) {
                warning(format("no matches for reference <%s>", reference));
            }

            if ( matches.size() > 1 ) {
                warning(format("multiple matches for reference <%s>", reference));
            }

            return matches.stream().findFirst();
        }


        private Optional<String> valid(final String value) {
            return Optional.of(value)
                    .filter(VALID_PATTERN.asMatchPredicate());
        }

        private Optional<String> license(final String value) {
            return Optional.of(value)
                    .map(Strings::title);
        }

    }

}
