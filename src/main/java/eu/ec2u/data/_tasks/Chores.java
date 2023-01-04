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

package eu.ec2u.data._tasks;

import com.metreeca.core.services.Logger;
import com.metreeca.link.Values;
import com.metreeca.rdf4j.services.Graph;

import eu.ec2u.data.ontologies.EC2U;
import eu.ec2u.data.ontologies.Ontologies;
import org.eclipse.rdf4j.model.IRI;

import java.util.Collection;
import java.util.Set;

import static com.metreeca.core.Locator.service;
import static com.metreeca.core.services.Logger.logger;
import static com.metreeca.core.toolkits.Lambdas.task;
import static com.metreeca.rdf4j.services.Graph.graph;

import static eu.ec2u.data._tasks.Tasks.exec;
import static org.eclipse.rdf4j.query.QueryLanguage.SPARQL;

import static java.lang.String.format;
import static java.util.stream.Collectors.joining;


public final class Chores implements Runnable {

    private static Collection<IRI> locked=Set.of(
            Ontologies.ontologies
    );


    public static void main(final String... args) {
        exec(() -> new Chores().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Graph graph=service(graph());
    private final Logger logger=service(logger());


    @Override public void run() {
        collect();
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Collect unreferenced resources.
     */
    private void collect() {

        logger.info(this, "collecting garbage");

        exec(() -> graph.update(task(connection -> {

            for (long size=0, next; (next=connection.size()) != size; size=next) {

                connection

                        .prepareUpdate(SPARQL, format(""

                                        +"prefix void: <http://rdfs.org/ns/void#>\n"
                                        +"prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n"
                                        +"\n"
                                        +"delete { ?garbage ?p ?o } where {\n"
                                        +"\n"
                                        +"\tgraph ?g { ?garbage ?p ?o }\n"
                                        +"\n"
                                        +"\tfilter (?g not in (%s)) # not in locked graph\n"
                                        +"\n"+
                                        "\tfilter not exists { ?s ?q ?garbage } # not referenced\n"
                                        +"\tfilter not exists { ?garbage "
                                        +"a?/rdfs:subClassOf*/^void:rootResource [] } # not a root resource\n"
                                        +"\n"
                                        +"}",

                                locked.stream().map(Values::format).collect(joining(", "))

                        ), EC2U.Base)

                        .execute();

            }

        })));
    }

}
