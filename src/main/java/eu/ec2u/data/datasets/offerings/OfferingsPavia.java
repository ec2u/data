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

package eu.ec2u.data.datasets.offerings;


import com.metreeca.flow.Xtream;
import com.metreeca.flow.actions.Fill;
import com.metreeca.flow.http.actions.Fetch;
import com.metreeca.flow.http.actions.GET;
import com.metreeca.flow.http.actions.Parse;
import com.metreeca.flow.http.actions.Query;
import com.metreeca.flow.json.formats.JSON;
import com.metreeca.flow.services.Logger;
import com.metreeca.flow.services.Vault;
import com.metreeca.flow.xml.XPath;
import com.metreeca.flow.xml.formats.XML;
import com.metreeca.mesh.Value;
import com.metreeca.mesh.tools.Store;
import com.metreeca.shim.Locales;

import eu.ec2u.data.datasets.courses.Course;
import eu.ec2u.data.datasets.courses.CourseFrame;
import eu.ec2u.data.datasets.organizations.OrganizationFrame;
import eu.ec2u.data.datasets.programs.ProgramFrame;
import eu.ec2u.data.datasets.taxonomies.Topic;
import eu.ec2u.data.datasets.taxonomies.TopicFrame;
import eu.ec2u.data.datasets.taxonomies.TopicsISCED2011;
import eu.ec2u.data.vocabularies.schema.SchemaEvent.EventAttendanceModeEnumeration;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import java.time.*;
import java.util.*;
import java.util.Map.Entry;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.async;
import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.http.Request.POST;
import static com.metreeca.flow.http.Request.basic;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.flow.services.Vault.vault;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.Value.value;
import static com.metreeca.mesh.queries.Criterion.criterion;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.shim.Collections.*;
import static com.metreeca.shim.Futures.joining;
import static com.metreeca.shim.Loggers.time;
import static com.metreeca.shim.Streams.distinct;
import static com.metreeca.shim.Streams.optional;
import static com.metreeca.shim.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.Localized.EN;
import static eu.ec2u.data.datasets.courses.Courses.COURSES;
import static eu.ec2u.data.datasets.organizations.Organizations.ORGANIZATIONS;
import static eu.ec2u.data.datasets.programs.Program.review;
import static eu.ec2u.data.datasets.programs.Programs.PROGRAMS;
import static eu.ec2u.data.datasets.taxonomies.TopicsSDGs.SDGS;
import static eu.ec2u.data.datasets.universities.University.PAVIA;
import static eu.ec2u.data.datasets.universities.University.uuid;
import static eu.ec2u.data.vocabularies.schema.SchemaEvent.EventAttendanceModeEnumeration.*;
import static java.lang.String.format;
import static java.util.function.Predicate.not;
import static java.util.function.UnaryOperator.identity;

public final class OfferingsPavia implements Runnable {

    private static final String ESSE3_URL="https://studentionline.unipv.it/e3rest/api/offerta-service-v1/offerte/";

    private static final String API_URL="offerings-pavia-url";
    private static final String API_USR="offerings-pavia-usr";
    private static final String API_PWD="offerings-pavia-pwd";


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static final int ESSE3_PAGE_SIZE=100;

    // https://ec2u.atlassian.net/wiki/spaces/infrastructure/pages/345407519/Knowledge+Hub+-+Offerings+-+Degree+Programs#Pavia

    private static final Map<String, Topic> CODE_TO_LEVEL=map(

            entry("L2", TopicsISCED2011.LEVEL_6), // Corso di Laurea

            entry("LC5", TopicsISCED2011.LEVEL_7), // Laurea Ciclo Unico 5 anni
            entry("LC6", TopicsISCED2011.LEVEL_7), // Laurea Ciclo Unico 6 anni
            entry("LM", TopicsISCED2011.LEVEL_7), // Corso di Laurea Magistrale
            entry("LM5", TopicsISCED2011.LEVEL_7), // Laurea Magistrale Ciclo Unico 5 anni
            entry("LM6", TopicsISCED2011.LEVEL_7), // Laurea Magistrale Ciclo Unico 6 anni
            entry("M1", TopicsISCED2011.LEVEL_7), // Master di Primo Livello
            entry("M2", TopicsISCED2011.LEVEL_7), // Master di Secondo Livello
            entry("CPA", TopicsISCED2011.LEVEL_7), // Corso di Perfezionamento

            entry("D1", TopicsISCED2011.LEVEL_8), // Corso di Dottorato di ricerca
            entry("SP2", TopicsISCED2011.LEVEL_8), // Scuola di Specializzazione (2 anni)
            entry("SP3", TopicsISCED2011.LEVEL_8), // Scuola di Specializzazione (3 anni)
            entry("SP4", TopicsISCED2011.LEVEL_8), // Scuola di Specializzazione (4 anni)
            entry("SP5", TopicsISCED2011.LEVEL_8), // Scuola di Specializzazione (5 anni)
            entry("SP6", TopicsISCED2011.LEVEL_8), // Scuola di Specializzazione (6 anni)

            entry("FI", TopicsISCED2011.LEVEL_9), // Formazione iniziale insegnanti
            entry("PAS", TopicsISCED2011.LEVEL_9), // Percorso Abilitante Speciale
            entry("CS", TopicsISCED2011.LEVEL_9) // Corso Singolo

    );

    private static final Map<String, EventAttendanceModeEnumeration> DID_TO_MODE=Map.ofEntries(
            entry("Convenzionale", OfflineEventAttendanceMode),
            entry("Teledidattica", OnlineEventAttendanceMode),
            entry("Blend/modalità mista", MixedEventAttendanceMode)
    );


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static void main(final String... args) {
        exec(() -> new OfferingsPavia().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Vault vault=service(vault());
    private final Store store=service(store());
    private final Logger logger=service(logger());


    @Override
    public void run() {
        time(() -> {

            final List<Value> programs=list(Stream.of(Instant.now())

                    .map(now -> LocalDate.ofInstant(now, PAVIA.zone()))

                    .map(date -> date.getMonth().compareTo(Month.JULY) >= 0
                            ? Year.from(date)
                            : Year.from(date).minusYears(1)
                    )

                    .flatMap(this::programs)
            );

            return Stream

                    .of(

                            async(() -> store.modify(

                                    array(programs.stream()
                                            .map(program -> async(() -> program(program)))
                                            .collect(joining())
                                            .flatMap(Optional::stream)
                                    ),

                                    value(query(new ProgramFrame(true))
                                            .where("university", criterion().any(PAVIA))
                                    )
                            )),

                            async(() -> store.modify(

                                    array(programs.stream()
                                            .map(program -> async(() -> courses(program)))
                                            .collect(joining())
                                            .flatMap(identity())
                                    ),

                                    value(query(new CourseFrame(true))
                                            .where("university", criterion().any(PAVIA))
                                    )

                            ))

                    )

                    .collect(joining())
                    .reduce(0, Integer::sum);

        }).apply((elapsed, resources) -> logger.info(this, format(
                "synced <%,d> resources in <%,d> ms", resources, elapsed
        )));
    }


    //̸// ESSE3 ////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<Value> programs(final Year year) {
        return Xtream.of(0)

                .crawl(start -> Stream.of(start)

                        .flatMap(new Fill<>()
                                .model(ESSE3_URL+"?aaOffId={year}&start={start}&limit={limit}")
                                .value("year", year)
                                .value("start", start)
                                .value("limit", ESSE3_PAGE_SIZE)
                        )

                        .flatMap(optional(new GET<>(new JSON())))

                        .map(json -> {

                            final List<Value> list=json.values().toList();

                            return entry(
                                    list.size() < ESSE3_PAGE_SIZE ? Stream.empty() : Stream.of(start+ESSE3_PAGE_SIZE),
                                    list.stream()
                            );

                        })
                );
    }

    private Optional<ProgramFrame> program(final Value json) {
        return json.get("cdsCod").string().flatMap(code -> review(new ProgramFrame()

                // !!! "logisticaExistsFlg": 1,
                // !!! "offertaExistsFlg": 1,
                // !!! "statoAttCod": { "value": "A" },

                .id(PROGRAMS.id().resolve(uuid(PAVIA, code)))
                .university(PAVIA)

                .identifier(code)

                .name(map(name(json)))

                .educationalLevel(json.get("tipoCorsoCod").string().map(CODE_TO_LEVEL::get).orElse(null))

                .provider(provider(json).orElse(null))
        ));
    }


    private Stream<Entry<Locale, String>> name(final Value json) {
        return json.get("cdsDes").string()
                .map(v -> entry(PAVIA.locale(), v))
                .stream();
    }

    private Optional<OrganizationFrame> provider(final Value json) {
        return json.get("dipCod").string()
                .filter(not("NN"::equals))
                .map(dipCode -> new OrganizationFrame()
                        .id(ORGANIZATIONS.id().resolve(uuid(PAVIA, "Dipartimento/%s".formatted(dipCode))))
                        .university(PAVIA)
                        .identifier(dipCode)
                        .prefLabel(map(json.get("dipDes").string()
                                .map(v -> entry(PAVIA.locale(), v))
                                .stream()
                        ))
                );
    }


    //̸// UGov /////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Stream<CourseFrame> courses(final Value json) {

        final String url=vault.get(API_URL);
        final String usr=vault.get(API_USR);
        final String pwd=service(vault()).get(API_PWD);

        return json.get("aaOffId").integral().stream()

                .flatMap(aaOffId -> json.get("cdsCod").string().stream()
                        .flatMap(cdsCod -> Xtream.of(0)

                                .flatMap(new Fill<>()
                                        .model(url)
                                )

                                .optMap(new Query(request -> request

                                        .method(POST)

                                        .header("Accept", XML.MIME)
                                        .header("Authorization", basic(usr, pwd))

                                        .body(new XML(), request(cdsCod, Year.of(aaOffId.intValue())))

                                ))

                                .optMap(new Fetch())
                                .optMap(new Parse<>(new XML()))

                                .map(XPath::new)
                                .optMap(path -> path.path("//soap:Body/*"))

                        )
                )

                .flatMap(response -> response.paths("//ns2:cds").flatMap(cds -> {

                    final String program=cds.string("ns2:cdsCod").orElseThrow(() ->
                            new IllegalArgumentException("missing cdsCod")
                    );

                    return cds.paths("ns2:regdid/ns2:pds/ns2:af")
                            .map(af -> async(() -> course(af, program)));

                }))

                .collect(joining())
                .flatMap(Optional::stream);

    }


    private Document request(final String code, final Year year) {
        try {

            final String soap="http://schemas.xmlsoap.org/soap/envelope/";
            final String ws="http://ws.di.u-gov.cineca.it/";


            final DocumentBuilderFactory factory=DocumentBuilderFactory.newInstance();
            final DocumentBuilder builder=factory.newDocumentBuilder();
            final Document document=builder.newDocument();


            final Element envelope=document.createElementNS(soap, "Envelope");

            document.appendChild(envelope);

            final Element header=document.createElementNS(soap, "Header");

            envelope.appendChild(header);

            final Element body=document.createElementNS(soap, "Body");

            envelope.appendChild(body);

            final Element programmazioneDidattica=document.createElementNS(ws, "ProgrammazioneDidattica");

            body.appendChild(programmazioneDidattica);

            final Element parametriEsportazioneProgrammazioneDidattica=document.createElementNS(null, "parametriEsportazioneProgrammazioneDidattica");

            programmazioneDidattica.appendChild(parametriEsportazioneProgrammazioneDidattica);

            final Element aaOffId=document.createElement("aaOffId");

            aaOffId.setTextContent(year.toString());

            parametriEsportazioneProgrammazioneDidattica.appendChild(aaOffId);

            final Element cdsCod=document.createElement("cdsCod");

            cdsCod.setTextContent(code);

            parametriEsportazioneProgrammazioneDidattica.appendChild(cdsCod);


            return document;

        } catch ( final ParserConfigurationException e ) {

            throw new RuntimeException("unable to create document builder", e);

        }
    }


    private Optional<CourseFrame> course(final XPath af, final String program) {
        return af.strings("ns2:afGenCod")

                .map(course -> new CourseFrame()

                        // !!! <ns2:inRegdidFlg>true</ns2:inRegdidFlg>
                        // !!! <ns2:nonErogabileFlg>false</ns2:nonErogabileFlg>

                        .id(COURSES.id().resolve(uuid(PAVIA, course)))
                        .university(PAVIA)

                        .courseCode(course)

                        .name(map(name(af)))

                        .timeRequired(timeRequired(af).orElse(null))
                        .courseWorkload(courseWorkload(af).orElse(null))

                        .teaches(map(text(af, "CONTENUTI")))
                        .assesses(map(text(af, "OBIETT_FORM")))
                        .coursePrerequisites(map(text(af, "PREREQ")))

                        // !!! <ns2:settCod>M-STO/04</ns2:settCod> to ISCED-F-2013?

                        .about(set(sdgs(af)))

                        .inLanguage(set(inLanguage(af)))
                        .courseMode(courseMode(af).orElse(null))

                        .inProgram(set(new ProgramFrame(true).id(PROGRAMS.id().resolve(uuid(PAVIA, program)))))

                )

                .filter(distinct(CourseFrame::id)) // ;( deduplicate multiple courses w/ same afGenCod
                .findFirst()

                .flatMap(Course::review);
    }


    private Stream<Entry<Locale, String>> name(final XPath af) {
        return Stream.concat(
                af.string("ns2:afGenDesEng").map(v -> entry(EN, v)).stream(),
                af.string("ns2:afGenDes").map(v -> entry(PAVIA.locale(), v)).stream()
        );
    }

    private Optional<Duration> timeRequired(final XPath af) {
        return af.number("ns2:oreFrontAf")
                .filter(v -> v > 0)
                .map(this::duration);
    }

    private Optional<Duration> courseWorkload(final XPath af) {
        return af.number("ns2:oreStuInd")
                .filter(v -> v > 0)
                .map(this::duration);
    }

    private Stream<TopicFrame> sdgs(final XPath af) {
        return af.strings("ns2:testi[1]/ns2:testo[ns2:tipoTestoCod='OB_SVIL_SOS']/ns2:contenuto")
                .flatMap(text -> {

                    final Matcher matcher=Pattern.compile("\\b(\\d+)(?:\\.\\w+)*").matcher(text);
                    final Collection<Integer> matches=new ArrayList<>();

                    while ( matcher.find() ) {
                        matches.add(Integer.valueOf(matcher.group(1)));
                    }

                    return matches.stream()
                            .filter(v -> v >= 1 && v <= 17);

                })
                .map(n -> new TopicFrame(true).id(uri("%s/%s".formatted(SDGS.id(), n))));
    }


    private Xtream<String> inLanguage(final XPath af) {
        return af.strings("ns2:linDid/ns2:linDidAf/ns2:linDidDes")
                .flatMap(optional(Locales::fuzzy))
                .map(Locale::getLanguage);
    }

    private Optional<EventAttendanceModeEnumeration> courseMode(final XPath af) {
        return af.string("ns2:modDid/ns2:modDidAf/ns2:modDidDes")
                .map(v -> {

                    final EventAttendanceModeEnumeration mode=DID_TO_MODE.get(v);

                    if ( mode == null ) {
                        logger.warning(this, format("unknown modDod <%s>", v));
                    }

                    return mode;

                });
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Stream<Entry<Locale, String>> text(final XPath af, final String entry) {

        // ;( multiple nsw:testi section are possible, eg for course partitions (<ns2:partStuCod>M-Z</ns2:partStuCod>)

        return af.paths("ns2:testi[1]/ns2:testo[ns2:tipoTestoCod='%s']".formatted(entry))
                .flatMap(testo -> testo.strings("ns2:contenuto")
                        .flatMap(v -> testo.strings("ns2:linguaCod")
                                .flatMap(optional(Locales::fuzzy))
                                .map(l -> entry(l, v))
                        )
                );
    }

    private Duration duration(final double value) {

        final int hours=Double.valueOf(value).intValue();
        final int minutes=Double.valueOf(value%1*60).intValue();

        return minutes == 0
                ? Duration.ofHours(hours)
                : Duration.ofHours(hours).plus(Duration.ofMinutes(minutes));
    }

}
