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

import com.metreeca.flow.handlers.Delegator;
import com.metreeca.flow.handlers.Router;
import com.metreeca.flow.handlers.Worker;
import com.metreeca.flow.json.actions.Validate;
import com.metreeca.flow.json.handlers.Driver;
import com.metreeca.flow.work.Xtream;
import com.metreeca.mesh.Value;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Virtual;
import com.metreeca.mesh.queries.Query;

import eu.ec2u.data.concepts.SKOSConceptFrame;
import eu.ec2u.data.concepts.SKOSConceptSchemeFrame;
import eu.ec2u.data.datasets.Dataset;
import eu.ec2u.data.resources.Catalog;

import java.net.URI;
import java.util.Locale;
import java.util.Map;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.tools.Store.Options.FORCE;
import static com.metreeca.mesh.util.Collections.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.DATA;
import static eu.ec2u.data.datasets.Datasets.DATASETS;
import static eu.ec2u.data.resources.Localized.EN;

@Frame
@Virtual
public interface Taxonomies extends Dataset, Catalog<Taxonomy> {

    URI CONCEPTS=DATA.resolve("/concepts/");


    static void main(final String... args) {
        exec(() -> {

            final Value update=array(list(Xtream.of(new TaxonomiesFrame())
                    .optMap(new Validate<>())
            ));

            service(store()).partition(CONCEPTS).update(update, FORCE);

        });
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    default URI id() {
        return CONCEPTS;
    }


    @Override
    default Map<Locale, String> title() {
        return map(entry(EN, "EC2U Classification Taxonomies"));
    }

    @Override
    default Map<Locale, String> alternative() {
        return map(entry(EN, "EC2U Taxonomies"));
    }

    @Override
    default Map<Locale, String> description() {
        return map(entry(EN, "Topic taxonomies and other concept schemes for classifying resources."));
    }

    @Override
    default URI isDefinedBy() {
        return DATASETS.resolve("/concepts");
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    final class Handler extends Delegator {

        public Handler() {
            delegate(new Router()

                    .path("/", new Worker().get(new Driver(new TaxonomiesFrame()
                            .members(stash(Query.query(new TaxonomyFrame())))
                    )))

                    .path("/{scheme}", new Worker().get(new Driver(new SKOSConceptSchemeFrame())))
                    .path("/{scheme}/*", new Worker().get(new Driver(new SKOSConceptFrame())))

            );
        }

    }

}
