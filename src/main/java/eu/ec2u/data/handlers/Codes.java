/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.handlers;

import com.metreeca.json.Shape;
import com.metreeca.rest.handlers.Delegator;

import org.eclipse.rdf4j.model.vocabulary.SKOS;

import static com.metreeca.json.Shape.required;
import static com.metreeca.json.shapes.Clazz.clazz;
import static com.metreeca.json.shapes.Field.field;
import static com.metreeca.json.shapes.Guard.*;
import static com.metreeca.json.shapes.Lang.lang;
import static com.metreeca.json.shapes.Localized.localized;
import static com.metreeca.rest.handlers.Router.router;
import static com.metreeca.rest.operators.Relator.relator;
import static com.metreeca.rest.wrappers.Driver.driver;

public final class Codes extends Delegator {

	private static final Shape CodeShape=relate().then(

			filter().then(

					clazz(SKOS.CONCEPT)

			),

			convey().then(

					field(SKOS.PREF_LABEL, required(), localized(), lang("en"))

			)

	);


	public Codes() {
		delegate(driver(

				member().then(CodeShape)

		).wrap(router()

				.path("/", router()
						.get(relator())
				)

		));
	}

}