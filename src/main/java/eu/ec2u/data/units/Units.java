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

package eu.ec2u.data.units;

import com.metreeca.core.Xtream;
import com.metreeca.core.services.Logger;
import com.metreeca.core.toolkits.Strings;
import com.metreeca.csv.codecs.CSV;
import com.metreeca.http.actions.GET;
import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.handlers.Router;
import com.metreeca.jsonld.handlers.Driver;
import com.metreeca.jsonld.handlers.Relator;
import com.metreeca.link.*;
import com.metreeca.rdf4j.actions.Upload;
import com.metreeca.rdf4j.services.Graph;

import eu.ec2u.data.EC2U;
import eu.ec2u.data.concepts.Concepts;
import eu.ec2u.data.persons.Persons;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.work.Cursor;
import org.apache.commons.csv.*;
import org.eclipse.rdf4j.model.*;
import org.eclipse.rdf4j.model.vocabulary.*;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;

import java.io.*;
import java.nio.file.Files;
import java.time.LocalDate;
import java.util.*;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static com.metreeca.core.Locator.service;
import static com.metreeca.core.Locator.storage;
import static com.metreeca.core.services.Logger.logger;
import static com.metreeca.core.toolkits.Formats.ISO_LOCAL_DATE_COMPACT;
import static com.metreeca.core.toolkits.Identifiers.md5;
import static com.metreeca.http.Handler.handler;
import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.*;
import static com.metreeca.link.shapes.All.all;
import static com.metreeca.link.shapes.Clazz.clazz;
import static com.metreeca.link.shapes.Datatype.datatype;
import static com.metreeca.link.shapes.Field.field;
import static com.metreeca.link.shapes.Guard.*;
import static com.metreeca.link.shifts.Seq.seq;
import static com.metreeca.rdf.codecs.RDF.rdf;
import static com.metreeca.rdf4j.services.Graph.graph;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.Base;
import static eu.ec2u.data.resources.Resources.*;

import static java.lang.String.format;
import static java.util.Comparator.comparing;
import static java.util.function.Predicate.not;
import static java.util.stream.Collectors.joining;
import static java.util.stream.Collectors.toList;


public final class Units extends Delegator {

    public static final IRI Context=EC2U.item("/units/");

    public static final IRI Unit=EC2U.term("Unit");


    public static Shape Unit() {
        return relate(Resource(),

                hidden(field(RDF.TYPE, all(Unit))),

                field(FOAF.HOMEPAGE, multiple(), datatype(IRIType)),

                field(SKOS.PREF_LABEL, multilingual()),
                field(SKOS.ALT_LABEL, multilingual()),

                field(ORG.IDENTIFIER, optional(), datatype(XSD.STRING)),
                field(ORG.CLASSIFICATION, optional(), Reference()),

                field(ORG.UNIT_OF, repeatable(), Reference()),
                field(ORG.HAS_UNIT, multiple(), Reference()),

                field("head", inverse(ORG.HEAD_OF), multiple(), Reference())

        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public Units() {
        delegate(handler(

                new Driver(Unit(),

                        filter(clazz(Unit))

                ),

                new Router()

                        .path("/", new Router()
                                .get(new Relator())
                        )

                        .path("/{id}", new Router()
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

                    .of(
                            rdf(Units.class, ".ttl", Base)
                    )

                    .forEach(new Upload()
                            .contexts(Context)
                            .clear(true)
                    );
        }

    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    static final class CSVLoader implements Function<String, Xtream<Frame>> {

        private static final CSVFormat Format=CSVFormat.Builder.create()
                .setHeader()
                .setSkipHeaderRecord(true)
                .setIgnoreHeaderCase(true)
                .setNullString("")
                .build();

        private static final Pattern URLPattern=Pattern.compile("^https?://\\S+$");
        private static final Pattern EmailPattern=Pattern.compile("^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$");
        private static final Pattern HeadPattern=Pattern.compile("([^,]?+)\\s*,\\s*([^(]?+)(?:\\s*\\(([^)]+)\\))?");

        private static final Frame TopicsScheme=frame(iri(Concepts.Context, "/units-topics/"))
                .value(RDF.TYPE, SKOS.CONCEPT_SCHEME)
                .value(RDFS.LABEL, literal("Research Unit Topics", "en"));


        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        private final EC2U.University university;

        private final Map<String, Value> types=new HashMap<>();
        private final Map<String, Value> vis=new HashMap<>();

        private final Graph graph=service(graph());
        private final Logger logger=service(logger());


        CSVLoader(final EC2U.University university) {

            if ( university == null ) {
                throw new NullPointerException("null university");
            }

            this.university=university;
        }


        @Override public Xtream<Frame> apply(final String url) {


            final Collection<CSVRecord> units=Xtream.of(url)
                    .flatMap(this::units)
                    .collect(toList());

            return Xtream.from(units)

                    .optMap(record -> unit(record, units));

        }


        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        private Xtream<CSVRecord> units(final String url) {

            return Xtream.of(url)
                    .optMap(new GET<>(new CSV(Format)))
                    .flatMap(Collection::stream);
        }


        private Optional<Frame> unit(final CSVRecord record, final Collection<CSVRecord> records) {

            final Optional<String> acronym=field(record, "Acronym");

            final Optional<String> nameEnglish=field(record, "Name (English)");
            final Optional<String> nameLocal=field(record, "Name (Local)");

            final Optional<Literal> labelEnglish=acronym
                    .flatMap(a -> nameEnglish.map(n -> format("%s - %s", a, n)))
                    .or(() -> nameEnglish)
                    .map(v -> literal(v, "en"));

            final Optional<Literal> labelLocal=acronym
                    .flatMap(a -> nameLocal.map(n -> format("%s - %s", a, n)))
                    .or(() -> nameLocal)
                    .map(v -> literal(v, university.Language));

            return id(record).map(id -> frame(id)

                    .values(RDF.TYPE, Unit)
                    .value(Resources.university, university.Id)

                    .value(ORG.CLASSIFICATION, field(record, "Type")
                            .flatMap(this::type)
                    )

                    .value(ORG.IDENTIFIER, field(record, "Code").map(Values::literal))

                    .values(ORG.UNIT_OF, field(record, "Parent")
                            .map(parent -> parents(parent, records))
                            .orElseGet(() -> Stream.of(university.Id))
                    )

                    .value(ORG.UNIT_OF, field(record, "VI")
                            .flatMap(this::vi)
                    )

                    .value(DCTERMS.TITLE, labelEnglish)
                    .value(DCTERMS.TITLE, labelLocal)

                    .value(DCTERMS.DESCRIPTION, field(record, "Description (English)")
                            .map(v -> literal(v, "en"))
                    )

                    .value(DCTERMS.DESCRIPTION, field(record, "Description (Local)")
                            .map(v -> literal(v, university.Language))
                    )

                    .frames(DCTERMS.SUBJECT, Stream.concat(

                            field(record, "Topics (English)").stream()
                                    .flatMap(topics -> topics(topics, "en")),

                            field(record, "Topics (Local)").stream()
                                    .flatMap(topics -> topics(topics, university.Language))

                    ))

                    .value(SKOS.PREF_LABEL, labelEnglish)
                    .value(SKOS.PREF_LABEL, labelLocal)

                    .value(SKOS.ALT_LABEL, acronym.map(v -> literal(v, "en"))) // !!! no language
                    .value(SKOS.ALT_LABEL, acronym.map(v -> literal(v, university.Language))) // !!! no language

                    .value(FOAF.HOMEPAGE, field(record, "Factsheet")
                            .filter(URLPattern.asMatchPredicate())
                            .map(Values::iri)
                    )

                    .value(FOAF.HOMEPAGE, field(record, "Homepage")
                            .filter(URLPattern.asMatchPredicate())
                            .map(Values::iri)
                    )

                    .value(FOAF.MBOX, field(record, "Email")
                            .filter(EmailPattern.asMatchPredicate())
                            .map(Values::literal)
                    )

                    .frame(inverse(ORG.HEAD_OF), field(record, "Head")
                            .flatMap(this::head)
                    )

            );
        }


        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        private Optional<IRI> id(final CSVRecord record) {

            final Optional<String> code=field(record, "Code");
            final Optional<String> nameEnglish=field(record, "Name (English)");
            final Optional<String> nameLocal=field(record, "Name (Local)");

            if ( nameEnglish.isEmpty() && nameLocal.isEmpty() ) {

                logger.warning(Units.class, format("line <%d> - no name provided",
                        record.getRecordNumber()));

                return Optional.empty();

            } else {

                return Optional.of(EC2U.item(Context, university.Id, code
                        .or(() -> nameEnglish)
                        .or(() -> nameLocal)
                        .orElse("") // unexpected
                ));

            }
        }

        private Optional<String> field(final CSVRecord record, final String label) {
            return record.getParser().getHeaderNames().contains(label)
                    ? Optional.ofNullable(record.get(label)).map(Strings::normalize).filter(not(String::isEmpty))
                    : Optional.empty();
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

                        query.setBinding("scheme", eu.ec2u.data.concepts.Units.Scheme);
                        query.setBinding("value", literal(key));

                        try ( final TupleQueryResult evaluate=query.evaluate() ) {

                            return evaluate.stream().findFirst()
                                    .map(bindings -> bindings.getValue("concept"))
                                    .orElseGet(() -> {

                                        logger.warning(Units.class, format(
                                                "unknown unit type <%s>", key
                                        ));

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

                                .filter(record -> field(record, "Code").filter(ref::equalsIgnoreCase)
                                        .or(() -> field(record, "Acronym").filter(ref::equalsIgnoreCase))
                                        .or(() -> field(record, "Name (English)").filter(ref::equalsIgnoreCase))
                                        .or(() -> field(record, "Name (Local)").filter(ref::equalsIgnoreCase))
                                        .isPresent()
                                )

                                .findFirst()

                                .flatMap(this::id);

                        if ( id.isEmpty() ) {
                            logger.warning(this, format("unknown parent <%s>", ref));
                        }

                        return id;

                    })
                    .collect(toList());

            return parents.isEmpty() ? Stream.of(university.Id) : parents.stream();
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

                        query.setBinding("type", eu.ec2u.data.concepts.Units.InstituteVirtual);
                        query.setBinding("code", literal(key, "en"));

                        try ( final TupleQueryResult evaluate=query.evaluate() ) {

                            return evaluate.stream().findFirst()
                                    .map(bindings -> bindings.getValue("vi"))
                                    .orElseGet(() -> {

                                        logger.warning(Units.class, format(
                                                "unknown virtual institute <%s>", key
                                        ));

                                        return RDF.NIL;

                                    });

                        }

                    })))

                    .filter(not(RDF.NIL::equals));
        }

        private Optional<Frame> head(final String head) {

            return Optional.of(head)

                    .map(HeadPattern::matcher)
                    .filter(Matcher::matches)
                    .map(matcher -> {

                        final String title=matcher.group(3);
                        final String familyName=matcher.group(1);
                        final String givenName=matcher.group(2);

                        final String fullName=format("%s %s", givenName, familyName);

                        return frame(EC2U.item(Persons.Context, university.Id, fullName))

                                .value(RDF.TYPE, Persons.Person)

                                .value(RDFS.LABEL, literal(fullName, university.Language)) // !!! no language

                                .value(Resources.university, university.Id)

                                .value(FOAF.TITLE, Optional.ofNullable(title).map(Values::literal))
                                .value(FOAF.GIVEN_NAME, literal(givenName))
                                .value(FOAF.FAMILY_NAME, literal(familyName));

                    });
        }

        private Stream<Frame> topics(final String topics, final String language) {
            return Stream.of(topics)

                    .flatMap(Strings::split)
                    .map(v -> literal(v, language))

                    .map(label -> frame(iri(
                                    TopicsScheme.focus().stringValue(),
                                    md5(label.stringValue())
                            ))
                                    .value(RDF.TYPE, SKOS.CONCEPT)
                                    .frame(SKOS.IN_SCHEME, TopicsScheme)
                                    .frame(SKOS.TOP_CONCEPT_OF, TopicsScheme)
                                    .value(SKOS.PREF_LABEL, label)
                    );
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
                        "Description"
                )
                .setDelimiter(',')
                .setQuote('"')
                .setNullString("")
                .build();


        public static void main(final String... args) {
            exec(() -> new CSVExtractor().run());
        }


        @Override public void run() {

            try (
                    final Writer writer=Files.newBufferedWriter(service(storage()).resolve(Output));
                    final CSVPrinter printer=new CSVPrinter(writer, Format);
            ) {

                service(graph()).query(connection -> {

                    new Cursor(Unit, connection)

                            .cursors(inverse(RDF.TYPE))

                            .map(unit -> List.of(

                                    unit.focus().stringValue(),

                                    unit.values(seq(Resources.university, RDFS.LABEL))
                                            .filter(value -> lang(value).equals("en"))
                                            .findFirst()
                                            .map(Value::stringValue)
                                            .orElse(""),

                                    "", // !!! sector

                                    unit.values(seq(ORG.CLASSIFICATION, SKOS.PREF_LABEL))
                                            .filter(value -> lang(value).equals("en"))
                                            .findFirst()
                                            .map(Value::stringValue)
                                            .orElse(""),

                                    unit.value(ORG.IDENTIFIER)
                                            .map(Value::stringValue)
                                            .orElse(""),

                                    unit.cursors(ORG.UNIT_OF)
                                            .filter(parent -> parent.values(RDF.TYPE).noneMatch(Resources.university::equals))
                                            .filter(parent -> parent.values(ORG.CLASSIFICATION).noneMatch(eu.ec2u.data.concepts.Units.InstituteVirtual::equals))
                                            .flatMap(parent -> parent.localizeds(RDFS.LABEL, "en"))
                                            .filter(not(v -> v.startsWith("University "))) // !!!
                                            .collect(joining("; ")),

                                    unit.cursors(ORG.UNIT_OF)
                                            .filter(parent -> parent.values(ORG.CLASSIFICATION).anyMatch(eu.ec2u.data.concepts.Units.InstituteVirtual::equals))
                                            .flatMap(parent -> parent.strings(SKOS.ALT_LABEL))
                                            .collect(joining("; ")),

                                    unit.localized(SKOS.ALT_LABEL, "en")
                                            .or(() -> unit.string(SKOS.ALT_LABEL)) // !!! local language
                                            .orElse(""),

                                    unit.localized(SKOS.PREF_LABEL, "en")
                                            .or(() -> unit.string(SKOS.PREF_LABEL)) // !!! local language
                                            .orElse(""),

                                    unit.iris(FOAF.HOMEPAGE)
                                            .map(Value::stringValue)
                                            .collect(joining("; ")),

                                    unit.strings(FOAF.MBOX)
                                            .collect(joining("; ")),

                                    unit.strings(seq(inverse(ORG.HEAD_OF), RDFS.LABEL))
                                            .collect(joining("; ")),

                                    unit.localized(DCTERMS.DESCRIPTION, "en")
                                            .or(() -> unit.string(DCTERMS.DESCRIPTION)) // !!! local language
                                            .orElse("")

                            ))

                            .peek(System.out::println)

                            .sorted(comparing((List<String> record) -> record.get(1)) // University
                                    .thenComparing(record -> record.get(2)) // Type
                                    .thenComparing(record -> record.get(7)) // Name
                            )

                            .forEach(record -> {

                                try {

                                    printer.printRecord(record);

                                } catch ( final IOException e ) {
                                    throw new UncheckedIOException(e);
                                }

                            });

                    return this;

                });

            } catch ( final IOException e ) {
                throw new UncheckedIOException(e);
            }

        }

    }

}