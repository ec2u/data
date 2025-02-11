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

package eu.ec2u.data.datasets.courses;

import com.metreeca.flow.http.handlers.Delegator;
import com.metreeca.flow.http.handlers.Router;
import com.metreeca.flow.http.handlers.Worker;
import com.metreeca.flow.json.handlers.Driver;
import com.metreeca.mesh.meta.jsonld.Frame;

import eu.ec2u.data.Data;
import eu.ec2u.data.datasets.Dataset;
import eu.ec2u.data.datasets.Datasets;
import eu.ec2u.data.datasets.organizations.Organizations;

import java.time.LocalDate;
import java.util.Set;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.shim.Collections.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.Datasets.DATASETS;
import static eu.ec2u.data.datasets.Localized.EN;

@Frame
public interface Courses extends Dataset {

    CoursesFrame COURSES=new CoursesFrame()
            .id(Data.DATA.resolve("courses/"))
            .isDefinedBy(Data.DATA.resolve("datasets/courses"))
            .title(map(entry(EN, "EC2U Academic and Occupational Courses")))
            .alternative(map(entry(EN, "EC2U Courses")))
            .description(map(entry(EN, """
                    Degree, vocational and personal development courses offered by EC2U partner universities.
                    """)))
            .publisher(Organizations.EC2U)
            .rights(Datasets.COPYRIGHT)
            .license(set(Datasets.CCBYNCND40))
            .issued(LocalDate.parse("2022-03-10"));


    static void main(final String... args) {
        exec(() -> service(store()).insert(COURSES));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    default Datasets dataset() {
        return DATASETS;
    }

    @Override
    Set<Course> members();


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    final class Handler extends Delegator {

        public Handler() {
            delegate(new Router()

                    .path("/", new Worker().get(new Driver(new CoursesFrame(true)

                            .members(stash(query(new CourseFrame(true))))

                    )))

                    .path("/{code}", new Worker().get(new Driver(new CourseFrame(true))))
            );
        }

    }

}
