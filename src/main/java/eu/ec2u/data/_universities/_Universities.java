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

package eu.ec2u.data._universities;

import com.metreeca.flow.handlers.Delegator;


public final class _Universities extends Delegator {

    // public static final IRI Context=item("/universities/");
    //
    // public static final IRI University=term("University");
    //
    // private static final IRI inception=term("inception");
    // private static final IRI students=term("students");
    // private static final IRI country=term("country");
    // private static final IRI city=term("city");
    //
    //
    // public static Shape Universities() {
    //     return Dataset(University());
    // }
    //
    // public static Shape University() {
    //     return shape(University, FormalOrganization(),
    //
    //             property(FOAF.DEPICTION, required()),
    //             property(FOAF.HOMEPAGE, repeatable()),
    //
    //             property(inception, required(year())),
    //             property(students, required(integer())),
    //             property(country, required(Resource())),
    //             property(city, required(Resource())),
    //
    //             property(WGS84.LAT, required(decimal())),
    //             property(WGS84.LONG, required(decimal())),
    //
    //             property(ORG.SUB_ORGANIZATION_OF, hasValue((iri("https://ec2u.eu/"))))
    //
    //     );
    // }
    //
    //
    // public static void main(final String... args) {
    //     exec(
    //             () -> new Universities_().run(),
    //             () -> create(Context, _Universities.class, University())
    //     );
    // }
    //
    //
    // //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // public _Universities() {
    //     delegate(new Router()
    //
    //             .path("/", new Worker()
    //                     .get(new Relator(value(bean(Universities.class)
    //                             .setMembers(query()
    //                                     .model(value(bean(University.class)
    //                                             // !!! id model
    //                                             // !!! label model (any language)
    //                                     ))
    //                             )
    //                     )))
    //             )
    //
    //             .path("/{code}", new Worker()
    //                     .get(new Relator(value(bean(University.class)
    //                             // !!! id model
    //                             // !!! label model (any language)
    //                     )))
    //
    //             )
    //     );
    //
    // }

}