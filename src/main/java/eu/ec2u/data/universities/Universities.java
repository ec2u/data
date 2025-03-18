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

import com.metreeca.flow.Handler;
import com.metreeca.flow.handlers.Delegator;
import com.metreeca.flow.handlers.Router;
import com.metreeca.flow.handlers.Worker;

import eu.ec2u.work._junk.Driver;
import eu.ec2u.work._junk.Filter;
import eu.ec2u.work._junk.Relator;
import eu.ec2u.work._junk.Shape;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.FOAF;
import org.eclipse.rdf4j.model.vocabulary.ORG;
import org.eclipse.rdf4j.model.vocabulary.RDFS;
import org.eclipse.rdf4j.model.vocabulary.WGS84;

import static com.metreeca.flow.rdf.Values.iri;
import static com.metreeca.flow.rdf.Values.literal;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.*;
import static eu.ec2u.data.datasets.Datasets.Dataset;
import static eu.ec2u.data.organizations.Organizations.FormalOrganization;
import static eu.ec2u.data.resources.Resources.Resource;
import static eu.ec2u.work._junk.Frame.field;
import static eu.ec2u.work._junk.Frame.frame;
import static eu.ec2u.work._junk.Shape.*;
import static org.eclipse.rdf4j.model.vocabulary.XSD.ID;


public final class Universities extends Delegator {

    public static final IRI Context=item("/universities/");

    public static final IRI University=term("University");

    private static final IRI inception=term("inception");
    private static final IRI students=term("students");
    private static final IRI country=term("country");
    private static final IRI city=term("city");


    public static Shape Universities() {
        return Dataset(University());
    }

    public static Shape University() {
        return shape(University, FormalOrganization(),

                property(FOAF.DEPICTION, required()),
                property(FOAF.HOMEPAGE, repeatable()),

                property(inception, required(year())),
                property(students, required(integer())),
                property(country, required(Resource())),
                property(city, required(Resource())),

                property(WGS84.LAT, required(decimal())),
                property(WGS84.LONG, required(decimal())),

                property(ORG.SUB_ORGANIZATION_OF, hasValue((iri("https://ec2u.eu/"))))

        );
    }


    public static void main(final String... args) {
        exec(
                () -> new Universities_().run(),
                () -> create(Context, Universities.class, University())
        );
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public Universities() {
        delegate(new Router()

                .path("/", handler(new Driver(Universities()), new Worker()

                        .get(new Relator(frame(

                                field(ID, iri()),
                                field(RDFS.LABEL, literal("", ANY_LOCALE)),

                                field(RDFS.MEMBER, Filter.query(

                                        frame(
                                                field(ID, iri()),
                                                field(RDFS.LABEL, literal("", ANY_LOCALE))
                                        )

                                ))

                        )))

                ))

                .path("/{code}", handler(new Driver(University()), new Worker()

                        .get(new Relator(frame(

                                field(ID, iri()),
                                field(RDFS.LABEL, literal("", ANY_LOCALE))

                        )))

                ))
        );

    }

    private Handler handler(Driver driver, Worker worker) {
        return null;
    }

}