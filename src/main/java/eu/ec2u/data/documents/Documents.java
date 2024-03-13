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

import eu.ec2u.data._EC2U;
import org.eclipse.rdf4j.model.IRI;

public final class Documents /*extends Dataset<Document>*/ {

    public static final IRI Context=_EC2U.item("/documents/");

    // private static final IRI Types=iri(Concepts.Context, "/document-types");
    // private static final IRI Topics=iri(Concepts.Context, "/document-topics");
    // private static final IRI Audiences=iri(Concepts.Context, "/document-audiences");
    //
    //
    // public static final IRI Document=EC2U.term("Document");
    //
    //
    // static Shape _Document() {
    //     throw new UnsupportedOperationException(";( be implemented"); // !!!
    // }
    //
    //
    // ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // public static final class Handler extends Delegator {
    //
    //     public Handler() {
    //         delegate(new Worker()
    //
    //                 .get(new Relator(with(new Documents(), universities -> {
    //
    //                     universities.setId("");
    //                     universities.setLabel(local("en", "Documents"));
    //
    //                     universities.setMembers(Set.of(with(new Document(), document -> {
    //
    //                         document.setId("");
    //                         document.setLabel(local("en", ""));
    //
    //                     })));
    //
    //                 })))
    //
    //         );
    //     }
    //
    // }
    //
    // public static final class Loader implements Runnable {
    //
    //     public static void main(final String... args) {
    //         exec(() -> new Loader().run());
    //     }
    //
    //     @Override public void run() {
    //         Stream
    //
    //                 .of(rdf(Documents.class, ".ttl", Base))
    //
    //                 .forEach(new Upload()
    //                         .contexts(Context)
    //                         .clear(true)
    //                 );
    //     }
    //
    // }
    //

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // static final class CSVLoader extends CSVProcessor<Document> {
    //
    //     private static final Pattern ValidPattern=Pattern.compile(Valid);
    //
    //
    //     private final _Universities university;
    //
    //
    //     CSVLoader(final _Universities university) {
    //
    //         if ( university == null ) {
    //             throw new NullPointerException("null university");
    //         }
    //
    //         this.university=university;
    //     }
    //
    //
    //     @Override protected Optional<Document> process(final CSVRecord record, final Collection<CSVRecord> records) {
    //         return id(record).map(id -> with(new Document(), document -> {
    //
    //             final Local<String> title=title(record);
    //             final Local<String> description=description(record);
    //
    //             document.setId(id);
    //             document.setLabel(title); // !!! clip
    //             document.setComment(description); // !!! clip
    //             // !!! document.setUniversity(university);
    //
    //             document.setUrls(urls(record));
    //             document.setIdentifier(identifier(record));
    //             document.setLanguages(languages(record));
    //
    //             document.setTitle(title);
    //             document.setDescription(description);
    //
    //             document.setIssued(issued(record));
    //             document.setModified(modified(record));
    //             document.setValid(valid(record));
    //
    //             //  .frame(DCTERMS.PUBLISHER, publisher(record))
    //
    //             document.setCreators(creators(record));
    //             document.setContributors(contributors(record));
    //
    //             document.setLicense(license(record));
    //             document.setRights(rights(record));
    //
    //             document.setTypes(types(record));
    //             document.setSubjects(subjects(record));
    //             document.setAudiences(audiences(record));
    //
    //             document.setRelations(relations(record, records));
    //
    //         }));
    //     }
    //
    //
    //     ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    //     private Optional<String> id(final CSVRecord record) {
    //
    //         final Optional<String> identifier=value(record, "Identifier");
    //         final Optional<String> titleEnglish=value(record, "Title (English)");
    //         final Optional<String> titleLocal=value(record, "Title (Local)");
    //
    //         if ( titleEnglish.isEmpty() && titleLocal.isEmpty() ) {
    //
    //             warning(record, "no english/local title provided");
    //
    //             return Optional.empty();
    //
    //         } else {
    //
    //             return Optional.of(EC2U.item(Context, university, identifier
    //                                     .or(() -> titleEnglish)
    //                                     .or(() -> titleLocal)
    //                                     .orElse("") // unexpected
    //                             )
    //                             .stringValue() // !!!
    //             );
    //
    //         }
    //     }
    //
    //
    //     private Set<URI> urls(final CSVRecord record) {
    //         return Stream
    //
    //                 .of(
    //                         value(record, "URL (English)", Parsers::uri),
    //                         value(record, "URL (Local)", Parsers::uri)
    //                 )
    //
    //                 .flatMap(Optional::stream)
    //                 .collect(toSet());
    //     }
    //
    //     private String identifier(final CSVRecord record) {
    //         return value(record, "Identifier")
    //                 .orElse(null);
    //     }
    //
    //     private Set<String> languages(final CSVRecord record) {
    //         return Stream
    //
    //                 .of(
    //                         value(record, "Title (English)").map(v -> "en"),
    //                         value(record, "Title (Local)").map(v -> university.Language)
    //                 )
    //
    //                 .flatMap(Optional::stream)
    //                 .collect(toSet());
    //     }
    //
    //
    //     private Local<String> title(final CSVRecord record) {
    //         return local(Stream
    //
    //                 .of(
    //                         value(record, "Title (English)").map(v -> local("en", v)),
    //                         value(record, "Title (Local)").map(v -> local(university.Language, v))
    //                 )
    //
    //                 .flatMap(Optional::stream)
    //                 .collect(toSet())
    //         );
    //     }
    //
    //     private Local<String> description(final CSVRecord record) {
    //         return local(Stream
    //
    //                 .of(
    //                         value(record, "Description (English)").map(v -> local("en", v)),
    //                         value(record, "Description (Local)").map(v -> local(university.Language, v))
    //                 )
    //
    //                 .flatMap(Optional::stream)
    //                 .collect(toSet())
    //         );
    //     }
    //
    //
    //     private LocalDate issued(final CSVRecord record) {
    //         return value(record, "Issued", Parsers::localDate)
    //                 .orElse(null);
    //     }
    //
    //     private LocalDate modified(final CSVRecord record) {
    //         return value(record, "Modified", Parsers::localDate)
    //                 .orElse(null);
    //     }
    //
    //     private String valid(final CSVRecord record) {
    //         return value(record, "Valid", v -> Optional.of(v)
    //                 .filter(ValidPattern.asMatchPredicate())
    //         )
    //                 .orElse(null);
    //     }
    //
    //
    //     private Optional<Frame> publisher(final CSVRecord record) {
    //
    //         final Optional<IRI> home=value(record, "Home", Parsers::iri);
    //         final Optional<String> nameEnglish=value(record, "Publisher (English)");
    //         final Optional<String> nameLocal=value(record, "Publisher (Local)");
    //
    //         return home.map(Value::stringValue)
    //
    //                 .or(() -> nameEnglish)
    //                 .or(() -> nameLocal)
    //
    //                 .map(id -> {
    //
    //                     if ( nameEnglish.isEmpty() && nameLocal.isEmpty() ) {
    //
    //                         warning(record, "no english/local publisher name provided");
    //
    //                         return null;
    //
    //                     }
    //
    //                     return frame(EC2U.item(Organizations.Context, university, lower(id)))
    //
    //                             .value(RDF.TYPE, Publisher)
    //
    //                             .value(SKOS.PREF_LABEL, nameEnglish.map(v -> literal(v, "en")))
    //                             .value(SKOS.PREF_LABEL, nameLocal.map(v -> literal(v, university.Language)))
    //
    //                             .value(FOAF.HOMEPAGE, home);
    //
    //                 });
    //
    //
    //     }
    //
    //     private Set<Person> creators(final CSVRecord record) {
    //         return values(record, "Contact", person -> person(person, university))
    //                 .collect(toSet());
    //     }
    //
    //     private Set<Person> contributors(final CSVRecord record) {
    //         return values(record, "Contributor", person -> person(person, university))
    //                 .collect(toSet());
    //     }
    //
    //
    //     private String license(final CSVRecord record) {
    //         return value(record, "License")
    //                 .map(Strings::title)
    //                 .orElse(null);
    //     }
    //
    //     private String rights(final CSVRecord record) {
    //         return value(record, "Rights")
    //                 .orElse(null);
    //     }
    //
    //
    //     private Set<Concept> types(final CSVRecord record) {
    //         return value(record, "Type", type ->
    //                 concept(Types, type, "en")
    //         )
    //                 .stream()
    //                 .collect(toSet());
    //     }
    //
    //     private Set<Concept> subjects(final CSVRecord record) {
    //         return values(record, "Subject", subject ->
    //                 concept(Topics, subject, "en")
    //         )
    //                 .collect(toSet());
    //     }
    //
    //     private Set<Concept> audiences(final CSVRecord record) {
    //         return values(record, "Audience", audience ->
    //                 concept(Audiences, audience, "en")
    //         )
    //                 .collect(toSet());
    //     }
    //
    //
    //     private Set<Document> relations(final CSVRecord record, final Collection<CSVRecord> records) {
    //         return values(record, "Related", related -> {
    //
    //             final Collection<String> matches=records.stream()
    //
    //                     .filter(record1 -> value(record1, "Identifier").filter(related::equalsIgnoreCase)
    //                             .or(() -> value(record1, "Title (English)").filter(related::equalsIgnoreCase))
    //                             .or(() -> value(record1, "Title (Local)").filter(related::equalsIgnoreCase))
    //                             .isPresent()
    //                     )
    //
    //                     .map(this::id)
    //                     .flatMap(Optional::stream)
    //
    //                     .collect(toList());
    //
    //             if ( matches.isEmpty() ) {
    //                 warning(format("no matches for reference <%s>", related));
    //             }
    //
    //             if ( matches.size() > 1 ) {
    //                 warning(format("multiple matches for reference <%s>", related));
    //             }
    //
    //             return matches.stream().findFirst();
    //         })
    //
    //                 .map(id -> with(new Document(), related -> related.setId(id)))
    //                 .collect(toSet());
    //     }
    //
    // }
    //
    // static final class _CSVLoader extends CSVProcessor<Frame> {
    //
    //     private static final Pattern ValidPattern=Pattern.compile(Valid);
    //
    //
    //     private final _Universities university;
    //
    //
    //     _CSVLoader(final _Universities university) {
    //
    //         if ( university == null ) {
    //             throw new NullPointerException("null university");
    //         }
    //
    //         this.university=university;
    //     }
    //
    //
    //     @Override protected Optional<Frame> process(final CSVRecord record, final Collection<CSVRecord> records) {
    //
    //         final Optional<String> titleEnglish=value(record, "Title (English)");
    //         final Optional<String> titleLocal=value(record, "Title (Local)");
    //
    //         return id(record).map(id -> frame(id)
    //
    //                 .values(RDF.TYPE, Document)
    //                 .value(Resources.university, university.Id)
    //
    //                 .value(Schema.url, value(record, "URL (English)", Parsers::iri))
    //                 .value(Schema.url, value(record, "URL (Local)", Parsers::iri))
    //
    //                 .value(DCTERMS.IDENTIFIER, value(record, "Identifier")
    //                         .map(Values::literal)
    //                 )
    //
    //                 .value(DCTERMS.LANGUAGE, titleEnglish
    //                         .map(v -> literal("en"))
    //                 )
    //
    //                 .value(DCTERMS.LANGUAGE, titleLocal
    //                         .map(v -> literal(university.Language))
    //                 )
    //
    //                 .value(DCTERMS.TITLE, titleEnglish
    //                         .map(v -> literal(v, "en"))
    //                 )
    //
    //                 .value(DCTERMS.TITLE, titleLocal
    //                         .map(v -> literal(v, university.Language))
    //                 )
    //
    //                 .value(DCTERMS.DESCRIPTION, value(record, "Description (English)")
    //                         .map(v -> literal(v, "en"))
    //                 )
    //
    //                 .value(DCTERMS.DESCRIPTION, value(record, "Description (Local)")
    //                         .map(v -> literal(v, university.Language))
    //                 )
    //
    //                 .value(DCTERMS.ISSUED, value(record, "Issued", Parsers::localDate)
    //                         .map(v -> v.atStartOfDay(ZoneId.of("UTC"))) // ;( ec2u:Resource requires xsd:dateTime
    //                         .map(Values::literal)
    //                 )
    //
    //                 .value(DCTERMS.MODIFIED, value(record, "Modified", Parsers::localDate)
    //                         .map(v -> v.atStartOfDay(ZoneId.of("UTC"))) // ;( ec2u:Resource requires xsd:dateTime
    //                         .map(Values::literal)
    //                 )
    //
    //                 .value(DCTERMS.VALID, value(record, "Valid", this::valid)
    //                         .map(Values::literal)
    //                 )
    //
    //                 .frame(DCTERMS.PUBLISHER, publisher(record))
    //
    //                 .frame(DCTERMS.CREATOR, value(record, "Contact", person -> _person(person, university)))
    //                 .frames(DCTERMS.CONTRIBUTOR, values(record, "Contributor", person -> _person(person, university)))
    //
    //                 .value(DCTERMS.LICENSE, value(record, "License", this::license)
    //                         .map(Values::literal)
    //                 )
    //
    //                 .value(DCTERMS.RIGHTS, value(record, "Rights")
    //                         .map(Values::literal)
    //                 )
    //
    //                 .frame(DCTERMS.TYPE, value(record, "Type", type ->
    //                         _concept(Types, type, "en")
    //                 ))
    //
    //                 .frames(DCTERMS.SUBJECT, values(record, "Subject", subject ->
    //                         _concept(Topics, subject, "en")
    //                 ))
    //
    //                 .frames(DCTERMS.AUDIENCE, values(record, "Audience", audience ->
    //                         _concept(Audiences, audience, "en")
    //                 ))
    //
    //                 .values(DCTERMS.RELATION, values(record, "Related", related ->
    //                         related(related, records)
    //                 ))
    //
    //         );
    //     }
    //
    //
    //     ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    //     private Optional<IRI> id(final CSVRecord record) {
    //
    //         final Optional<String> identifier=value(record, "Identifier");
    //         final Optional<String> titleEnglish=value(record, "Title (English)");
    //         final Optional<String> titleLocal=value(record, "Title (Local)");
    //
    //         if ( titleEnglish.isEmpty() && titleLocal.isEmpty() ) {
    //
    //             warning(record, "no english/local title provided");
    //
    //             return Optional.empty();
    //
    //         } else {
    //
    //             return Optional.of(EC2U.item(Context, university, identifier
    //                     .or(() -> titleEnglish)
    //                     .or(() -> titleLocal)
    //                     .orElse("") // unexpected
    //             ));
    //
    //         }
    //     }
    //
    //     private Optional<Frame> publisher(final CSVRecord record) {
    //
    //         final Optional<IRI> home=value(record, "Home", Parsers::iri);
    //         final Optional<String> nameEnglish=value(record, "Publisher (English)");
    //         final Optional<String> nameLocal=value(record, "Publisher (Local)");
    //
    //         return home.map(Value::stringValue)
    //
    //                 .or(() -> nameEnglish)
    //                 .or(() -> nameLocal)
    //
    //                 .map(id -> {
    //
    //                     if ( nameEnglish.isEmpty() && nameLocal.isEmpty() ) {
    //
    //                         warning(record, "no english/local publisher name provided");
    //
    //                         return null;
    //
    //                     }
    //
    //                     return frame(EC2U.item(Organizations.Context, university, lower(id)))
    //
    //                             .value(RDF.TYPE, Publisher)
    //
    //                             .value(SKOS.PREF_LABEL, nameEnglish.map(v -> literal(v, "en")))
    //                             .value(SKOS.PREF_LABEL, nameLocal.map(v -> literal(v, university.Language)))
    //
    //                             .value(FOAF.HOMEPAGE, home);
    //
    //                 });
    //
    //
    //     }
    //
    //     private Optional<IRI> related(final String reference, final Collection<CSVRecord> records) {
    //
    //         final Collection<IRI> matches=records.stream()
    //
    //                 .filter(record -> value(record, "Identifier").filter(reference::equalsIgnoreCase)
    //                         .or(() -> value(record, "Title (English)").filter(reference::equalsIgnoreCase))
    //                         .or(() -> value(record, "Title (Local)").filter(reference::equalsIgnoreCase))
    //                         .isPresent()
    //                 )
    //
    //                 .map(this::id)
    //                 .flatMap(Optional::stream)
    //
    //                 .collect(toList());
    //
    //         if ( matches.isEmpty() ) {
    //             warning(format("no matches for reference <%s>", reference));
    //         }
    //
    //         if ( matches.size() > 1 ) {
    //             warning(format("multiple matches for reference <%s>", reference));
    //         }
    //
    //         return matches.stream().findFirst();
    //     }
    //
    //
    //     private Optional<String> valid(final String value) {
    //         return Optional.of(value)
    //                 .filter(ValidPattern.asMatchPredicate());
    //     }
    //
    //     private Optional<String> license(final String value) {
    //         return Optional.of(value)
    //                 .map(Strings::title);
    //     }
    //
    // }

}