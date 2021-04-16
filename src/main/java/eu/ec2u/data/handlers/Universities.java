/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.handlers;

import com.metreeca.rest.handlers.Delegator;

import eu.ec2u.data.schemas.EC2U;
import org.eclipse.rdf4j.model.vocabulary.*;

import static com.metreeca.json.Shape.optional;
import static com.metreeca.json.Shape.required;
import static com.metreeca.json.shapes.Clazz.clazz;
import static com.metreeca.json.shapes.Datatype.datatype;
import static com.metreeca.json.shapes.Field.field;
import static com.metreeca.json.shapes.Guard.filter;
import static com.metreeca.json.shapes.Guard.relate;
import static com.metreeca.json.shapes.Link.link;
import static com.metreeca.rest.handlers.Router.router;
import static com.metreeca.rest.operators.Relator.relator;
import static com.metreeca.rest.wrappers.Driver.driver;

public final class Universities extends Delegator {

	public Universities() {
		delegate(driver(relate(

				filter(clazz(EC2U.University)),

				field(RDFS.LABEL, required(), datatype(XSD.STRING)),

				field(EC2U.schac, required(), datatype(XSD.STRING)),

				link(OWL.SAMEAS,
						field(WGS84.LAT, optional(), datatype(XSD.DOUBLE)),
						field(WGS84.LONG, optional(), datatype(XSD.DOUBLE))
				)

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