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

package eu.ec2u.data.resources;

import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.handlers.Router;
import com.metreeca.jsonld.handlers.Driver;
import com.metreeca.jsonld.handlers.Relator;

import eu.ec2u.data.ontologies.EC2U;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDF;

import static com.metreeca.http.Handler.handler;
import static com.metreeca.link.shapes.Clazz.clazz;
import static com.metreeca.link.shapes.Field.field;
import static com.metreeca.link.shapes.Guard.filter;

import static eu.ec2u.data.ontologies.EC2U.Reference;


public final class Resources extends Delegator {

    public Resources() {
        delegate(handler(

                new Driver(EC2U.Resource(),

                        filter(clazz(EC2U.Resource)),

                        field(RDF.TYPE, Reference()),
                        field(DCTERMS.SUBJECT, Reference())

                ),

                new Router()
                        .get(new Relator())

        ));
    }

}