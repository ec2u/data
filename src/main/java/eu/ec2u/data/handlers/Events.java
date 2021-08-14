/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.handlers;

import com.metreeca.json.Values;
import com.metreeca.rest.handlers.Delegator;

import eu.ec2u.data.Data;
import eu.ec2u.work.link.Schema;
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

				filter(clazz(Data.Event)),

				field(RDFS.LABEL, repeatable(), localized()),
				field(RDFS.COMMENT, multiple(), localized()),

				field(Data.university, required(),
						field(RDFS.LABEL, repeatable(), localized())
				),

				field(DCTERMS.PUBLISHER, optional(),
						field(RDFS.LABEL, multiple(), localized())
				),

				field(DCTERMS.SOURCE, optional(), datatype(Values.IRIType)),
				field(DCTERMS.ISSUED, optional(), datatype(XSD.DATETIME)),
				field(DCTERMS.CREATED, optional(), datatype(XSD.DATETIME)),
				field(DCTERMS.MODIFIED, optional(), datatype(XSD.DATETIME)),

				field(Schema.url, optional(), datatype(Values.IRIType)),
				field(Schema.name, repeatable(), localized()),
				field(Schema.disambiguatingDescription, multiple(), localized()),
				field(Schema.description, multiple(), localized()),
				field(Schema.image, multiple(), datatype(Values.IRIType)),

				field(Schema.organizer, optional(),
						field(RDFS.LABEL, multiple(), localized())
				),

				field(Schema.isAccessibleForFree, optional(), datatype(XSD.BOOLEAN)),
				field(Schema.eventStatus, optional(), datatype(Values.IRIType)),

				field(Schema.location, optional(),
						field(RDFS.LABEL, multiple(), localized())
				),

				field(Schema.eventAttendanceMode, optional(), datatype(Values.IRIType)),


				field(Schema.audience, optional(),
						field(RDFS.LABEL, multiple(), localized())
				),

				field(Schema.inLanguage, optional(), datatype(XSD.STRING)),
				field(Schema.typicalAgeRange, optional(), datatype(XSD.STRING)),

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