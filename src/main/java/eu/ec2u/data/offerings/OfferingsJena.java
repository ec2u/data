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
import com.metreeca.http.rdf.Frame;
import com.metreeca.http.rdf4j.actions.Upload;
import com.metreeca.http.services.Vault;
import com.metreeca.http.work.Xtream;
import com.metreeca.http.xml.XPath;
import com.metreeca.http.xml.formats.HTML;

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
import java.util.Set;
import java.util.stream.Stream;

import static com.metreeca.http.Locator.service;
import static com.metreeca.http.rdf.Frame.frame;
import static com.metreeca.http.rdf.Values.*;
import static com.metreeca.http.rdf.formats.RDF.rdf;
import static com.metreeca.http.rdf.schemas.Schema.normalize;
import static com.metreeca.http.services.Logger.logger;
import static com.metreeca.http.services.Vault.vault;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.concepts.ISCED2011.*;
import static eu.ec2u.data.offerings.Offerings.Program;
import static eu.ec2u.data.offerings.Offerings.Programs;
import static eu.ec2u.data.universities._Universities.Jena;
import static eu.ec2u.work.validation.Validators.validate;
import static java.nio.charset.StandardCharsets.UTF_8;
import static java.util.Map.entry;

public final class OfferingsJena implements Runnable {

    private static final IRI Context=iri(Offerings.Context, "/jena");

    private static final String SiteURL="https://www.uni-jena.de/en/study-programme";


    private static final IRI SchemaHeadline=Schema.term("headline");
    private static final IRI SchemaAbstract=Schema.term("abstract");


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

    private final Vault vault=service(vault());


    @Override public void run() {
        Xtream.of(Instant.EPOCH)

                .flatMap(this::programs)
                .optMap(this::program)

                .pipe(programs ->
                        validate(Program(), Set.of(Program), programs)
                )

                .forEach(new Upload()
                        .contexts(Context)
                        .clear(true)
                );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<Frame> programs(final Instant synced) {
        return Xtream

                .of(SiteURL)

                // extract detail links

                .optMap(new GET<>(new HTML()))

                .map(XPath::new).flatMap(xpath -> xpath
                        .links("//li[contains(@class, 'entry_study')]/a/@href")
                )

                // extract JSON-LD

                .optMap(new GET<>(new HTML()))

                .map(XPath::new).optMap(xpath -> xpath
                        .string("//script[@type='application/ld+json']")
                )

                .flatMap(json -> {

                    try ( final InputStream input=new ByteArrayInputStream(json.getBytes(UTF_8)) ) {

                        final Collection<Statement> model=normalize(rdf(input, null, new JSONLDParser()));

                        return frame(Schema.term("AboutPage"), model)
                                .frames(reverse(RDF.TYPE));

                    } catch ( final FormatException e ) {

                        service(logger()).warning(this, e.getMessage());

                        return Stream.empty();

                    } catch ( final IOException unexpected ) {

                        throw new UncheckedIOException(unexpected);

                    }

                });

    }

    private Optional<Frame> program(final Frame frame) {
        return frame.string(Schema.url).map(url -> frame(item(Programs, Jena, url))

                .values(RDF.TYPE, Program)
                .value(Resources.owner, Jena.Id)

                .value(Schema.url, iri(url))

                .value(Schema.name, frame.string(SchemaHeadline).map(v -> literal(v, "en")))
                .value(Schema.description, frame.string(SchemaAbstract).map(v -> literal(v, "en")))

                .value(Schema.educationalLevel, frame.string(Schema.educationalLevel).map(levels::get))

                .value(Schema.educationalCredentialAwarded,
                        frame.string(Schema.educationalLevel).map(v -> literal(v, "en"))
                )

        );
    }

}
