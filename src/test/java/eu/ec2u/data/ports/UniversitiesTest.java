/*
 * Copyright © 2022 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.ports;

import com.metreeca.json.Shape;
import com.metreeca.rest.actions.Validate;

import eu.ec2u.data.terms.EC2U;
import org.eclipse.rdf4j.model.vocabulary.LDP;
import org.junit.jupiter.api.Test;

import static com.metreeca.json.Frame.frame;
import static com.metreeca.json.Values.iri;
import static com.metreeca.json.queries.Items.items;
import static com.metreeca.json.shapes.Guard.*;
import static com.metreeca.rest.Toolbox.service;
import static com.metreeca.rest.services.Engine.engine;

import static eu.ec2u.data.ports.Universities.University;
import static eu.ec2u.data.tasks.Tasks.exec;
import static org.assertj.core.api.Assertions.assertThat;

final class UniversitiesTest {

	@Test void test() {

		exec(() -> {

			final Shape shape=University()
					.redact(Task, Relate)
					.redact(View, Digest);


			assertThat(service(engine())

					.relate(frame(iri(EC2U.Base, "/universities/")), items(shape))

					.stream()
					.flatMap(frame -> frame.frames(LDP.CONTAINS))

			).allSatisfy(frame ->

					assertThat(new Validate(shape).apply(frame)).isNotEmpty()

			);

		});
	}

}