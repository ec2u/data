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

import com.metreeca.http.actions.Fetch;
import com.metreeca.http.actions.Fill;
import com.metreeca.http.actions.Parse;
import com.metreeca.http.actions.Query;
import com.metreeca.http.services.Vault;
import com.metreeca.http.work.Xtream;
import com.metreeca.http.xml.XPath;
import com.metreeca.http.xml.formats.XML;

import org.eclipse.rdf4j.model.IRI;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerConfigurationException;
import javax.xml.transform.TransformerFactory;
import java.time.Instant;
import java.time.LocalDate;
import java.time.Month;
import java.time.Year;

import static com.metreeca.http.Locator.service;
import static com.metreeca.http.Request.POST;
import static com.metreeca.http.Request.basic;
import static com.metreeca.http.services.Vault.vault;
import static com.metreeca.link.Frame.iri;

import static eu.ec2u.data.Data.exec;
import static java.lang.String.format;

public final class OfferingsPaviaUGov implements Runnable {

    private static final IRI Context=iri(Offerings.Context, "/pavia/ugov");

    private static final String APIUrl="offerings-pavia-url";
    private static final String APIUsr="offerings-pavia-usr";
    private static final String APIPwd="offerings-pavia-pwd";


    public static void main(final String... args) {
        exec(() -> new OfferingsPaviaUGov().run());
    }


    private static Transformer transformer() {
        try {

            return TransformerFactory.newInstance().newTransformer();

        } catch ( final TransformerConfigurationException e ) {

            throw new RuntimeException("unable to create transformer", e);

        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Vault vault=service(vault());


    @Override public void run() {

        Xtream.of(Instant.EPOCH)

                .flatMap(instant -> work(instant))

                .forEach(xpath -> {

                    System.out.println(xpath.string("//ns2:tipoCorsoDes"));


                    // try {
                    //     final Document document=xpath.document();
                    //
                    //     final TransformerFactory transformerFactory=TransformerFactory.newInstance();
                    //     final Transformer transformer=transformerFactory.newTransformer();
                    //
                    //     transformer.setOutputProperty(OutputKeys.INDENT, "yes");
                    //     transformer.setOutputProperty("{http://xml.apache.org/xslt}indent-amount", "2");
                    //
                    //     final DOMSource source=new DOMSource(document);
                    //     final StreamResult result=new StreamResult(System.out);
                    //
                    //     transformer.transform(source, result);
                    //
                    // } catch ( final TransformerException e ) {
                    //
                    //     System.out.println(e);
                    // }

                });

        // update(connection -> Xtream.of(Instant.EPOCH)
        //
        //         .flatMap(instant -> Stream.of(
        //                 work(instant)
        //         ))
        //
        //         .flatMap(Collection::stream)
        //         .flatMap(Frame::stream)
        //         .batch(0)
        //
        //         .forEach(new Upload()
        //                 .contexts(Context)
        //                 .clear(true)
        //         )
        //
        // );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<XPath> work(final Instant updated) {

        final String url=vault
                .get(APIUrl)
                .orElseThrow(() -> new IllegalStateException(format(
                        "undefined API URL <%s>", APIUrl
                )));

        final String usr=vault
                .get(APIUsr)
                .orElseThrow(() -> new IllegalStateException(format(
                        "undefined API user <%s>", APIUsr
                )));

        final String pwd=service(vault())
                .get(APIPwd)
                .orElseThrow(() -> new IllegalStateException(format(
                        "undefined API password <%s>", APIPwd
                )));


        final Year year=LocalDate.now().getMonth().compareTo(Month.JULY) >= 0
                ? Year.now()
                : Year.now().minusYears(1);


        return Xtream.of(updated)

                .flatMap(new Fill<>()
                        .model(url)
                )

                .optMap(new Query(request -> request

                        .method(POST)

                        .header("Accept", XML.MIME)
                        .header("Authorization", basic(usr, pwd))

                        .body(new XML(), payload(year))

                ))

                .optMap(new Fetch())
                .optMap(new Parse<>(new XML()))

                .map(XPath::new)
                .optMap(path -> path.path("//soap:Body/*"));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Document payload(final Year year) {
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

            cdsCod.setTextContent("32400");

            parametriEsportazioneProgrammazioneDidattica.appendChild(cdsCod);


            return document;

        } catch ( final ParserConfigurationException e ) {

            throw new RuntimeException("unable to create document builder", e);

        }
    }

}
