/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.work;

import com.metreeca.json.Values;

import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.vocabulary.XSD;

import java.time.LocalDate;
import java.util.function.Function;

import static com.metreeca.json.Values.literal;
import static com.metreeca.json.Values.statement;

import static java.time.ZoneOffset.UTC;

public final class DateExtend implements Function<Statement, Statement> {

	@Override public Statement apply(final Statement statement) {
		return literal(statement.getObject())

				.filter(object -> object.getDatatype().equals(XSD.DATE))

				.flatMap(Values::temporalAccessor)
				.map(date -> LocalDate.from(date).atStartOfDay(UTC))

				.map(date -> statement(statement.getSubject(), statement.getPredicate(), literal(date)))

				.orElse(statement);
	}

}
