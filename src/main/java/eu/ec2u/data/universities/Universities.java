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

package eu.ec2u.data.universities;

import com.metreeca.flow.http.handlers.Delegator;
import com.metreeca.flow.http.handlers.Router;
import com.metreeca.flow.http.handlers.Worker;
import com.metreeca.flow.json.handlers.Driver;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Namespace;

import eu.ec2u.data.datasets.Dataset;

import java.time.LocalDate;
import java.util.Set;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.mesh.util.Collections.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.*;
import static eu.ec2u.data.resources.Localized.EN;

@Frame
@Namespace("[ec2u]")
public interface Universities extends Dataset {

    UniversitiesFrame UNIVERSITIES=new UniversitiesFrame()
            .id(DATA.resolve("universities/"))
            .isDefinedBy(DATA.resolve("datasets/universities"))
            .title(map(entry(EN, "EC2U Allied Universities")))
            .alternative(map(entry(EN, "EC2U Universities")))
            .description(map(entry(EN, "Background information about EC2U allied universities.")))
            .publisher(EC2U)
            .rights(COPYRIGHT)
            .license(set(LICENSE))
            .issued(LocalDate.parse("2022-01-01"));


    static void main(final String... args) {
        exec(() -> service(store()).partition(UNIVERSITIES.id()).insert(UNIVERSITIES));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    Set<University> members();


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    final class Handler extends Delegator {

        public Handler() {
            delegate(new Router()

                    .path("/", new Worker().get(new Driver(new UniversitiesFrame(true)
                            .members(stash(query(new UniversityFrame(true))))
                    )))

                    .path("/{code}", new Worker().get(new Driver(new UniversityFrame(true))))

            );
        }

    }

}
