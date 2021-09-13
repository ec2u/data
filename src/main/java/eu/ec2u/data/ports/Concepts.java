/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.ports;

import com.metreeca.json.Shape;
import com.metreeca.rest.handlers.Delegator;

import eu.ec2u.data.Data;
import org.eclipse.rdf4j.model.vocabulary.OWL;
import org.eclipse.rdf4j.model.vocabulary.SKOS;

import static com.metreeca.json.Values.inverse;
import static com.metreeca.json.shapes.Clazz.clazz;
import static com.metreeca.json.shapes.Field.field;
import static com.metreeca.json.shapes.Guard.*;
import static com.metreeca.json.shapes.Lang.lang;
import static com.metreeca.json.shapes.Link.link;
import static com.metreeca.json.shapes.Localized.localized;
import static com.metreeca.rest.handlers.Router.router;
import static com.metreeca.rest.operators.Relator.relator;
import static com.metreeca.rest.wrappers.Driver.driver;

public final class Concepts extends Delegator {

	private static Shape label() {
		return field("label", SKOS.PREF_LABEL,
				localized(), convey(lang("en", "it", "fr", "pt", "es", "fi", "ro", "de"))
		);
	}


	public Concepts() {
		delegate(driver(relate(

				filter(clazz(Data.Theme)),

				link(OWL.SAMEAS,

						label(), detail(

								field("broader", SKOS.BROADER_TRANSITIVE, label(), link(inverse(OWL.SAMEAS))),

								field(SKOS.NARROWER, label(), link(inverse(OWL.SAMEAS))),
								field(SKOS.RELATED, label(), link(inverse(OWL.SAMEAS)))

						))

		)).wrap(router()

				.path("/", router()
						.get(relator())
				)

				.path("/*", router()
						.get(relator())
				)

		));
	}

}