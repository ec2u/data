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

package eu.ec2u.data.documents;

import com.metreeca.http.rdf4j.actions.Upload;
import com.metreeca.http.services.Logger;
import com.metreeca.http.services.Vault;
import com.metreeca.http.toolkits.Strings;
import com.metreeca.http.work.Xtream;
import com.metreeca.link.Frame;

import eu.ec2u.data.EC2U;
import eu.ec2u.data.organizations.Organizations;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.things.Schema;
import eu.ec2u.data.universities._Universities;
import eu.ec2u.work.feeds.CSVProcessor;
import eu.ec2u.work.feeds.Parsers;
import org.apache.commons.csv.CSVRecord;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.util.Values;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.FOAF;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.SKOS;

import java.time.ZoneId;
import java.util.Collection;
import java.util.Optional;
import java.util.stream.Stream;

import static com.metreeca.http.Locator.service;
import static com.metreeca.http.services.Logger.logger;
import static com.metreeca.http.services.Vault.vault;
import static com.metreeca.http.toolkits.Strings.lower;
import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.concepts.Concepts_.concept;
import static eu.ec2u.data.persons.Persons_.person;
import static java.lang.String.format;
import static java.util.stream.Collectors.toList;

final class Documents_ {

    private Documents_() { }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    static final class CSVLoader extends CSVProcessor<Frame> implements Runnable {

        private static final Logger logger=service(logger());


        private final String source;
        private final IRI context;
        private final _Universities university;


        private final Vault vault=service(vault());


        CSVLoader(final String source, final IRI context, final _Universities university) {

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

            final String url=vault
                    .get(source)
                    .orElseThrow(() -> new IllegalStateException(format(
                            "undefined data URL <%s>", source
                    )));

            Xtream.of(url)

                    .flatMap(this)

                    .pipe(frames -> Stream.of(frames.flatMap(Frame::stream).collect(toList())))

                    .forEach(new Upload()
                            .contexts(context)
                            .clear(true)
                    );
        }


        @Override protected Optional<Frame> process(final CSVRecord record, final Collection<CSVRecord> records) {

            final Optional<String> titleEnglish=value(record, "Title (English)");
            final Optional<String> titleLocal=value(record, "Title (Local)");

            return id(record)

                    .map(id -> frame(

                            field(ID, id),

                            Frame.field(RDF.TYPE, Documents.Document),
                            field(Resources.owner, university.Id),

                            field(Schema.url, value(record, "URL (English)", Parsers::iri)),
                            field(Schema.url, value(record, "URL (Local)", Parsers::iri)),

                            field(DCTERMS.IDENTIFIER, value(record, "Identifier")
                                    .map(Values::literal)
                            ),

                            field(DCTERMS.LANGUAGE, titleEnglish
                                    .map(v -> literal("en"))
                            ),

                            field(DCTERMS.LANGUAGE, titleLocal
                                    .map(v -> literal(university.Language))
                            ),

                            field(DCTERMS.TITLE, titleEnglish
                                    .map(v -> literal(v, "en"))
                            ),

                            field(DCTERMS.TITLE, titleLocal
                                    .map(v -> literal(v, university.Language))
                            ),

                            field(DCTERMS.DESCRIPTION, value(record, "Description (English)")
                                    .map(v -> literal(v, "en"))
                            ),

                            field(DCTERMS.DESCRIPTION, value(record, "Description (Local)")
                                    .map(v -> literal(v, university.Language))
                            ),

                            field(DCTERMS.ISSUED, value(record, "Issued", Parsers::localDate)
                                    .map(v -> v.atStartOfDay(ZoneId.of("UTC"))) // ;( ec2u:Resource requires xsd:dateTime
                                    .map(Values::literal)
                            ),

                            field(DCTERMS.MODIFIED, value(record, "Modified", Parsers::localDate)
                                    .map(v -> v.atStartOfDay(ZoneId.of("UTC"))) // ;( ec2u:Resource requires xsd:dateTime
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

                            field(DCTERMS.LICENSE, value(record, "License", this::license)
                                    .map(Values::literal)
                            ),

                            field(DCTERMS.RIGHTS, value(record, "Rights")
                                    .map(Values::literal)
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

                    ))

                    .filter(frame -> Documents.Document().validate(frame)

                            .map(trace -> logger.warning(Documents.class, trace.toString()))

                            .isEmpty()

                    );
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

            final Optional<IRI> home=value(record, "Home", Parsers::iri);
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

                                // !!! field(RDF.TYPE, _Publisher),

                                field(SKOS.PREF_LABEL, nameEnglish.map(v -> literal(v, "en"))),
                                field(SKOS.PREF_LABEL, nameLocal.map(v -> literal(v, university.Language))),

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
