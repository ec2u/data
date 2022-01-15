/*
 * Copyright © 2022 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.ports;

import com.metreeca.json.Shape;
import com.metreeca.rest.handlers.Delegator;

import eu.ec2u.data.Data;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.*;

import static com.metreeca.json.Shape.optional;
import static com.metreeca.json.Shape.required;
import static com.metreeca.json.Values.IRIType;
import static com.metreeca.json.Values.iri;
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

	public static final IRI Coimbra=iri(Data.Base, "/universities/uc.pt");
	public static final IRI Iasi=iri(Data.Base, "/universities/uaic.ro");
	public static final IRI Jena=iri(Data.Base, "/universities/uni-jena.de");
	public static final IRI Pavia=iri(Data.Base, "/universities/unipv.it");
	public static final IRI Poitiers=iri(Data.Base, "/universities/univ-poitiers.fr");
	public static final IRI Salamanca=iri(Data.Base, "/universities/usal.es");
	public static final IRI Turku=iri(Data.Base, "/universities/utu.fi");


	public static Shape University() {
		return relate(

				filter(clazz(Data.University)),

				field(RDFS.LABEL, required(), multilingual()),
				field(RDFS.COMMENT, optional(), multilingual()),

				field(Data.schac, required(), datatype(XSD.STRING)),
				field(Data.image, optional(), datatype(IRIType)),

				link(OWL.SAMEAS,

						field(Data.country, optional(),
								field(RDFS.LABEL, optional(), multilingual())
						),

						detail(

								field(Data.location, optional(),
										field(RDFS.LABEL, optional(), multilingual())
								),

								field(WGS84.LAT, optional(), datatype(XSD.DECIMAL)),
								field(WGS84.LONG, optional(), datatype(XSD.DECIMAL)),

								field(Data.inception, optional(), datatype(XSD.DATETIME)),
								field(Data.students, optional(), datatype(XSD.DECIMAL))
						)

				)

		);
	}


	public Universities() {
		delegate(driver(University()).wrap(router()

				.path("/", router()
						.get(relator())
				)

				.path("/{id}", router()
						.get(relator())
				)

		));
	}

}