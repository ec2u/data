/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.work;

import com.metreeca.rest.Format;
import com.metreeca.rest.actions.*;

import java.util.Optional;
import java.util.function.Function;

public final class GET<T> implements Function<String, Optional<T>> {

	private final Format<T> format;


	public GET(final Format<T> format) {

		if ( format == null ) {
			throw new NullPointerException("null format");
		}

		this.format=format;
	}


	@Override public Optional<T> apply(final String url) {
		return Optional.of(url)

				.flatMap(new Query(request -> request
						.header("Accept", format.mime())
				))

				.flatMap(new Fetch())
				.flatMap(new Parse<>(format));
	}

}
