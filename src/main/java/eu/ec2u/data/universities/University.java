/*
 * Copyright © 2020-2023 EC2U Alliance
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


import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.handlers.Worker;
import com.metreeca.jsonld.handlers.Relator;
import com.metreeca.link.jsonld.Type;
import com.metreeca.link.shacl.Required;

import eu.ec2u.data.resources.Resource;
import lombok.Getter;
import lombok.Setter;

import java.net.URI;

import static com.metreeca.link.Frame.with;
import static com.metreeca.link.Local.local;

@Type
@Getter
@Setter
public final class University extends Resource {

    @Required
    private String schac;

    @Required
    private URI image;

    // link(RDFS.SEEALSO,
    //
    //         field(country, optional(),
    //                 field(RDFS.LABEL, Resources.multilingual())
    //         ),
    //
    //         field(inception, optional(), datatype(XSD.DATETIME)),
    //         field(students, optional(), datatype(XSD.DECIMAL)),
    //
    //         detail(
    //
    //                 field(location, optional(),
    //                         field(RDFS.LABEL, Resources.multilingual())
    //                 ),
    //
    //                 field(WGS84.LAT, optional(), datatype(XSD.DECIMAL)),
    //                 field(WGS84.LONG, optional(), datatype(XSD.DECIMAL))
    //         )
    //
    // ),

    // field(DCTERMS.EXTENT, multiple(),
    //
    //         field("dataset", inverse(VOID.SUBSET), required(), Reference()),
    //         field(VOID.ENTITIES, required(), datatype(XSD.INTEGER))
    //
    // )


    public static final class Handler extends Delegator {

        public Handler() {
            delegate(new Worker()

                    .get(new Relator(with(new University(), university -> {

                        university.setId("");
                        university.setLabel(local("*", ""));

                    })))


            );
        }

    }
}
