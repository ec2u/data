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

package eu.ec2u.data.units;

import com.metreeca.http.rdf4j.services.Graph;
import com.metreeca.http.toolkits.Strings;
import com.metreeca.http.work.Xtream;
import com.metreeca.link.Frame;

import eu.ec2u.data.EC2U;
import eu.ec2u.data.concepts.EuroSciVoc;
import eu.ec2u.data.concepts.OrganizationTypes;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.universities.University;
import eu.ec2u.work.feeds.CSVProcessor;
import eu.ec2u.work.feeds.Parsers;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVRecord;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.util.Values;
import org.eclipse.rdf4j.model.vocabulary.*;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Stream;

import static com.metreeca.http.Locator.service;
import static com.metreeca.http.rdf4j.services.Graph.graph;
import static com.metreeca.http.toolkits.Formats.ISO_LOCAL_DATE_COMPACT;
import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.concepts.OrganizationTypes.InstituteVirtual;
import static eu.ec2u.data.persons.Persons_.person;
import static eu.ec2u.data.units.Units.*;
import static java.lang.String.format;
import static java.util.function.Predicate.not;
import static java.util.stream.Collectors.toList;
import static org.eclipse.rdf4j.model.util.Values.literal;

public final class Units_ {

    static final class CSVLoader extends CSVProcessor<Frame> {

        private final University university;

        private final Map<String, Value> sectors=new HashMap<>();
        private final Map<String, Value> types=new HashMap<>();
        private final Map<String, Value> vis=new HashMap<>();

        private final Graph graph=service(graph());


        CSVLoader(final University university) {

            if ( university == null ) {
                throw new NullPointerException("null university");
            }

            this.university=university;
        }


        @Override protected Optional<Frame> process(final CSVRecord record, final Collection<CSVRecord> records) {

            final Optional<String> acronym=value(record, "Acronym");

            final Optional<Literal> nameEnglish=value(record, "Name (English)").map(v -> literal(v, "en"));
            final Optional<Literal> nameLocal=value(record, "Name (Local)").map(v -> literal(v, university.language));

            return id(record).map(id -> frame(

                    field(ID, id),

                    field(RDF.TYPE, Unit),
                    field(Resources.partner, university.id),

                    field(DCTERMS.SUBJECT, value(record, "Sector")
                            .flatMap(this::sector)
                    ),

                    field(ORG.CLASSIFICATION, value(record, "Type")
                            .flatMap(this::type)
                    ),

                    field(ORG.IDENTIFIER, value(record, "Code").map(Frame::literal)),

                    field(ORG.UNIT_OF, value(record, "Parent")
                            .map(parent -> parents(parent, records))
                            .orElseGet(() -> Stream.of(university.id))
                    ),

                    field(ORG.UNIT_OF, value(record, "VI")
                            .flatMap(this::vi)
                    ),

                    field(DCTERMS.TITLE, nameEnglish),
                    field(DCTERMS.TITLE, nameLocal),

                    field(DCTERMS.DESCRIPTION, value(record, "Description (English)")
                            .map(v -> literal(v, "en"))
                    ),

                    field(DCTERMS.DESCRIPTION, value(record, "Description (Local)")
                            .map(v -> literal(v, university.language))
                    ),

                    field(DCTERMS.SUBJECT, Stream.concat(

                            value(record, "Topics (English)").stream()
                                    .flatMap(topics -> topics(topics, "en")),

                            value(record, "Topics (Local)").stream()
                                    .flatMap(topics -> topics(topics, university.language))

                    )),

                    field(SKOS.PREF_LABEL, nameEnglish),
                    field(SKOS.PREF_LABEL, nameLocal),

                    field(SKOS.ALT_LABEL, acronym.map(v -> literal(v, "en"))), // !!! no language
                    field(SKOS.ALT_LABEL, acronym.map(v -> literal(v, university.language))), // !!! no language

                    field(FOAF.HOMEPAGE, value(record, "Factsheet", Parsers::uri).map(Values::literal)),

                    field(FOAF.HOMEPAGE, value(record, "Factsheet (English)", Parsers::uri).map(uri -> frame(
                            field(ID, iri(uri)),
                            field(DCTERMS.LANGUAGE, literal("en"))
                    ))),

                    field(FOAF.HOMEPAGE, value(record, "Factsheet (Local)", Parsers::uri).map(uri -> frame(
                            field(ID, iri(uri)),
                            field(DCTERMS.LANGUAGE, literal(university.language))
                    ))),


                    field(FOAF.HOMEPAGE, value(record, "Homepage", Parsers::uri).map(Values::literal)),

                    field(FOAF.HOMEPAGE, value(record, "Homepage (English)", Parsers::uri).map(uri -> frame(
                            field(ID, iri(uri)),
                            field(DCTERMS.LANGUAGE, literal("en"))
                    ))),

                    field(FOAF.HOMEPAGE, value(record, "Homepage (Local)", Parsers::uri).map(uri -> frame(
                            field(ID, iri(uri)),
                            field(DCTERMS.LANGUAGE, literal(university.language))
                    ))),


                    field(FOAF.MBOX, value(record, "Email", Parsers::email).map(Frame::literal)),

                    field(reverse(ORG.HEAD_OF), value(record, "Head", person -> person(person, university)))

            ));
        }


        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        private Optional<IRI> id(final CSVRecord record) {

            final Optional<String> code=value(record, "Code");
            final Optional<String> nameEnglish=value(record, "Name (English)");
            final Optional<String> nameLocal=value(record, "Name (Local)");

            if ( nameEnglish.isEmpty() && nameLocal.isEmpty() ) {

                warning(record, "no name provided");

                return Optional.empty();

            } else {

                return Optional.of(EC2U.item(Context, university, code
                        .or(() -> nameEnglish)
                        .or(() -> nameLocal)
                        .orElse("") // unexpected
                ));

            }
        }

        private Optional<Value> sector(final String sector) {
            return Optional

                    .of(sectors.computeIfAbsent(sector, key -> graph.query(connection -> {

                        final TupleQuery query=connection.prepareTupleQuery(""
                                +"prefix skos: <http://www.w3.org/2004/02/skos/core#>\n"
                                +"\n"
                                +"select ?concept {\n"
                                +"\n"
                                +"\t?concept skos:inScheme $scheme; skos:prefLabel|skos:altLabel $label. \n"
                                +"\n"
                                +"\tfilter (lcase(str(?label)) = lcase(str($value)))\n"
                                +"\n"
                                +"}\n"
                        );

                        query.setBinding("scheme", EuroSciVoc.Scheme);
                        query.setBinding("value", literal(key));

                        try ( final TupleQueryResult evaluate=query.evaluate() ) {

                            return evaluate.stream().findFirst()
                                    .map(bindings -> bindings.getValue("concept"))
                                    .orElseGet(() -> {

                                        warning(format("unknown sector <%s>", key));

                                        return RDF.NIL;

                                    });

                        }

                    })))

                    .filter(not(RDF.NIL::equals));
        }

        private Optional<Value> type(final String type) {
            return Optional

                    .of(types.computeIfAbsent(type, key -> graph.query(connection -> {

                        final TupleQuery query=connection.prepareTupleQuery(""
                                +"prefix skos: <http://www.w3.org/2004/02/skos/core#>\n"
                                +"\n"
                                +"select ?concept {\n"
                                +"\n"
                                +"\t?concept skos:inScheme $scheme; skos:prefLabel|skos:altLabel $label. \n"
                                +"\n"
                                +"\tfilter (lcase(str(?label)) = lcase(str($value)))\n"
                                +"\n"
                                +"}\n"
                        );

                        query.setBinding("scheme", OrganizationTypes.Scheme);
                        query.setBinding("value", literal(key));

                        try ( final TupleQueryResult evaluate=query.evaluate() ) {

                            return evaluate.stream().findFirst()
                                    .map(bindings -> bindings.getValue("concept"))
                                    .orElseGet(() -> {

                                        warning(format("unknown unit type <%s>", key));

                                        return RDF.NIL;

                                    });

                        }

                    })))

                    .filter(not(RDF.NIL::equals));
        }

        private Stream<Value> parents(final String parent, final Collection<CSVRecord> records) {

            final List<Value> parents=Xtream.of(parent)
                    .flatMap(Strings::split)
                    .optMap(ref -> {

                        final Optional<IRI> id=records.stream()

                                .filter(record -> value(record, "Code").filter(ref::equalsIgnoreCase)
                                        .or(() -> {
                                            return value(record, "Acronym").filter(ref::equalsIgnoreCase);
                                        })
                                        .or(() -> {
                                            return value(record, "Name (English)").filter(ref::equalsIgnoreCase);
                                        })
                                        .or(() -> {
                                            return value(record, "Name (Local)").filter(ref::equalsIgnoreCase);
                                        })
                                        .isPresent()
                                )

                                .findFirst()

                                .flatMap(this::id);

                        if ( id.isEmpty() ) {
                            warning(format("unknown parent <%s>", ref));
                        }

                        return id;

                    })
                    .collect(toList());

            return parents.isEmpty() ? Stream.of(university.id) : parents.stream();
        }

        private Optional<Value> vi(final String code) {
            return Optional

                    .of(vis.computeIfAbsent(code, key -> graph.query(connection -> {

                        final TupleQuery query=connection.prepareTupleQuery(""
                                +"prefix ec2u: <https://data.ec2u.eu/terms/>\n"
                                +"prefix org: <http://www.w3.org/ns/org#>\n"
                                +"prefix skos: <http://www.w3.org/2004/02/skos/core#>\n"
                                +"\n"
                                +"select ?vi {\n"
                                +"\n"
                                +"\t?vi a ec2u:Unit;\n"
                                +"\t\torg:classification $type;\n"
                                +"\t\tskos:altLabel $code.\n"
                                +"\n"
                                +"}"
                        );

                        query.setBinding("type", InstituteVirtual);
                        query.setBinding("code", literal(key, "en"));

                        try ( final TupleQueryResult evaluate=query.evaluate() ) {

                            return evaluate.stream().findFirst()
                                    .map(bindings -> bindings.getValue("vi"))
                                    .orElseGet(() -> {

                                        warning(format("unknown virtual institute <%s>", key));

                                        return RDF.NIL;

                                    });

                        }

                    })))

                    .filter(not(RDF.NIL::equals));
        }

        private Stream<Frame> topics(final String topics, final String language) {
            return Stream.of(topics)

                    .flatMap(Strings::split)
                    .map(v -> literal(v, language))

                    .map(label -> frame(
                            field(ID, EC2U.item(Scheme, label.stringValue())),
                            field(RDF.TYPE, SKOS.CONCEPT),
                            field(SKOS.TOP_CONCEPT_OF, Scheme),
                            field(SKOS.PREF_LABEL, label)
                    ));
        }

    }


    public static final class CSVExtractor implements Runnable {

        private static final String Output=format(
                "EC2U Research Units %s.csv", LocalDate.now().format(ISO_LOCAL_DATE_COMPACT)
        );

        private static final CSVFormat Format=CSVFormat.Builder.create()
                .setHeader(
                        "Id", "University",
                        "Sector", "Type", "Code", "Parent", "VI",
                        "Acronym", "Name",
                        "Homepage", "Email", "Head",
                        "Description", "Topics"
                )
                .setDelimiter(',')
                .setQuote('"')
                .setNullString("")
                .build();


        public static void main(final String... args) {
            exec(() -> new CSVExtractor().run());
        }


        @Override public void run() {

            throw new UnsupportedOperationException(";( be implemented"); // !!!

            // try (
            //         final Writer writer=Files.newBufferedWriter(service(path()).resolve(Output));
            //         final CSVPrinter printer=new CSVPrinter(writer, Format);
            // ) {
            //
            //     service(graph()).query(connection -> {
            //
            //         focus(Set.of(Unit), connection)
            //
            //                 .seq(reverse(RDF.TYPE))
            //                 .split()
            //
            //                 .map(unit -> List.of(
            //
            //                         unit.focus().stringValue(),
            //
            //                         unit.seq(Resources.owner, RDFS.LABEL).values()
            //                                 .filter(value -> lang(value).equals("en"))
            //                                 .findFirst()
            //                                 .map(Value::stringValue)
            //                                 .orElse(""),
            //
            //                         unit.cursors(DCTERMS.SUBJECT)
            //                                 .filter(v -> v.focus().stringValue().startsWith(EuroSciVoc.Scheme+"/"))
            //                                 .flatMap(cursor -> cursor.values(SKOS.PREF_LABEL))
            //                                 .filter(value -> lang(value).equals("en"))
            //                                 .findFirst()
            //                                 .map(Value::stringValue)
            //                                 .orElse(""),
            //
            //                         unit.values(seq(ORG.CLASSIFICATION, SKOS.PREF_LABEL))
            //                                 .filter(value -> lang(value).equals("en"))
            //                                 .findFirst()
            //                                 .map(Value::stringValue)
            //                                 .orElse(""),
            //
            //                         unit.value(ORG.IDENTIFIER)
            //                                 .map(Value::stringValue)
            //                                 .orElse(""),
            //
            //                         unit.cursors(ORG.UNIT_OF)
            //                                 .filter(parent -> parent.values(RDF.TYPE).noneMatch(Resources.owner::equals))
            //                                 .filter(parent -> parent.values(ORG.CLASSIFICATION).noneMatch(InstituteVirtual::equals))
            //                                 .flatMap(parent -> parent.localizeds(RDFS.LABEL, "en"))
            //                                 .filter(not(v -> v.startsWith("University "))) // !!!
            //                                 .collect(joining("; ")),
            //
            //                         unit.cursors(ORG.UNIT_OF)
            //                                 .filter(parent -> parent.values(ORG.CLASSIFICATION).anyMatch(InstituteVirtual::equals))
            //                                 .flatMap(parent -> parent.strings(SKOS.ALT_LABEL))
            //                                 .collect(joining("; ")),
            //
            //                         unit.localized(SKOS.ALT_LABEL, "en")
            //                                 .or(() -> unit.string(SKOS.ALT_LABEL)) // !!! local language
            //                                 .orElse(""),
            //
            //                         unit.localized(SKOS.PREF_LABEL, "en")
            //                                 .or(() -> unit.string(SKOS.PREF_LABEL)) // !!! local language
            //                                 .orElse(""),
            //
            //                         unit.iris(FOAF.HOMEPAGE)
            //                                 .map(Value::stringValue)
            //                                 .collect(joining("; ")),
            //
            //                         unit.strings(FOAF.MBOX)
            //                                 .collect(joining("; ")),
            //
            //                         unit.strings(seq(reverse(ORG.HEAD_OF), RDFS.LABEL))
            //                                 .collect(joining("; ")),
            //
            //                         unit.localized(DCTERMS.DESCRIPTION, "en")
            //                                 .or(() -> unit.string(DCTERMS.DESCRIPTION)) // !!! local language
            //                                 .orElse(""),
            //
            //                         unit.cursors(DCTERMS.SUBJECT)
            //                                 .filter(not(v -> v.focus().stringValue().startsWith(EuroSciVoc.Scheme+"/")))
            //                                 .flatMap(cursor -> cursor.values(SKOS.PREF_LABEL))
            //                                 // !!! .filter(value -> lang(value).equals("en"))
            //                                 .map(Value::stringValue)
            //                                 .collect(joining(";\n"))
            //
            //                 ))
            //
            //                 .sorted(comparing((List<String> record) -> record.get(1)) // University
            //                         .thenComparing(record -> record.get(2)) // Type
            //                         .thenComparing(record -> record.get(7)) // Name
            //                 )
            //
            //                 .forEach(record -> {
            //
            //                     try {
            //
            //                         printer.printRecord(record);
            //
            //                     } catch ( final IOException e ) {
            //                         throw new UncheckedIOException(e);
            //                     }
            //
            //                 });
            //
            //         return this;
            //
            //     });
            //
            // } catch ( final IOException e ) {
            //     throw new UncheckedIOException(e);
            // }

        }

    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Units_() { }

}
