/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.work;

import org.eclipse.rdf4j.model.*;
import org.eclipse.rdf4j.model.vocabulary.RDFS;
import org.eclipse.rdf4j.model.vocabulary.XSD;

import java.util.HashSet;
import java.util.Set;
import java.util.function.Function;

import static com.metreeca.json.Values.literal;
import static com.metreeca.json.Values.statement;

import static java.util.Arrays.asList;

public final class TextLocalize implements Function<Statement, Statement> { // !!! auto-tagging

	private final String lang="it";

	private final Set<IRI> predicates=new HashSet<>(asList(
			RDFS.LABEL, RDFS.COMMENT,
			Schema.name, Schema.disambiguatingDescription, Schema.description
	));


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	@Override public Statement apply(final Statement statement) {
		return literal(statement.getObject())

				.filter(object -> predicates.contains(statement.getPredicate()))
				.filter(object -> object.getDatatype().equals(XSD.STRING))

				.map(Value::stringValue)
				.map(text -> literal(text, lang))

				.map(text -> statement(statement.getSubject(), statement.getPredicate(), text))

				.orElse(statement);
	}

}
