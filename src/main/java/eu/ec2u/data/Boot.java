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

package eu.ec2u.data;

import eu.ec2u.data.datasets.Datasets;
import eu.ec2u.data.datasets.courses.Courses;
import eu.ec2u.data.datasets.documents.Documents;
import eu.ec2u.data.datasets.events.Events;
import eu.ec2u.data.datasets.organizations.Organizations;
import eu.ec2u.data.datasets.persons.Persons;
import eu.ec2u.data.datasets.programs.Programs;
import eu.ec2u.data.datasets.taxonomies.Taxonomies;
import eu.ec2u.data.datasets.units.Units;
import eu.ec2u.data.datasets.universities.Universities;

import static eu.ec2u.data.Data.exec;

public final class Boot implements Runnable {

    public static void main(final String... args) {
        exec(() -> new Boot().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        Datasets.main();
        Taxonomies.main();
        Organizations.main();
        Universities.main();
        Units.main();
        Persons.main();
        Programs.main();
        Courses.main();
        Documents.main();
        Events.main();
    }

}
