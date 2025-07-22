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

package eu.ec2u.data.datasets.documents;

import com.metreeca.flow.csv.actions.Transform;
import com.metreeca.flow.http.handlers.Delegator;
import com.metreeca.flow.http.handlers.Router;
import com.metreeca.flow.json.actions.Validate;
import com.metreeca.flow.json.handlers.Driver;
import com.metreeca.mesh.Valuable;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.shim.Collections;
import com.metreeca.shim.URIs;

import eu.ec2u.data.Data;
import eu.ec2u.data.datasets.Dataset;
import eu.ec2u.data.datasets.Datasets;
import eu.ec2u.data.datasets.ReferenceFrame;
import eu.ec2u.data.datasets.organizations.OrganizationFrame;
import eu.ec2u.data.datasets.organizations.Organizations;
import eu.ec2u.data.datasets.persons.PersonFrame;
import eu.ec2u.data.datasets.universities.University;
import org.apache.commons.csv.CSVRecord;

import java.net.URI;
import java.time.LocalDate;
import java.util.*;
import java.util.Map.Entry;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.shim.Collections.*;
import static com.metreeca.shim.Lambdas.lenient;
import static com.metreeca.shim.Locales.locale;
import static com.metreeca.shim.Streams.concat;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.Datasets.DATASETS;
import static eu.ec2u.data.datasets.Localized.EN;
import static eu.ec2u.data.datasets.documents.Document.review;
import static eu.ec2u.data.datasets.organizations.Organizations.ORGANIZATIONS;
import static eu.ec2u.data.datasets.persons.Person.person;
import static eu.ec2u.data.datasets.universities.University.uuid;
import static java.lang.String.format;
import static java.util.Locale.ROOT;

@Frame
public interface Documents extends Dataset {

    DocumentsFrame DOCUMENTS=new DocumentsFrame()
            .id(Data.DATA.resolve("documents/"))
            .isDefinedBy(Data.DATA.resolve("datasets/documents"))
            .title(map(entry(EN, "EC2U Institutional Documents")))
            .alternative(map(entry(EN, "EC2U Documents")))
            .description(map(entry(EN, """
                    Regulations, policies and other governance documents shared by EC2U partner universities.
                    """)))
            .publisher(Organizations.EC2U)
            .rights(Datasets.COPYRIGHT)
            .license(set(Datasets.CCBYNCND40))
            .issued(LocalDate.parse("2023-07-15"));


    static void main(final String... args) {
        exec(() -> service(store()).insert(DOCUMENTS));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    default Datasets dataset() {
        return DATASETS;
    }

    @Override
    Set<Document> members();


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    final class Handler extends Delegator {

        public Handler() {
            delegate(new Router()

                    .path("/", new Driver().retrieve(new DocumentsFrame(true)

                            .members(stash(query(new DocumentFrame(true))))

                    )))

                    .path("/{code}", new Driver().retrieve(new DocumentFrame(true))))
            );
        }

    }

    final class Loader extends Transform<Valuable> {

        private static final Pattern VALID_PATTERN=Pattern.compile("\\d{4}(?:/\\d{4})?");


        private final University university;


        public Loader(final University university) {
            this.university=university;
        }


        @Override
        protected Stream<Valuable> process(final CSVRecord record, final Collection<CSVRecord> records) {
            return id(record).stream().flatMap(id -> concat(review(new DocumentFrame()

                    .generated(true)

                    .id(id)
                    .university(university)

                    .url(set(url(record)))
                    .identifier(identifier(record).orElse(null))
                    .language(set(language(record)))

                    .title(map(title(record)))
                    .description(map(description(record)))

                    .publisher(publisher(record).orElse(null))
                    .creator(creator(record).orElse(null))
                    .contributor(contributor(record).orElse(null))

                    .created(created(record).orElse(null))
                    .issued(issued(record).orElse(null))
                    .modified(modified(record).orElse(null))
                    .valid(valid(record).orElse(null))

                    .rights(rights(record).orElse(null))
                    .accessRights(accessRights(record).orElse(null))
                    .license(license(record).orElse(null))

                    .relation(set(relation(record, records)))

            )));
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


        private Stream<URI> url(final CSVRecord record) {
            return Stream.concat(
                    value(record, "URL (English)", URIs::fuzzy).stream(),
                    value(record, "URL (Local)", URIs::fuzzy).stream()
            );
        }

        private Optional<String> identifier(final CSVRecord record) {
            return value(record, "Identifier");
        }

        private Stream<String> language(final CSVRecord record) {
            return Stream.concat(
                    value(record, "Title (English)").map(v -> locale(EN)).stream(),
                    value(record, "Title (Local)").map(v -> locale(university.locale())).stream()
            );
        }


        private Stream<Entry<Locale, String>> title(final CSVRecord record) {
            return Stream.concat(
                    value(record, "Title (English)").map(v -> entry(EN, v)).stream(),
                    value(record, "Title (Local)").map(v -> entry(university.locale(), v)).stream()
            );
        }

        private Stream<Entry<Locale, String>> description(final CSVRecord record) {
            return Stream.concat(
                    value(record, "Description (English)").map(v -> entry(EN, v)).stream(),
                    value(record, "Description (Local)").map(v -> entry(university.locale(), v)).stream()
            );
        }


        private Optional<LocalDate> created(final CSVRecord record) {
            return value(record, "Created", lenient(LocalDate::parse));
        }

        private Optional<LocalDate> issued(final CSVRecord record) {
            return value(record, "Issued", lenient(LocalDate::parse));
        }

        private Optional<LocalDate> modified(final CSVRecord record) {
            return value(record, "Modified", lenient(LocalDate::parse));
        }

        private Optional<String> valid(final CSVRecord record) {
            return value(record, "Valid", value -> Optional.of(value)
                    .filter(VALID_PATTERN.asMatchPredicate()));
        }


        private Optional<String> rights(final CSVRecord record) {
            return value(record, "Rights");
        }

        private Optional<Map<Locale, String>> accessRights(final CSVRecord record) {
            return value(record, "License")
                    .map(license -> license(record).isEmpty() ? map(entry(EN, license)) : null); // !!! language
        }

        private Optional<ReferenceFrame> license(final CSVRecord record) {
            return value(record, "License")
                    .flatMap(URIs::fuzzy)
                    .map(v -> new ReferenceFrame(true).id(v));
        }


        private Stream<DocumentFrame> relation(final CSVRecord record, final Collection<CSVRecord> records) {
            return values(record, "Related", related -> {

                final Collection<URI> matches=records.stream()

                        .filter(record1 -> value(record1, "Identifier").filter(related::equalsIgnoreCase)
                                .or(() -> value(record1, "Title (English)").filter(related::equalsIgnoreCase))
                                .or(() -> value(record1, "Title (Local)").filter(related::equalsIgnoreCase))
                                .isPresent()
                        )

                        .map(this::id)
                        .flatMap(Optional::stream)

                        .toList();

                if ( matches.isEmpty() ) {
                    warning(format("no matches for reference <%s>", related));
                }

                if ( matches.size() > 1 ) {
                    warning(format("multiple matches for reference <%s>", related));
                }

                return matches.stream().findFirst()
                        .map(r -> new DocumentFrame(true).id(r));
            });
        }


        private Optional<OrganizationFrame> publisher(final CSVRecord record) {

            final Optional<URI> home=value(record, "Home", URIs::fuzzy);
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

                        return new OrganizationFrame()

                                .id(ORGANIZATIONS.id().resolve(uuid(university, id.toLowerCase(ROOT))))

                                .prefLabel(map(Stream.concat(
                                        nameEnglish.map(v -> entry(EN, v)).stream(),
                                        nameLocal.map(v -> entry(university.locale(), v)).stream()
                                )))

                                .homepage(set(home.stream()));

                    })

                    .flatMap(new Validate<>());


        }

        private Optional<PersonFrame> creator(final CSVRecord record) {
            return value(record, "Contact", person -> person(university, person));
        }

        private Optional<Set<PersonFrame>> contributor(final CSVRecord record) {
            return Optional.of(values(record, "Contributor", person -> person(university, person)))
                    .map(Collections::set);
        }

    }

}
