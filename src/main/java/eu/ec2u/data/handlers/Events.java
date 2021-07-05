/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.handlers;

import com.metreeca.rest.handlers.Delegator;

import eu.ec2u.data.schemas.EC2U;
import eu.ec2u.data.schemas.Schema;
import org.eclipse.rdf4j.model.vocabulary.*;

import static com.metreeca.json.Shape.optional;
import static com.metreeca.json.Shape.required;
import static com.metreeca.json.shapes.Clazz.clazz;
import static com.metreeca.json.shapes.Datatype.datatype;
import static com.metreeca.json.shapes.Field.field;
import static com.metreeca.json.shapes.Guard.*;
import static com.metreeca.json.shapes.Localized.localized;
import static com.metreeca.rest.handlers.Router.router;
import static com.metreeca.rest.operators.Relator.relator;
import static com.metreeca.rest.wrappers.Driver.driver;

public final class Events extends Delegator {

	public Events() {
		delegate(driver(relate(

				filter(clazz(EC2U.Event)),

				field(EC2U.university, required(),
						field(RDFS.LABEL, repeatable(), localized())
				),

				field(DCTERMS.CREATED, optional(), datatype(XSD.DATETIME)),
				field(DCTERMS.MODIFIED, optional(), datatype(XSD.DATETIME)),

				field(Schema.name, repeatable(), localized()),
				field(Schema.description, multiple(), localized()),

				field(Schema.startDate, optional(), datatype(XSD.DATETIME)),
				field(Schema.endDate, optional(), datatype(XSD.DATETIME))

		)).wrap(router()

				.path("/", router()
						.get(relator())
				)

				.path("/{id}", router()
						.get(relator())
				)

		));
	}

}