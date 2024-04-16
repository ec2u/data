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

import com.metreeca.http.json.JSONPath;
import com.metreeca.http.services.Vault;
import com.metreeca.http.work.Xtream;
import com.metreeca.link.Frame;

import org.eclipse.rdf4j.model.IRI;

import java.time.Instant;
import java.util.Optional;

import static com.metreeca.http.Locator.service;
import static com.metreeca.http.services.Vault.vault;
import static com.metreeca.link.Frame.iri;

import static eu.ec2u.data.Data.exec;
import static java.lang.String.format;

public final class OfferingsTurku implements Runnable {

    private static final IRI Context=iri(Offerings.Context, "/turku");

    private static final String APIUrl="offerings-turku-url";
    private static final String APIKey="offerings-turku-key";


    public static void main(final String... args) {
        exec(() -> new OfferingsTurku().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Vault vault=service(vault());


    @Override public void run() {

        throw new UnsupportedOperationException(";( be implemented"); // !!!

        // update(connection -> Xtream.of(Instant.EPOCH)
        //
        //         .flatMap(this::offerings)
        //         .batch(0)
        //
        //         .flatMap(offers -> Xtream.from(
        //
        //                 Xtream.from(offers)
        //
        //                         .filter(OfferingsTurku::isProgram)
        //                         .optMap(this::program),
        //
        //                 Xtream.from(offers)
        //
        //                         .filter(not(OfferingsTurku::isProgram))
        //                         .optMap(this::course)
        //
        //         ))
        //
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

    private Xtream<JSONPath> offerings(final Instant updated) {

        final String url=vault
                .get(APIUrl)
                .orElseThrow(() -> new IllegalStateException(format(
                        "undefined API URL <%s>", APIUrl
                )));

        final String token=service(vault())
                .get(APIKey)
                .orElseThrow(() -> new IllegalStateException(format(
                        "undefined API key <%s>", APIKey
                )));

        throw new UnsupportedOperationException(";( be implemented"); // !!!
    }


    private Optional<Frame> program(final JSONPath json) {
        throw new UnsupportedOperationException(";( be implemented"); // !!!
    }

    private Optional<Frame> course(final JSONPath json) {
        throw new UnsupportedOperationException(";( be implemented"); // !!!
    }

}
