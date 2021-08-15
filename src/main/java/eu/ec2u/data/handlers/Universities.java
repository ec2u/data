/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.handlers;

import com.metreeca.rest.handlers.Delegator;

import eu.ec2u.data.Data;
import org.eclipse.rdf4j.model.vocabulary.*;

import static com.metreeca.json.Shape.optional;
import static com.metreeca.json.Shape.required;
import static com.metreeca.json.Values.IRIType;
import static com.metreeca.json.shapes.Clazz.clazz;
import static com.metreeca.json.shapes.Datatype.datatype;
import static com.metreeca.json.shapes.Field.field;
import static com.metreeca.json.shapes.Guard.*;
import static com.metreeca.json.shapes.Link.link;
import static com.metreeca.rest.handlers.Router.router;
import static com.metreeca.rest.operators.Relator.relator;
import static com.metreeca.rest.wrappers.Driver.driver;

import static eu.ec2u.data.Data.multilingual;

public final class Universities extends Delegator {

	public Universities() {
		delegate(driver(relate(

				filter(clazz(Data.University)),

				field(RDFS.LABEL, required(), multilingual()),
				field(RDFS.COMMENT, optional(), multilingual()),

				field(Data.schac, required(), datatype(XSD.STRING)),
				field(Data.image, optional(), datatype(IRIType)),

				link(OWL.SAMEAS,

						field(WGS84.LAT, optional(), datatype(XSD.DECIMAL)),
						field(WGS84.LONG, optional(), datatype(XSD.DECIMAL)),

						detail(

								field(Data.country, optional(),
										field(RDFS.LABEL, optional(), multilingual())
								),

								field(Data.location, optional(),
										field(RDFS.LABEL, optional(), multilingual())
								),

								field(Data.inception, optional(), datatype(XSD.DATETIME)),
								field(Data.students, optional(), datatype(XSD.DECIMAL))
						)

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