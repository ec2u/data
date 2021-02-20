/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.handlers;

import com.metreeca.json.Shape;
import com.metreeca.rest.handlers.Delegator;

import eu.ec2u.data.schemas.EC2U;
import org.eclipse.rdf4j.model.vocabulary.RDFS;
import org.eclipse.rdf4j.model.vocabulary.XSD;

import static com.metreeca.json.Shape.required;
import static com.metreeca.json.shapes.Clazz.clazz;
import static com.metreeca.json.shapes.Datatype.datatype;
import static com.metreeca.json.shapes.Field.field;
import static com.metreeca.json.shapes.Guard.*;
import static com.metreeca.json.shapes.Or.or;
import static com.metreeca.rest.handlers.Router.router;
import static com.metreeca.rest.operators.Relator.relator;
import static com.metreeca.rest.wrappers.Driver.driver;

public final class Universities extends Delegator {

	private static final Shape UniversitiesShape=or(

			relate()

	).then(

			filter().then(
					clazz(EC2U.University)
			),

			convey().then(

					field(RDFS.LABEL, required(), datatype(XSD.STRING)),

					detail().then(


					)

			)

	);


	public Universities() {
		delegate(driver(

				member().then(UniversitiesShape)

		).wrap(router()

				.path("/", router()
						.get(relator())
				)

				.path("/{id}", router()
						.get(relator())
				)

		));
	}

}