/*
 * Copyright © 2020 Metreeca srl. All rights reserved.
 */

package eu.ec2u.data.tasks;

import com.metreeca.core.services.Logger;

import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.helpers.AbstractRDFHandler;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.HashMap;
import java.util.Map;

import static com.metreeca.core.Locator.service;
import static com.metreeca.core.services.Logger.logger;
import static com.metreeca.core.toolkits.Lambdas.task;
import static com.metreeca.rdf4j.services.Graph.graph;

import static eu.ec2u.data.tasks.Tasks.exec;
import static eu.ec2u.data.tasks.Tasks.ontologies;

import static java.lang.String.format;
import static java.util.Map.Entry.comparingByKey;


public final class Namespaces implements Runnable {

    public static void main(final String... args) {
        exec(() -> new Namespaces().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Logger logger=service(logger());


    @Override public void run() {
        service(graph()).update(task(connection -> {

            connection.clearNamespaces();

            ontologies()

                    .flatMap(path -> {
                        try {

                            final Map<String, String> namespaces=new HashMap<>();

                            Rio.createParser(RDFFormat.TURTLE).setRDFHandler(new AbstractRDFHandler() {

                                @Override public void handleNamespace(final String prefix, final String uri) {

                                    namespaces.put(prefix, uri);

                                }

                            }).parse(path.openStream());

                            return namespaces.entrySet().stream();

                        } catch ( final IOException e ) {

                            throw new UncheckedIOException(e);

                        }

                    })

                    .filter(entry -> !entry.getKey().isEmpty()) // ignore default namespaces

                    .distinct()
                    .sorted(comparingByKey())

                    .peek(entry -> logger.info(this, format(
                            "%-8s %s", entry.getKey(), entry.getValue()
                    )))

                    .forEach(namespace ->

                            connection.setNamespace(namespace.getKey(), namespace.getValue())

                    );

        }));
    }

}
