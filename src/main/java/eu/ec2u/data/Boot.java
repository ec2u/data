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
import eu.ec2u.data.documents.Documents;
import eu.ec2u.data.events.Events;
import eu.ec2u.data.organizations.Organizations;
import eu.ec2u.data.persons.Persons;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.taxonomies.Taxonomies;
import eu.ec2u.data.units.Units;
import eu.ec2u.data.universities.Universities;

import static eu.ec2u.data.Data.exec;

public final class Boot implements Runnable {

    public static void main(final String... args) {
        exec(() -> new Boot().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        EC2U.main();
        Taxonomies.main();
        Datasets.main();
        Resources.main();
        Universities.main();
        Units.main();
        Organizations.main();
        Persons.main();
        Documents.main();
        Events.main();
    }

}
