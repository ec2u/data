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

import com.metreeca.http.FormatException;
import com.metreeca.http.actions.GET;
import com.metreeca.http.rdf4j.actions.Upload;
import com.metreeca.http.work.Xtream;
import com.metreeca.http.xml.XPath;
import com.metreeca.http.xml.formats.HTML;
import com.metreeca.link.Frame;
import com.metreeca.link._Focus;

import eu.ec2u.data.programs.Programs;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.things.Schema;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.rio.jsonld.JSONLDParser;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.time.Instant;
import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Stream;

import static com.metreeca.http.Locator.service;
import static com.metreeca.http.rdf.formats.RDF.rdf;
import static com.metreeca.http.services.Logger.logger;
import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.EC2U.update;
import static eu.ec2u.data.concepts.ISCED2011.*;
import static eu.ec2u.data.offerings.Offerings.educationalCredentialAwarded;
import static eu.ec2u.data.offerings.Offerings.educationalLevel;
import static eu.ec2u.data.programs.Programs.EducationalOccupationalProgram;
import static eu.ec2u.data.things.Schema.schema;
import static eu.ec2u.data.universities._Universities.Jena;
import static java.nio.charset.StandardCharsets.UTF_8;
import static java.util.Map.entry;

public final class OfferingsJena implements Runnable {

    private static final IRI Context=iri(Offerings.Context, "/jena");

    private static final String SiteURL="https://www.uni-jena.de/en/study-programme";


    private static final IRI SchemaHeadline=schema("headline");
    private static final IRI SchemaAbstract=schema("abstract");


    private final Map<String, IRI> levels=Map.ofEntries(
            entry("Bachelor of Arts", Level6),
            entry("Bachelor of Science", Level6),
            entry("Master of Arts", Level7),
            entry("Master of Education", Level7),
            entry("Master of Science", Level7),
            entry("state examination", Level9),
            entry("Diploma/church board examination", Level9)
    );


    public static void main(final String... args) {
        exec(() -> new OfferingsJena().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        update(connection -> Xtream.of(Instant.EPOCH)

                .flatMap(this::programs)
                .optMap(this::program)

                .flatMap(com.metreeca.link.Frame::stream)
                .batch(0)

                .forEach(new Upload()
                        .contexts(Context)
                        .clear(true)
                )

        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<_Focus> programs(final Instant synced) {
        return Xtream

                .of(SiteURL)

                // extract detail links

                .optMap(new GET<>(new HTML()))

                .peek(document -> System.out.println(document))

                .map(XPath::new)

                .flatMap(xpath -> xpath
                        .links("//li[@data-filter]/a/@href")
                )

                // extract JSON-LD

                .optMap(new GET<>(new HTML()))

                .map(XPath::new).optMap(xpath -> xpath
                        .string("//script[@type='application/ld+json']")
                )

                .flatMap(json -> {

                    try ( final InputStream input=new ByteArrayInputStream(json.getBytes(UTF_8)) ) {

                        final Collection<Statement> model=rdf(input, SiteURL, new JSONLDParser());

                        return _Focus.focus(schema("AboutPage"), model)
                                .shift(reverse(RDF.TYPE))
                                .split();

                    } catch ( final FormatException e ) {

                        service(logger()).warning(this, e.getMessage());

                        return Stream.empty();

                    } catch ( final IOException unexpected ) {

                        throw new UncheckedIOException(unexpected);

                    }

                });

    }

    private Optional<Frame> program(final _Focus focus) {
        return focus.shift(Schema.url).value(asIRI()).map(url -> frame(

                field(ID, item(Programs.Context, Jena, url.stringValue())),

                field(RDF.TYPE, EducationalOccupationalProgram),
                field(Resources.owner, Jena.Id),

                field(Schema.url, url),

                field(Schema.name, focus.shift(SchemaHeadline).value(asString()).map(v -> literal(v, "en"))),
                field(Schema.description, focus.shift(SchemaAbstract).value(asString()).map(v -> literal(v, "en"))),

                field(educationalLevel, focus.shift(educationalLevel).value(asString()).map(levels::get)),

                field(educationalCredentialAwarded,
                        focus.shift(educationalLevel).value(asString()).map(v -> literal(v, "en"))
                )

        ));
    }

}
