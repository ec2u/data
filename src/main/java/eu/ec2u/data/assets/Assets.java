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

package eu.ec2u.data.assets;

import com.metreeca.flow.Handler;
import com.metreeca.flow.handlers.Delegator;
import com.metreeca.flow.handlers.Worker;

import eu.ec2u.work._junk.Driver;
import eu.ec2u.work._junk.Filter;
import eu.ec2u.work._junk.Relator;
import eu.ec2u.work._junk.Shape;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDFS;

import static com.metreeca.flow.rdf.Values.iri;
import static com.metreeca.flow.rdf.Values.literal;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.*;
import static eu.ec2u.data.datasets.Datasets.Dataset;
import static eu.ec2u.data.organizations.Organizations.Organization;
import static eu.ec2u.data.resources.Resources.Resource;
import static eu.ec2u.data.resources.Resources.locales;
import static eu.ec2u.work._junk.Frame.field;
import static eu.ec2u.work._junk.Frame.frame;
import static eu.ec2u.work._junk.Shape.*;
import static org.eclipse.rdf4j.model.vocabulary.XSD.ID;

public final class Assets extends Delegator {

    private static final IRI Context=item("/assets/");


    private static final IRI Asset=term("Asset");


    public static Shape Assets() {
        return Dataset(Asset());
    }

    public static Shape Asset() {
        return shape(Asset, Resource(),

                property(DCTERMS.TITLE, required(text(locales()))),
                property(DCTERMS.ALTERNATIVE, optional(text(locales()))),
                property(DCTERMS.DESCRIPTION, optional(text(locales()))),

                property(DCTERMS.CREATED, optional(date())),
                property(DCTERMS.ISSUED, optional(date())),
                property(DCTERMS.MODIFIED, optional(date())),

                property(DCTERMS.RIGHTS, optional(string())),
                property(DCTERMS.ACCESS_RIGHTS, optional(text(locales()))),
                property(DCTERMS.LICENSE, multiple(Resource())),

                property(DCTERMS.SOURCE, optional(Resource())),
                property(DCTERMS.PUBLISHER, optional(Organization())),

                property(DCTERMS.EXTENT, optional(integer()))

        );
    }


    public static void main(final String... args) {
        exec(() -> create(Context, Assets.class, Asset()));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public Assets() {
        delegate(handler(new Driver(Assets()), new Worker()

                .get(new Relator(frame(

                        field(ID, iri()),
                        field(RDFS.LABEL, literal("Assets", "en")),

                        field(RDFS.MEMBER, Filter.query(

                                frame(
                                        field(ID, iri()),
                                        field(RDFS.LABEL, literal("", ANY_LOCALE))
                                )

                        ))

                )))

        ));
    }

    private Handler handler(Driver driver, Worker worker) {
        return null;
    }

}