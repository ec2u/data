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

package eu.ec2u.data.offerings;

import com.metreeca.flow.http.handlers.Delegator;
import com.metreeca.flow.http.handlers.Router;
import com.metreeca.flow.http.handlers.Worker;
import com.metreeca.flow.json.handlers.Driver;
import com.metreeca.mesh.meta.jsonld.Frame;

import eu.ec2u.data.datasets.Dataset;
import eu.ec2u.data.resources.Resource;

import java.util.Set;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.shim.Collections.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.*;
import static eu.ec2u.data.resources.Localized.EN;

@Frame
public interface Offerings extends Dataset {

    OfferingsFrame OFFERINGS=new OfferingsFrame()
            .id(DATA.resolve("offerings/"))
            .isDefinedBy(DATA.resolve("datasets/offerings"))
            .title(map(entry(EN, "EC2U Educational Offerings")))
            .alternative(map(entry(EN, "EC2U Offerings")))
            .description(map(entry(EN, """
                    Academic, vocational and personal development opportunities offered by EC2U partner universities.
                    """
            )))
            .publisher(EC2U)
            .rights(COPYRIGHT)
            .license(set(CCBYNCND40));


    static void main(final String... args) {
        exec(() -> service(store()).insert(OFFERINGS));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    Set<Resource> members();


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    final class Handler extends Delegator {

        public Handler() {
            delegate(new Router()

                    .path("/", new Worker().get(new Driver(new OfferingsFrame(true)

                            // !!! .members(stash(query(new OfferingFrame(true))))

                    )))

            );
        }

    }

}
