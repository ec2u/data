/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.handlers;

import com.metreeca.rest.handlers.Delegator;

import eu.ec2u.data.schemas.EC2U;
import org.eclipse.rdf4j.model.vocabulary.*;

import static com.metreeca.json.Shape.required;
import static com.metreeca.json.Values.IRIType;
import static com.metreeca.json.shapes.And.and;
import static com.metreeca.json.shapes.Clazz.clazz;
import static com.metreeca.json.shapes.Datatype.datatype;
import static com.metreeca.json.shapes.Field.field;
import static com.metreeca.json.shapes.Guard.*;
import static com.metreeca.json.shapes.Localized.localized;
import static com.metreeca.rdf4j.services.Graph.query;
import static com.metreeca.rest.Wrapper.postprocessor;
import static com.metreeca.rest.formats.JSONLDFormat.jsonld;
import static com.metreeca.rest.formats.JSONLDFormat.shape;
import static com.metreeca.rest.handlers.Router.router;
import static com.metreeca.rest.operators.Relator.relator;
import static com.metreeca.rest.wrappers.Driver.driver;

import static eu.ec2u.data.schemas.EC2U.University;

public final class Resources extends Delegator {

	public Resources() {
		delegate(driver(relate(

				filter(clazz(EC2U.Resource)),

				field(RDF.TYPE, repeatable(), datatype(IRIType)),

				field(RDFS.LABEL, required(), localized("en")),
				field(RDFS.COMMENT, optional(), localized("en")),

				field(EC2U.image, optional(), datatype(IRIType)),

				field(EC2U.university, optional(),
						field(RDFS.LABEL, required(), localized("en"))
				)

		)).wrap(router()

				.path("/", router()
						.get(relator()

								.with(postprocessor(response -> response.map(shape(), shape -> and(shape,

										field("universities", University, optional(), datatype(XSD.INTEGER))

								))))

								.with(postprocessor(jsonld(), query(

										"prefix : <terms#>\n"
												+"\n"
												+"construct { $this ?t ?c } where {\n"
												+"\n"
												+"select ?t (count(?r) as ?c) {\n"
												+"\t\n"
												+"\t\tvalues ?t { :University }\n"
												+"\n"
												+"\n"
												+"\t\t?r a ?t\n"
												+"\n"
												+"\t} group by ?t"
												+"\n"
												+"}"

								))))
				)

		));
	}

}