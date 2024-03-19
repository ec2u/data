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

package eu.ec2u.data.datasets;

import com.metreeca.http.rdf4j.actions.Update;

import java.util.stream.Stream;

import static com.metreeca.http.toolkits.Resources.resource;
import static com.metreeca.http.toolkits.Resources.text;
import static com.metreeca.link.Frame.iri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.Base;

public final class Datasets_ implements Runnable {

    public static void main(final String... args) {
        exec(() -> new Datasets_().run());
    }


    @Override public void run() {
        Stream

                .of(text(resource(Datasets_.class, ".ul")))

                .forEach(new Update()
                        .base(Base)
                        .insert(iri(Datasets.Context, "/~"))
                        .clear(true)
                );
    }

}
