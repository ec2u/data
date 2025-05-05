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

package eu.ec2u.data.resources;

import com.metreeca.flow.http.handlers.Delegator;
import com.metreeca.flow.http.handlers.Router;
import com.metreeca.flow.http.handlers.Worker;
import com.metreeca.flow.json.handlers.Driver;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Virtual;

import eu.ec2u.data.datasets.Dataset;

import java.net.URI;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.queries.Criterion.criterion;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.mesh.util.Collections.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.*;
import static eu.ec2u.data.resources.Localized.EN;
import static java.lang.String.format;


@Frame
@Virtual
public interface Resources extends Dataset {

    ResourcesFrame RESOURCES=new ResourcesFrame()
            .id(DATA.resolve("resources/"))
            .isDefinedBy(DATA.resolve("datasets/resources"))
            .title(map(entry(EN, "EC2U Knowledge Hub Resources")))
            .alternative(map(entry(EN, "EC2U Resources")))
            .description(map(entry(EN, "Shared resources published on the EC2U Knowledge Hub.")))
            .publisher(EC2U)
            .rights(COPYRIGHT)
            .license(set(LICENSE));


    static Optional<URI> match(final URI collection, final String query) {

        if ( collection == null ) {
            throw new NullPointerException("null collection");
        }

        if ( query == null ) {
            throw new NullPointerException("null query");
        }

        return match(collection, query, 0).findFirst();
    }

    static Stream<URI> match(final URI collection, final String query, final double threshold) {

        if ( collection == null ) {
            throw new NullPointerException("null collection");
        }

        if ( query == null ) {
            throw new NullPointerException("null query");
        }

        if ( threshold < 0 ) {
            throw new IllegalArgumentException(format("negative threshold <%.3f>", threshold));
        }

        return ResourcesMatcher.match(collection, query, threshold);
    }


    static void main(final String... args) {
        exec(() -> service(store()).curate(RESOURCES));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    Set<Resource> members();


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    final class Handler extends Delegator {

        public Handler() {
            delegate(new Router().path("/", new Worker().get(new Driver(new ResourcesFrame(true)

                    .members(stash(query(new ResourceFrame(true))
                            .where("collection.issued", criterion().any(set()))
                    ))

            ))));
        }

    }

}
