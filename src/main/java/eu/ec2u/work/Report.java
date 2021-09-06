/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.work;

import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;

import java.io.StringWriter;
import java.util.Collection;
import java.util.function.Consumer;
import java.util.function.Function;

import static com.metreeca.rest.Toolbox.service;
import static com.metreeca.rest.services.Logger.logger;

public final class Report implements Function<Collection<Statement>, String>, Consumer<Collection<Statement>> {

	@Override public String apply(final Collection<Statement> statements) {

		final StringWriter writer=new StringWriter();

		Rio.write(statements, writer, RDFFormat.TURTLE);

		return writer.toString();

	}

	@Override public void accept(final Collection<Statement> statements) {
		service(logger()).info(this, () -> apply(statements));
	}

}
