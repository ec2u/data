/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.work.link;

import com.metreeca.json.Frame;
import com.metreeca.json.Shape;
import com.metreeca.rest.services.Logger;

import java.util.Optional;
import java.util.function.Function;

import static com.metreeca.json.Frame.frame;
import static com.metreeca.rest.Toolbox.service;
import static com.metreeca.rest.formats.JSONLDFormat.validate;
import static com.metreeca.rest.services.Logger.logger;

import static java.lang.String.format;
import static java.util.stream.Collectors.toList;

public final class Validate implements Function<Frame, Optional<Frame>> {

	private final Shape shape;

	private final Logger logger=service(logger());


	public Validate(final Shape shape) {

		if ( shape == null ) {
			throw new NullPointerException("null shape");
		}

		this.shape=shape;
	}


	@Override public Optional<Frame> apply(final Frame frame) {

		return validate(frame.focus(), shape, frame.model().collect(toList())).fold(

				trace -> {

					logger.warning(this, () -> format("%s %s", frame.focus(), trace));

					return Optional.empty();

				},

				model -> Optional.of(frame(frame.focus(), model))

		);
	}

}
