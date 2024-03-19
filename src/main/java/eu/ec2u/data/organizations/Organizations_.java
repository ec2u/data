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

package eu.ec2u.data.organizations;

import com.metreeca.http.rdf.Frame;

import eu.ec2u.data.things.Schema;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.RDF;

import java.util.Optional;

import static com.metreeca.http.rdf.Frame.frame;
import static com.metreeca.http.rdf.Shift.Seq.seq;
import static com.metreeca.http.rdf.Values.literal;

import static eu.ec2u.data.EC2U.item;

public final class Organizations_ {

    public static Frame organization(final Frame frame, final String lang) {

        final Optional<Value> name=frame.string(Schema.name).map(value -> literal(value, lang));
        final Optional<Value> legalName=frame.string(Schema.legalName).map(value -> literal(value, lang));

        return frame(item(Organizations.Context, frame.skolemize(
                seq(Schema.name),
                seq(Schema.legalName)
        )))

                .value(RDF.TYPE, Schema.Organization)

                .value(Schema.name, name)
                .value(Schema.legalName, legalName)
                .value(Schema.email, frame.value(Schema.email));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Organizations_() { }

}
