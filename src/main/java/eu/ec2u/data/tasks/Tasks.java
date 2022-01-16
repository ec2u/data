/*
 * Copyright © 2022 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.tasks;

import com.metreeca.json.Frame;
import com.metreeca.rest.Toolbox;
import com.metreeca.rest.Xtream;

import org.eclipse.rdf4j.model.*;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;

import java.io.*;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

import static com.metreeca.rdf4j.services.Graph.graph;
import static com.metreeca.rest.Toolbox.service;
import static com.metreeca.rest.Xtream.task;

import static eu.ec2u.data.Data.toolbox;

import static java.util.stream.Collectors.toList;

public final class Tasks {

	public static void exec(final Runnable... tasks) {
		toolbox(new Toolbox()).exec(tasks).clear();
	}


	public static void upload(final IRI context, final Collection<Frame> frames) {
		upload(context, Xtream.from(frames));
	}

	public static void upload(final IRI context, final Xtream<Frame> frames) {
		frames.batch(1000).forEach(batch -> {

			final List<Resource> subjects=batch.stream()
					.map(Frame::focus)
					.filter(Resource.class::isInstance)
					.map(Resource.class::cast)
					.collect(toList());

			final List<Statement> statements=batch.stream()
					.flatMap(Frame::model)
					.collect(toList());

			service(graph()).update(task(connection -> {

				subjects.forEach(subject ->
						connection.remove(subject, null, null, context)
				);

				connection.add(statements, context);

			}));
		});
	}


	public static String format(final Frame frame) {
		return format(frame.model().collect(Collectors.toList()));
	}

	public static String format(final Iterable<Statement> model) {
		try ( final StringWriter writer=new StringWriter() ) {

			Rio.write(model, writer, RDFFormat.TURTLE);

			return writer.toString();

		} catch ( final IOException e ) {

			throw new UncheckedIOException(e);

		}
	}


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	private Tasks() { }

}
