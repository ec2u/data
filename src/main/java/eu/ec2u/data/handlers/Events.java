/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.handlers;

import com.metreeca.json.Shape;
import com.metreeca.json.Values;
import com.metreeca.rest.handlers.Delegator;

import eu.ec2u.data.Data;
import eu.ec2u.work.link.Schema;
import org.eclipse.rdf4j.model.vocabulary.*;

import static com.metreeca.json.Shape.optional;
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

	public static final Shape Shape=relate(

			filter(clazz(Data.Event)),

			hidden(field(RDF.TYPE, all(Data.Event), range(Data.Event, Schema.Event))),

			field(RDFS.LABEL, multilingual()),
			field(RDFS.COMMENT, multilingual()),

			field(Data.university, required(),
					field(RDFS.LABEL, multilingual())
			),

			field(DCTERMS.PUBLISHER, optional(),
					field(RDFS.LABEL, multilingual())
			),

			field(DCTERMS.SOURCE, optional(), datatype(Values.IRIType)),
			field(DCTERMS.ISSUED, optional(), datatype(XSD.DATETIME)),
			field(DCTERMS.CREATED, optional(), datatype(XSD.DATETIME)),
			field(DCTERMS.MODIFIED, optional(), datatype(XSD.DATETIME)),

			field(Schema.url, optional(), datatype(Values.IRIType)),
			field(Schema.name, multilingual()),
			field(Schema.disambiguatingDescription, multilingual()),
			field(Schema.description, multilingual()),
			field(Schema.image, multiple(), datatype(Values.IRIType)),

			field(Schema.organizer, optional(),
					field(RDFS.LABEL, multilingual())
			),

			field(Schema.isAccessibleForFree, optional(), datatype(XSD.BOOLEAN)),
			field(Schema.eventStatus, optional(), datatype(Values.IRIType)),

			field(Schema.location, multiple(),
					field(RDFS.LABEL, multilingual())
			),

			field(Schema.eventAttendanceMode, multiple(), datatype(Values.IRIType)),


			field(Schema.audience, multiple(),
					field(RDFS.LABEL, multilingual())
			),

			field(Schema.inLanguage, multiple(), datatype(XSD.STRING)),
			field(Schema.typicalAgeRange, multiple(), datatype(XSD.STRING)),

			field(Schema.startDate, optional(), datatype(XSD.DATETIME)),
			field(Schema.endDate, optional(), datatype(XSD.DATETIME))

	);

	public Events() {
		delegate(driver(Shape).wrap(router()

				.path("/", router()
						.get(relator())
				)

				.path("/{id}", router()
						.get(relator())
				)

		));
	}

}