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

package eu.ec2u.data.datasets.documents;

import com.metreeca.flow.services.Vault;
import com.metreeca.mesh.tools.Store;

import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.services.Vault.vault;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.Value.value;
import static com.metreeca.mesh.queries.Criterion.criterion;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.shim.Collections.list;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.universities.University.SALAMANCA;

public final class DocumentsSalamanca implements Runnable {

    private static final String DATA_URL="documents-salamanca-url"; // vault label


    public static void main(final String... args) {
        exec(() -> new DocumentsSalamanca().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Store store=service(store());
    private final Vault vault=service(vault());


    @Override
    public void run() {

        final String url=vault.get(DATA_URL);

        store.modify(
                array(list(Stream.of(url).flatMap(new Documents.Loader(SALAMANCA)))),
                value(query(new DocumentFrame(true)).where("university", criterion().any(SALAMANCA)))
        );
    }

}
