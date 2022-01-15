/*
 * Copyright © 2022 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.ports;

import com.metreeca.json.Shape;
import com.metreeca.rdf.schemes.Schema;
import com.metreeca.rest.handlers.Delegator;

import eu.ec2u.data.Data;
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

import static eu.ec2u.data.Data.multilingual;

public final class Events extends Delegator {

	public static Shape Event() {
		return relate(

				filter(clazz(Data.Event)),

				hidden(
						field(RDF.TYPE, all(Data.Event), range(Data.Event, Schema.Event)),
						field(Data.retrieved, required(), datatype(XSD.DATETIME))
				),

				Data.Meta(),
				Data.Resource(),

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