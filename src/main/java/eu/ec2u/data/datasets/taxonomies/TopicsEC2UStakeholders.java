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

package eu.ec2u.data.datasets.taxonomies;

import com.metreeca.flow.Xtream;
import com.metreeca.flow.services.Vault;

import eu.ec2u.data.datasets.Datasets;
import eu.ec2u.data.datasets.organizations.Organizations;

import java.time.LocalDate;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.services.Vault.vault;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.Value.value;
import static com.metreeca.mesh.queries.Criterion.criterion;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.shim.Collections.*;
import static com.metreeca.shim.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.Localized.EN;

public final class TopicsEC2UStakeholders implements Runnable {

    private static final String DATA_URL="taxonomies-ec2u-stakeholders"; // vault label


    public static final String PATH=Taxonomies.PATH+"stakeholders/";

    public static final TaxonomyFrame EC2U_STAKEHOLDERS=new TaxonomyFrame()
            .id(uri(PATH))
            .title(map(entry(EN, "EC2U Stakeholder Types")))
            .alternative(map(entry(EN, "EC2U Stakeholders")))
            .description(map(entry(EN, """
                    Standardized terminology for categorizing people and organizations roles within the EC2U Alliance.
                    """)))
            .issued(LocalDate.parse("2025-05-01"))
            .rights(Datasets.COPYRIGHT)
            .publisher(Organizations.EC2U)
            .license(set(Datasets.CCBYNCND40));


    public static void main(final String... args) {
        exec(() -> new TopicsEC2UStakeholders().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Vault vault=service(vault());


    @Override public void run() {
        service(store()).modify(

                array(list(Xtream.from(
                        Stream.of(EC2U_STAKEHOLDERS),
                        Stream.of(vault.get(DATA_URL)).flatMap(new Taxonomies.Loader(EC2U_STAKEHOLDERS))
                ))),

                value(query(new TopicFrame(true)).where("inScheme", criterion().any(EC2U_STAKEHOLDERS)))


        );
    }

}