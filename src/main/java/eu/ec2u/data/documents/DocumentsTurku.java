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

import com.metreeca.http.services.Vault;

import org.eclipse.rdf4j.model.IRI;

import static com.metreeca.http.Locator.service;
import static com.metreeca.http.rdf.Values.iri;
import static com.metreeca.http.services.Vault.vault;

import static eu.ec2u.data.Data.exec;

public final class DocumentsTurku implements Runnable {

    private static final IRI Context=iri(Documents.Context, "/turku");

    private static final String DataUrl="documents-turku-url"; // vault label


    public static void main(final String... args) {
        exec(() -> new DocumentsTurku().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Vault vault=service(vault());


    @Override public void run() {

        // final String url=vault.get(DataUrl).orElseThrow(() -> new IllegalStateException(format(
        //         "undefined data URL <%s>", DataUrl
        // )));
        //
        // Xtream.of(url)
        //
        //         .flatMap(new Documents.CSVLoader(Turku))
        //
        //         // !!! .pipe(documents -> validate(Document(), Set.of(Document), documents))
        //
        //         .forEach(document -> System.out.println(document));

        // .forEach(new Upload()
        //         .contexts(Context)
        //         .clear(true)
        // );
    }

}
