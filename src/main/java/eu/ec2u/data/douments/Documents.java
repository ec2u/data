/*
 * Copyright © 2020-2023 EC2U Alliance
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

package eu.ec2u.data.douments;

import com.metreeca.core.toolkits.Strings;
import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.handlers.Router;
import com.metreeca.http.handlers.Worker;
import com.metreeca.jsonld.handlers.Driver;
import com.metreeca.jsonld.handlers.Relator;
import com.metreeca.link.Frame;
import com.metreeca.link.Shape;
import com.metreeca.link.Values;
import com.metreeca.rdf4j.actions.Upload;

import eu.ec2u.data.EC2U;
import eu.ec2u.data.EC2U.University;
import eu.ec2u.data.concepts.Concepts;
import eu.ec2u.data.organizations.Organizations;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.things.Schema;
import eu.ec2u.work.feeds.CSVProcessor;
import eu.ec2u.work.feeds.Parsers;
import org.apache.commons.csv.CSVRecord;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.time.ZoneId;
import java.util.Collection;
import java.util.Optional;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static com.metreeca.core.toolkits.Strings.lower;
import static com.metreeca.http.Handler.handler;
import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.*;
import static com.metreeca.link.shapes.All.all;
import static com.metreeca.link.shapes.Clazz.clazz;
import static com.metreeca.link.shapes.Datatype.datatype;
import static com.metreeca.link.shapes.Field.field;
import static com.metreeca.link.shapes.Guard.*;
import static com.metreeca.rdf.codecs.RDF.rdf;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.Base;
import static eu.ec2u.data.resources.Resources.*;
import static eu.ec2u.work.feeds.Parsers.concept;
import static eu.ec2u.work.feeds.Parsers.person;
import static java.lang.String.format;
import static java.util.stream.Collectors.toList;


public final class Documents extends Delegator {

    public static final IRI Context=EC2U.item("/documents/");

    private static final IRI Types=iri(Concepts.Context, "/document-types");
    private static final IRI Topics=iri(Concepts.Context, "/document-topics");
    private static final IRI Audiences=iri(Concepts.Context, "/document-audiences");


    public static final IRI Document=EC2U.term("Document");


    public static Shape Document() {
        return relate(Resource(),

                hidden(field(RDF.TYPE, all(Document))),

                field(Schema.url, multiple(), datatype(IRIType)),

                field(DCTERMS.IDENTIFIER, optional(), datatype(XSD.STRING)),
                field(DCTERMS.LANGUAGE, multiple(), datatype(XSD.STRING)),

                field(DCTERMS.VALID, optional(), datatype(XSD.STRING)),

                field(DCTERMS.CREATOR, multiple(), Reference()),
                field(DCTERMS.CONTRIBUTOR, multiple(), Reference()),

                field(DCTERMS.LICENSE, optional(), datatype(XSD.STRING)),
                field(DCTERMS.RIGHTS, optional(), datatype(XSD.STRING)),

                field(DCTERMS.AUDIENCE, multiple(), Reference()),
                field(DCTERMS.RELATION, multiple(), Reference())

        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public Documents() {
        delegate(handler(

                new Driver(Document(),

                        filter(clazz(Document))

                ),

                new Router()

                        .path("/", new Worker()
                                .get(new Relator())
                        )

                        .path("/{id}", new Worker()
                                .get(new Relator())
                        )

        ));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static final class Loader implements Runnable {

        public static void main(final String... args) {
            exec(() -> new Loader().run());
        }

        @Override public void run() {
            Stream

                    .of(rdf(Documents.class, ".ttl", Base))

                    .forEach(new Upload()
                            .contexts(Context)
                            .clear(true)
                    );
        }

    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    static final class CSVLoader extends CSVProcessor<Frame> {

        private static final Pattern ValidPattern=Pattern.compile("\\d{4}(?:/\\d{4})?");


        private final University university;

        CSVLoader(final University university) {

            if ( university == null ) {
                throw new NullPointerException("null university");
            }

            this.university=university;
        }


        @Override protected Optional<Frame> process(final CSVRecord record, final Collection<CSVRecord> records) {

            final Optional<String> titleEnglish=value(record, "Title (English)");
            final Optional<String> titleLocal=value(record, "Title (Local)");

            return id(record).map(id -> frame(id)

                    .values(RDF.TYPE, Document)
                    .value(Resources.university, university.Id)

                    .value(Schema.url, value(record, "URL (English)", Parsers::url))
                    .value(Schema.url, value(record, "URL (Local)", Parsers::url))

                    .value(DCTERMS.IDENTIFIER, value(record, "Identifier")
                            .map(Values::literal)
                    )

                    .value(DCTERMS.LANGUAGE, titleEnglish
                            .map(v -> literal("en"))
                    )

                    .value(DCTERMS.LANGUAGE, titleLocal
                            .map(v -> literal(university.Language))
                    )

                    .value(DCTERMS.TITLE, titleEnglish
                            .map(v -> literal(v, "en"))
                    )

                    .value(DCTERMS.TITLE, titleLocal
                            .map(v -> literal(v, university.Language))
                    )

                    .value(DCTERMS.DESCRIPTION, value(record, "Description (English)")
                            .map(v -> literal(v, "en"))
                    )

                    .value(DCTERMS.DESCRIPTION, value(record, "Description (Local)")
                            .map(v -> literal(v, university.Language))
                    )

                    .value(DCTERMS.ISSUED, value(record, "Issued", Parsers::localDate)
                            .map(v -> v.atStartOfDay(ZoneId.of("UTC"))) // ;( ec2u:Resource requires xsd:dateTime
                            .map(Values::literal)
                    )

                    .value(DCTERMS.MODIFIED, value(record, "Modified", Parsers::localDate)
                            .map(v -> v.atStartOfDay(ZoneId.of("UTC"))) // ;( ec2u:Resource requires xsd:dateTime
                            .map(Values::literal)
                    )

                    .value(DCTERMS.VALID, value(record, "Valid", this::valid)
                            .map(Values::literal)
                    )

                    .frame(DCTERMS.PUBLISHER, publisher(record))

                    .frame(DCTERMS.CREATOR, value(record, "Contact", person -> person(person, university)))
                    .frames(DCTERMS.CONTRIBUTOR, values(record, "Contributor", person -> person(person, university)))

                    .value(DCTERMS.LICENSE, value(record, "License", this::license)
                            .map(Values::literal)
                    )

                    .value(DCTERMS.RIGHTS, value(record, "Rights")
                            .map(Values::literal)
                    )

                    .frame(DCTERMS.TYPE, value(record, "Type", type ->
                            concept(Types, type, "en")
                    ))

                    .frames(DCTERMS.SUBJECT, values(record, "Subject", subject ->
                            concept(Topics, subject, "en")
                    ))

                    .frames(DCTERMS.AUDIENCE, values(record, "Audience", audience ->
                            concept(Audiences, audience, "en")
                    ))

                    .values(DCTERMS.RELATION, values(record, "Related", related ->
                            related(related, records)
                    ))

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

                return Optional.of(EC2U.item(Context, university, identifier
                        .or(() -> titleEnglish)
                        .or(() -> titleLocal)
                        .orElse("") // unexpected
                ));

            }
        }

        private Optional<Frame> publisher(final CSVRecord record) {

            final Optional<IRI> home=value(record, "Home", Parsers::url);
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

                        return frame(EC2U.item(Organizations.Context, university, lower(id)))

                                .value(RDF.TYPE, Publisher)

                                .value(SKOS.PREF_LABEL, nameEnglish.map(v -> literal(v, "en")))
                                .value(SKOS.PREF_LABEL, nameLocal.map(v -> literal(v, university.Language)))

                                .value(FOAF.HOMEPAGE, home);

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
                    .filter(ValidPattern.asMatchPredicate());
        }

        private Optional<String> license(final String value) {
            return Optional.of(value)
                    .map(Strings::title);
        }

    }

}