/*
 * Copyright © 2022 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.ports;

import com.metreeca.json.Shape;
import com.metreeca.rest.handlers.Delegator;

import eu.ec2u.data.terms.EC2U;
import eu.ec2u.data.terms.Schema;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.XSD;

import static com.metreeca.json.Shape.required;
import static com.metreeca.json.shapes.All.all;
import static com.metreeca.json.shapes.Clazz.clazz;
import static com.metreeca.json.shapes.Datatype.datatype;
import static com.metreeca.json.shapes.Field.field;
import static com.metreeca.json.shapes.Guard.*;
import static com.metreeca.json.shapes.Range.range;
import static com.metreeca.rest.handlers.Router.router;
import static com.metreeca.rest.operators.Relator.relator;
import static com.metreeca.rest.wrappers.Driver.driver;

import static eu.ec2u.data.terms.EC2U.multilingual;

public final class Events extends Delegator {

	public static Shape Event() {
		return relate(

				filter(clazz(EC2U.Event)),

				hidden(
						field(RDF.TYPE, all(EC2U.Event), range(EC2U.Event, Schema.Event)),
						field(EC2U.retrieved, required(), datatype(XSD.DATETIME))
				),

				EC2U.Meta(),
				EC2U.Resource(),

				Schema.Event(multilingual())

		);
	}


	public Events() {
		delegate(driver(Event()).wrap(router()

				.path("/", router()
						.get(relator())
				)

				.path("/{id}", router()
						.get(relator())
				)

		));
	}

}