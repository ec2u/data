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

package eu.ec2u.data.agents;

import com.metreeca.http.rdf4j.actions.Upload;
import com.metreeca.link.Shape;

import eu.ec2u.data.datasets.Datasets;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.FOAF;

import java.util.stream.Stream;

import static com.metreeca.http.rdf.formats.RDF.rdf;
import static com.metreeca.http.toolkits.Resources.resource;
import static com.metreeca.link.Shape.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.Base;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.resources.Resources.Entry;

public final class Agents {

    public static final IRI Context=item("/agents/");


    public static Shape FOAFAgent() {
        return shape(FOAF.AGENT, Entry(),

                property(FOAF.DEPICTION, multiple(id())),
                property(FOAF.HOMEPAGE, multiple(id())),
                property(FOAF.MBOX, multiple(string()))

        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Agents() { }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static void main(final String... args) {
        exec(Agents::create);
    }


    public static void create() {
        Datasets.create(Agents.class, Context);
    }

}
