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

package eu.ec2u.data.documents;

import com.metreeca.http.rdf4j.actions.Upload;
import com.metreeca.http.services.Vault;
import com.metreeca.http.work.Xtream;

import eu.ec2u.data.documents.Documents._CSVLoader;
import org.eclipse.rdf4j.model.IRI;

import java.util.Set;

import static com.metreeca.http.Locator.service;
import static com.metreeca.http.rdf.Values.iri;
import static com.metreeca.http.services.Vault.vault;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.documents.Documents.Document;
import static eu.ec2u.data.universities._Universities.Salamanca;
import static eu.ec2u.work.validation.Validators.validate;
import static java.lang.String.format;

public final class DocumentsSalamanca implements Runnable {

    private static final IRI Context=iri(Documents.Context, "/salamanca");

    private static final String DataUrl="documents-salamanca-url"; // vault label


    public static void main(final String... args) {
        exec(() -> new DocumentsSalamanca().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Vault vault=service(vault());


    @Override public void run() {

        final String url=vault
                .get(DataUrl)
                .orElseThrow(() -> new IllegalStateException(format(
                        "undefined data URL <%s>", DataUrl
                )));

        Xtream.of(url)

                .flatMap(new _CSVLoader(Salamanca))

                .pipe(documents -> validate(Documents._Document(), Set.of(Document), documents))

                .forEach(new Upload()
                        .contexts(Context)
                        .clear(true)
                );
    }

}
