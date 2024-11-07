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

package eu.ec2u.data.offerings;

import com.metreeca.http.actions.*;
import com.metreeca.http.json.JSONPath;
import com.metreeca.http.json.formats.JSON;
import com.metreeca.http.rdf4j.actions.Upload;
import com.metreeca.http.services.Logger;
import com.metreeca.http.services.Vault;
import com.metreeca.http.work.Xtream;
import com.metreeca.http.xml.XPath;
import com.metreeca.http.xml.formats.XML;
import com.metreeca.link.Frame;

import eu.ec2u.data.concepts.ISCED2011;
import eu.ec2u.data.concepts.SDGs;
import eu.ec2u.data.courses.Courses;
import eu.ec2u.data.events.Events.EventAttendanceModeEnumeration;
import eu.ec2u.data.organizations.Organizations;
import eu.ec2u.data.programs.Programs;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.things.Schema;
import eu.ec2u.data.universities.University;
import eu.ec2u.work.feeds.Parsers;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.vocabulary.ORG;
import org.eclipse.rdf4j.model.vocabulary.SKOS;
import org.eclipse.rdf4j.model.vocabulary.XSD;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.Month;
import java.time.Year;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static com.metreeca.http.Locator.service;
import static com.metreeca.http.Request.POST;
import static com.metreeca.http.Request.basic;
import static com.metreeca.http.services.Logger.logger;
import static com.metreeca.http.services.Vault.vault;
import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.EC2U.update;
import static eu.ec2u.data.events.Events.EventAttendanceModeEnumeration.*;
import static eu.ec2u.data.universities.University.Pavia;
import static java.lang.String.format;
import static java.util.Map.entry;
import static java.util.function.Function.identity;
import static java.util.function.Predicate.not;

public final class OfferingsPavia implements Runnable {

    private static final IRI Context=iri(Offerings.Context, "/pavia");

    private static final String ESSE3Url="https://studentionline.unipv.it/e3rest/api/offerta-service-v1/offerte/";

    private static final String APIUrl="offerings-pavia-url";
    private static final String APIUsr="offerings-pavia-usr";
    private static final String APIPwd="offerings-pavia-pwd";


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static final int Limit=100;

    // https://ec2u.atlassian.net/wiki/spaces/infrastructure/pages/345407519/Knowledge+Hub+-+Offerings+-+Degree+Programs#Pavia

    private static final Map<String, IRI> CodeToLevel=Map.ofEntries(

            entry("L2", ISCED2011.Level6), // Corso di Laurea

            entry("LC5", ISCED2011.Level7), // Laurea Ciclo Unico 5 anni
            entry("LC6", ISCED2011.Level7), // Laurea Ciclo Unico 6 anni
            entry("LM", ISCED2011.Level7), // Corso di Laurea Magistrale
            entry("LM5", ISCED2011.Level7), // Laurea Magistrale Ciclo Unico 5 anni
            entry("LM6", ISCED2011.Level7), // Laurea Magistrale Ciclo Unico 6 anni
            entry("M1", ISCED2011.Level7), // Master di Primo Livello
            entry("M2", ISCED2011.Level7), // Master di Secondo Livello
            entry("CPA", ISCED2011.Level7), // Corso di Perfezionamento

            entry("D1", ISCED2011.Level8), // Corso di Dottorato di ricerca
            entry("SP2", ISCED2011.Level8), // Scuola di Specializzazione (2 anni)
            entry("SP3", ISCED2011.Level8), // Scuola di Specializzazione (3 anni)
            entry("SP4", ISCED2011.Level8), // Scuola di Specializzazione (4 anni)
            entry("SP5", ISCED2011.Level8), // Scuola di Specializzazione (5 anni)
            entry("SP6", ISCED2011.Level8), // Scuola di Specializzazione (6 anni)

            entry("FI", ISCED2011.Level9), // Formazione iniziale insegnanti
            entry("PAS", ISCED2011.Level9), // Percorso Abilitante Speciale
            entry("CS", ISCED2011.Level9) // Corso Singolo

    );

    private static final Map<String, EventAttendanceModeEnumeration> DidToMode=Map.ofEntries(
            entry("Convenzionale", OfflineEventAttendanceMode),
            entry("Teledidattica", OnlineEventAttendanceMode),
            entry("Blend/modalità mista", MixedEventAttendanceMode)
    );


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static void main(final String... args) {
        exec(() -> new OfferingsPavia().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Vault vault=service(vault());
    private final Logger logger=service(logger());


    @Override public void run() {
        update(connection -> Xtream.of(Instant.now())

                .map(now -> LocalDate.ofInstant(now, Pavia.zone))

                .map(date -> date.getMonth().compareTo(Month.JULY) >= 0
                        ? Year.from(date)
                        : Year.from(date).minusYears(1)
                )

                .flatMap(this::programs)

                .flatMap(program -> Stream.of(

                        program(program).stream(),
                        details(program).flatMap(this::courses)

                ))

                .flatMap(identity())

                // ;( deduplicate multiple courses w/ same afGenCod, retaining program to course links

                .distinct(frame -> frame.id()
                        .filter(iri -> frame.value(reverse(Programs.hasCourse)).isEmpty())
                        .orElseGet(Frame::iri)
                )

                .flatMap(Frame::stream)
                .batch(0)

                .forEach(new Upload()
                        .contexts(Context)
                        .clear(true)
                )

        );
    }


    //// ESSE3 /////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<JSONPath> programs(final Year year) {
        return Xtream.of(0)

                .scan(start -> Xtream.of(start)

                        .flatMap(new Fill<>()
                                .model(ESSE3Url+"?aaOffId={year}&start={start}&limit={limit}")
                                .value("year", year)
                                .value("start", start)
                                .value("limit", Limit)
                        )

                        .optMap(new GET<>(new JSON()))

                        .map(JSONPath::new)
                        .map(json -> {

                            final List<JSONPath> list=json.paths("*").toList();

                            return entry(
                                    list.size() < Limit ? Stream.empty() : Stream.of(start+Limit),
                                    list.stream()
                            );

                        })
                );
    }

    private Optional<Frame> program(final JSONPath program) {
        return program.string("cdsCod").map(code -> frame(

                // !!! "logisticaExistsFlg": 1,
                // !!! "offertaExistsFlg": 1,
                // !!! "statoAttCod": { "value": "A" },

                field(ID, item(Programs.Context, Pavia, code)),
                field(TYPE, Programs.EducationalOccupationalProgram),

                field(Resources.university, Pavia.id),

                field(Schema.identifier, literal(code)),
                field(Schema.name, program.string("cdsDes").map(v -> literal(v, Pavia.language))),

                field(Offerings.educationalLevel, program.string("tipoCorsoCod").map(CodeToLevel::get)),

                field(Offerings.provider, program.string("dipCod")
                        .filter(not("NN"::equals))
                        .map(dipCode -> frame(

                                field(ID, item(Organizations.Context, Pavia, "Dipartimento/%s".formatted(dipCode))),
                                field(TYPE, ORG.ORGANIZATIONAL_UNIT),

                                field(Resources.university, Pavia.id),

                                field(ORG.IDENTIFIER, literal(dipCode)),
                                field(SKOS.PREF_LABEL, program.string("dipDes").map(v -> literal(v, Pavia.language))),

                                field(ORG.UNIT_OF, University.Pavia.id)

                        )))

        ));
    }


    //// UGov //////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<XPath> details(final JSONPath program) {

        final String url=vault.get(APIUrl);
        final String usr=vault.get(APIUsr);
        final String pwd=service(vault()).get(APIPwd);

        return program.integers("aaOffId")
                .flatMap(aaOffId -> program.strings("cdsCod")
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
                );
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

    private Xtream<Frame> courses(final XPath response) {

        return response.paths("//ns2:cds").flatMap(cds -> {

            final String program=cds.string("ns2:cdsCod").orElseThrow(() ->
                    new IllegalArgumentException("missing cdsCod")
            );

            final String year=cds.string("ns2:aaOffId").orElseThrow(() ->
                    new IllegalArgumentException("missing aaOffId")
            );

            return cds.paths("ns2:regdid[ns2:aaRegdidId='%s']/ns2:pds/ns2:af".formatted(year))
                    .flatMap(af -> af.strings("ns2:afGenCod").flatMap(course -> Stream.of(

                            frame(
                                    field(ID, item(Courses.Context, Pavia, course)),
                                    field(reverse(Programs.hasCourse), item(Programs.Context, Pavia, program))
                            ),

                            frame(

                                    // !!! <ns2:inRegdidFlg>true</ns2:inRegdidFlg>
                                    // !!! <ns2:nonErogabileFlg>false</ns2:nonErogabileFlg>

                                    field(ID, item(Courses.Context, Pavia, course)),
                                    field(TYPE, Courses.Course),

                                    field(Resources.university, Pavia.id),

                                    field(Courses.courseCode, literal(course)),

                                    field(Schema.name, af.string("ns2:afGenDes").map(v -> literal(v, Pavia.language))),
                                    field(Schema.name, af.string("ns2:afGenDesEng").map(v -> literal(v, "en"))),

                                    // !!! <ns2:settCod>M-STO/04</ns2:settCod> to EuroSciVoc?

                                    field(Courses.timeRequired, af.number("ns2:oreFrontAf")
                                            .filter(v -> v > 0)
                                            .map(OfferingsPavia::duration)
                                    ),

                                    field(Courses.courseWorkload, af.number("ns2:oreStuInd")
                                            .filter(v -> v > 0)
                                            .map(OfferingsPavia::duration)
                                    ),

                                    field(Offerings.teaches, text(af, "CONTENUTI")),
                                    field(Offerings.assesses, text(af, "OBIETT_FORM")),
                                    field(Courses.coursePrerequisites, text(af, "PREREQ")),

                                    field(Schema.about, af.strings("ns2:testi[1]/ns2:testo[ns2:tipoTestoCod='OB_SVIL_SOS']/ns2:contenuto")
                                            .flatMap(text -> {

                                                final Matcher matcher=Pattern.compile("\\b(\\d+)(?:\\.\\w+)*").matcher(text);
                                                final Collection<Integer> matches=new ArrayList<>();

                                                while ( matcher.find() ) {
                                                    matches.add(Integer.valueOf(matcher.group(1)));
                                                }

                                                return matches.stream()
                                                        .filter(v -> v >= 1 && v <= 17);

                                            })
                                            .map(SDGs::goal)
                                    ),

                                    field(Schema.inLanguage, af.strings("ns2:linDid/ns2:linDidAf/ns2:linDidDes")
                                            .flatMap(Parsers::languages)
                                            .map(Frame::literal)
                                    ),

                                    field(Courses.courseMode, af.string("ns2:modDid/ns2:modDidAf/ns2:modDidDes")
                                            .map(v -> {

                                                final EventAttendanceModeEnumeration mode=DidToMode.get(v);

                                                if ( mode == null ) {
                                                    logger.warning(this, format("unknown modDod <%s>", v));
                                                }

                                                return mode;

                                            })
                                    )

                            )

                    )));

        });

    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static Xtream<Literal> text(final XPath af, final String entry) {

        // ;( multiple nsw:testi section are possible, eg for course partitions (<ns2:partStuCod>M-Z</ns2:partStuCod>)

        return af.paths("ns2:testi[1]/ns2:testo[ns2:tipoTestoCod='%s']".formatted(entry))
                .flatMap(testo -> testo.strings("ns2:contenuto")
                        .flatMap(v -> testo.strings("ns2:linguaCod")
                                .flatMap(Parsers::languages)
                                .map(l -> literal(v, l))
                        )
                );
    }

    private static Literal duration(final double value) {

        final int hours=Double.valueOf(value).intValue();
        final int minutes=Double.valueOf(value%1*60).intValue();

        return literal(
                minutes == 0 ? format("PT%dH", hours) : format("PT%dH%dM", hours, minutes),
                XSD.DURATION
        );
    }

}
