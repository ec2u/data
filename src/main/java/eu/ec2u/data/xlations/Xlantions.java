/*
 * Copyright © 2020-2024 EC2U Alliance
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

package eu.ec2u.data.xlations;

import org.eclipse.rdf4j.model.IRI;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.create;
import static eu.ec2u.data.EC2U.item;

public final class Xlantions {

    public static final IRI Context=item("/xlations/");


    public static void main(final String... args) {
        exec(() -> create(Context, Xlantions.class));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xlantions() { }

}
