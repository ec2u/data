/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.handlers;

import com.metreeca.json.Values;
import com.metreeca.rest.handlers.Delegator;

import eu.ec2u.data.schemas.EC2U;
import org.eclipse.rdf4j.model.vocabulary.*;

import static com.metreeca.json.Shape.required;
import static com.metreeca.json.shapes.Clazz.clazz;
import static com.metreeca.json.shapes.Datatype.datatype;
import static com.metreeca.json.shapes.Field.field;
import static com.metreeca.json.shapes.Guard.*;
import static com.metreeca.rest.handlers.Router.router;
import static com.metreeca.rest.operators.Relator.relator;
import static com.metreeca.rest.wrappers.Driver.driver;

public final class Resources extends Delegator {

	public Resources() {
		delegate(driver(relate(

				filter(clazz(EC2U.Resource)),

				field(RDF.TYPE, repeatable(), datatype(Values.IRIType)),

				field(RDFS.LABEL, required(), datatype(XSD.STRING)),
				field(RDFS.COMMENT, optional(), datatype(XSD.STRING)),

				field(EC2U.university, optional(),
						field(RDFS.LABEL, required(), datatype(XSD.STRING))
				)

		)).wrap(router()

				.path("/", router()
						.get(relator())
				)

		));
	}

}