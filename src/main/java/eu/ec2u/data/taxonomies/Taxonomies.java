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

import com.metreeca.flow.http.handlers.Delegator;
import com.metreeca.flow.http.handlers.Router;
import com.metreeca.flow.http.handlers.Worker;
import com.metreeca.flow.json.actions.Validate;
import com.metreeca.flow.json.handlers.Driver;
import com.metreeca.flow.work.Xtream;
import com.metreeca.mesh.Value;
import com.metreeca.mesh.meta.jsonld.Frame;

import eu.ec2u.data.datasets.Dataset;
import eu.ec2u.data.datasets.Datasets;

import java.util.Set;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.mesh.tools.Store.Options.FORCE;
import static com.metreeca.mesh.util.Collections.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.*;
import static eu.ec2u.data.resources.Localized.EN;

@Frame
public interface Taxonomies extends Dataset {

    TaxonomiesFrame TAXONOMIES=new TaxonomiesFrame()
            .id(DATA.resolve("taxonomies/"))
            .isDefinedBy(Datasets.DATASETS.id().resolve("taxonomies"))
            .title(map(entry(EN, "EC2U Classification Taxonomies")))
            .alternative(map(entry(EN, "EC2U Taxonomies")))
            .description(map(entry(EN, "Topic taxonomies and other concept schemes for classifying resources.")))
            .publisher(EC2U)
            .rights(COPYRIGHT)
            .license(set(CCBYNCND40));


    static void main(final String... args) {
        exec(() -> {

            final Value update=array(list(Xtream.of(TAXONOMIES)
                    .optMap(new Validate<>())
            ));

            service(store()).partition(TAXONOMIES.id()).update(update, FORCE);

        });
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    Set<Taxonomy> members();


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    final class Handler extends Delegator {

        public Handler() {
            delegate(new Router()

                    .path("/", new Worker().get(new Driver(TAXONOMIES
                            .members(stash(query(new TaxonomyFrame())))
                    )))

                    .path("/{taxonomy}", new Worker().get(new Driver(new TaxonomyFrame())))
                    .path("/{taxonomy}/*", new Worker().get(new Driver(new TopicFrame())))

            );
        }

    }

}
