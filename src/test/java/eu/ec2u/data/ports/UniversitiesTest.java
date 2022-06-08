/*
 * Copyright © 2020-2022 EC2U Alliance
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

package eu.ec2u.data.ports;

import com.metreeca.jsonld.actions.Validate;
import com.metreeca.link.Shape;

import eu.ec2u.data.terms.EC2U;
import org.eclipse.rdf4j.model.vocabulary.LDP;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

import static com.metreeca.http.Locator.service;
import static com.metreeca.jsonld.services.Engine.engine;
import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.iri;
import static com.metreeca.link.queries.Items.items;
import static com.metreeca.link.shapes.Guard.*;

import static eu.ec2u.data.ports.Universities.University;
import static eu.ec2u.data.tasks.Tasks.exec;
import static org.assertj.core.api.Assertions.assertThat;

final class UniversitiesTest {

    @Disabled @Test void test() {

        exec(() -> {

            final Shape shape=University()
                    .redact(Task, Relate)
                    .redact(View, Digest);


            assertThat(service(engine())

                    .relate(frame(iri(EC2U.Base, "/universities/")), items(shape))

                    .stream()
                    .flatMap(frame -> frame.frames(LDP.CONTAINS))

            ).allSatisfy(frame ->

                    assertThat(new Validate(shape).apply(frame)).isNotEmpty()

            );

        });
    }

}