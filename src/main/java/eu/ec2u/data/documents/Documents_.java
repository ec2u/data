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

import com.metreeca.flow.rdf4j.actions.Upload;
import com.metreeca.flow.services.Vault;
import com.metreeca.flow.toolkits.Strings;
import com.metreeca.flow.work.Xtream;
import com.metreeca.link.Frame;

import eu.ec2u.data.EC2U;
import eu.ec2u.data.organizations.Organizations;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.things.Schema;
import eu.ec2u.data.universities.University;
import eu.ec2u.work.feeds.CSVProcessor;
import eu.ec2u.work.feeds.Parsers;
import org.apache.commons.csv.CSVRecord;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.util.Values;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.util.Collection;
import java.util.Optional;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.services.Vault.vault;
import static com.metreeca.flow.toolkits.Strings.lower;
import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.EC2U.update;
import static eu.ec2u.data.concepts.Concepts_.concept;
import static eu.ec2u.data.documents.Documents.Document;
import static eu.ec2u.data.persons.Persons_.person;
import static eu.ec2u.work.feeds.Parsers.url;
import static java.lang.String.format;
import static java.util.stream.Collectors.toList;

final class Documents_ {

    private Documents_() { }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    static final class CSVLoader extends CSVProcessor<Frame> implements Runnable {

        private final String source;
        private final IRI context;
        private final University university;


        private final Vault vault=service(vault());


        CSVLoader(final String source, final IRI context, final University university) {

            if ( source == null ) {
                throw new NullPointerException("null source");
            }

            if ( context == null ) {
                throw new NullPointerException("null context");
            }

            if ( university == null ) {
                throw new NullPointerException("null university");
            }

            this.source=source;
            this.context=context;
            this.university=university;
        }


        @Override public void run() {

            final String url=vault.get(source);

            update(connection -> Xtream.of(url)

                    .flatMap(this)

                    .flatMap(Frame::stream)
                    .batch(0)

                    .forEach(new Upload()
                            .contexts(context)
                            .clear(true)
                    )

            );
        }


        @Override protected Optional<Frame> process(final CSVRecord record, final Collection<CSVRecord> records) {

            final Optional<String> titleEnglish=value(record, "Title (English)");
            final Optional<String> titleLocal=value(record, "Title (Local)");

            return id(record).map(id -> frame(

                    field(ID, id),

                    field(RDF.TYPE, Document),

                    field(Resources.university, university.id),

                    field(Schema.url, value(record, "URL (English)", Parsers::uri).map(Frame::iri)),
                    field(Schema.url, value(record, "URL (Local)", Parsers::uri).map(Frame::iri)),

                    field(DCTERMS.IDENTIFIER, value(record, "Identifier")
                            .map(Values::literal)
                    ),

                    field(DCTERMS.LANGUAGE, titleEnglish
                            .map(v -> literal("en"))
                    ),

                    field(DCTERMS.LANGUAGE, titleLocal
                            .map(v -> literal(university.language))
                    ),

                    field(DCTERMS.TITLE, titleEnglish
                            .map(v -> literal(v, "en"))
                    ),

                    field(DCTERMS.TITLE, titleLocal
                            .map(v -> literal(v, university.language))
                    ),

                    field(DCTERMS.DESCRIPTION, value(record, "Description (English)")
                            .map(v -> literal(v, "en"))
                    ),

                    field(DCTERMS.DESCRIPTION, value(record, "Description (Local)")
                            .map(v -> literal(v, university.language))
                    ),

                    field(DCTERMS.CREATED, value(record, "Created", Parsers::localDate)
                            .map(Values::literal)
                    ),

                    field(DCTERMS.ISSUED, value(record, "Issued", Parsers::localDate)
                            .map(Values::literal)
                    ),

                    field(DCTERMS.MODIFIED, value(record, "Modified", Parsers::localDate)
                            .map(Values::literal)
                    ),

                    field(DCTERMS.VALID, value(record, "Valid", this::valid)
                            .map(Values::literal)
                    ),

                    field(DCTERMS.PUBLISHER, publisher(record)),

                    field(DCTERMS.CREATOR, value(record, "Contact", person ->
                            person(person, university)
                    )),

                    field(DCTERMS.CONTRIBUTOR, values(record, "Contributor", person ->
                            person(person, university)
                    )),

                    field(DCTERMS.RIGHTS, value(record, "Rights")
                            .map(Frame::literal)
                    ),

                    field(DCTERMS.ACCESS_RIGHTS, value(record, "License", this::license)
                            .map(license -> url(license).isEmpty() ? literal(license, "en") : null) // !!! language
                    ),

                    field(DCTERMS.LICENSE, value(record, "License", this::license)
                            .flatMap(Parsers::url)
                            .map(Frame::iri)
                    ),

                    field(DCTERMS.TYPE, value(record, "Type", type ->
                            concept(Documents.Types, type, "en")
                    )),

                    field(DCTERMS.SUBJECT, values(record, "Subject", subject ->
                            concept(Documents.Topics, subject, "en")
                    )),

                    field(DCTERMS.AUDIENCE, values(record, "Audience", audience ->
                            concept(Documents.Audiences, audience, "en")
                    )),

                    field(DCTERMS.RELATION, values(record, "Related", related ->
                            related(related, records)
                    ))

            ));
        }


        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        private Optional<IRI> id(final CSVRecord record) {

            final Optional<String> identifier=value(record, "Identifier");
            final Optional<String> titleEnglish=value(record, "Title (English)");
            final Optional<String> titleLocal=value(record, "Title (Local)");

            if ( titleEnglish.isEmpty() && titleLocal.isEmpty() ) {

                warning(record, "no english/local title provided");

                return Optional.empty();

            } else {

                return Optional.of(EC2U.item(Documents.Context, university, identifier
                        .or(() -> titleEnglish)
                        .or(() -> titleLocal)
                        .orElse("") // unexpected
                ));

            }
        }

        private Optional<Frame> publisher(final CSVRecord record) {

            final Optional<IRI> home=value(record, "Home", Parsers::uri).map(Frame::iri);
            final Optional<String> nameEnglish=value(record, "Publisher (English)");
            final Optional<String> nameLocal=value(record, "Publisher (Local)");

            return home.map(Value::stringValue)

                    .or(() -> nameEnglish)
                    .or(() -> nameLocal)

                    .map(id -> {

                        if ( nameEnglish.isEmpty() && nameLocal.isEmpty() ) {

                            warning(record, "no english/local publisher name provided");

                            return null;

                        }

                        return frame(

                                field(ID, EC2U.item(Organizations.Context, university, lower(id))),

                                field(RDF.TYPE, ORG.ORGANIZATION),

                                field(SKOS.PREF_LABEL, nameEnglish.map(v -> literal(v, "en"))),
                                field(SKOS.PREF_LABEL, nameLocal.map(v -> literal(v, university.language))),

                                field(FOAF.HOMEPAGE, home)

                        );

                    });


        }

        private Optional<IRI> related(final String reference, final Collection<CSVRecord> records) {

            final Collection<IRI> matches=records.stream()

                    .filter(record -> value(record, "Identifier").filter(reference::equalsIgnoreCase)
                            .or(() -> value(record, "Title (English)").filter(reference::equalsIgnoreCase))
                            .or(() -> value(record, "Title (Local)").filter(reference::equalsIgnoreCase))
                            .isPresent()
                    )

                    .map(this::id)
                    .flatMap(Optional::stream)

                    .collect(toList());

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
                    .filter(Documents.ValidPattern.asMatchPredicate());
        }

        private Optional<String> license(final String value) {
            return Optional.of(value)
                    .map(Strings::title);
        }

    }

}
