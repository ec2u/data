/*
 * Copyright © 2020 Metreeca srl. All rights reserved.
 */

package eu.ec2u.data.tasks;

import com.metreeca.link.Values;
import com.metreeca.rdf4j.actions.Upload;

import eu.ec2u.data.terms.EC2U;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;

import java.io.*;

import static eu.ec2u.data.tasks.Tasks.exec;
import static eu.ec2u.data.tasks.Tasks.ontologies;


public final class Ontologies implements Runnable {

    public static void main(final String... args) {
        exec(() -> new Ontologies().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        ontologies()

                .flatMap(url -> {

                    try ( final InputStream input=url.openStream() ) {

                        return Rio.parse(input, RDFFormat.TURTLE).stream();

                    } catch ( final IOException e ) {

                        throw new UncheckedIOException(e);

                    }

                })

                .filter(statement -> {

                    final String lang=Values.lang(statement.getObject());

                    return lang.isEmpty() || EC2U.Languages.contains(lang);

                })

                .batch(0) // avoid multiple truth-maintenance rounds

                .forEach(new Upload()
                        .clear(true)
                        .contexts(EC2U.ontologies)
                );
    }

}
