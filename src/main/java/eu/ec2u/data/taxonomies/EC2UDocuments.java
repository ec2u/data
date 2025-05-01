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

package eu.ec2u.data.taxonomies;

import com.metreeca.flow.json.actions.Validate;
import com.metreeca.flow.work.Xtream;

import java.net.URI;
import java.time.LocalDate;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.toolkits.Resources.resource;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.tools.Store.Options.FORCE;
import static com.metreeca.mesh.util.Collections.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.COPYRIGHT;
import static eu.ec2u.data.EC2U.EC2U;
import static eu.ec2u.data.resources.Collection.CCBYNCND40;
import static eu.ec2u.data.resources.Localized.EN;

public final class EC2UDocuments implements Runnable {

    public static final URI EC2U_DOCUMENTS=Taxonomies.TAXONOMIES.id().resolve("documents");

    private static final TaxonomyFrame TAXONOMY=new TaxonomyFrame()
            .id(EC2U_DOCUMENTS)
            .title(map(entry(EN, "EC2U Document Types")))
            .alternative(map(entry(EN, "EC2U Documents")))
            .description(map(entry(EN, """
                    Standardized terminology for categorizing institutional documents shared within the EC2U Alliance.
                    """)))
            .issued(LocalDate.parse("2025-05-01"))
            .rights(COPYRIGHT)
            .publisher(EC2U)
            .license(set(CCBYNCND40));


    public static void main(final String... args) {
        exec(() -> new EC2UDocuments().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        service(store()).partition(EC2U_DOCUMENTS).update(array(list(Xtream.from(

                Xtream.of(
                        TAXONOMY
                ).optMap(new Validate<>()),

                Stream.of(resource(EC2UDocuments.class, ".csv").toString())
                        .flatMap(new Taxonomy.Loader(TAXONOMY))

        ))), FORCE);
    }

}