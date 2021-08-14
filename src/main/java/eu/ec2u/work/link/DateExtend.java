/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.work.link;

import com.metreeca.json.Values;

import org.eclipse.rdf4j.model.*;
import org.eclipse.rdf4j.model.vocabulary.XSD;

import java.time.LocalDate;
import java.util.Optional;
import java.util.function.Function;

import static com.metreeca.json.Values.statement;

import static java.time.ZoneOffset.UTC;

public final class DateExtend implements Function<Statement, Statement> {

	@Override public Statement apply(final Statement statement) {
		return Optional.of(statement.getObject())

				.filter(Value::isLiteral)
				.map(Literal.class::cast)

				.filter(object -> object.getDatatype().equals(XSD.DATE))
				.map(Literal::temporalAccessorValue)

				.map(date -> LocalDate.from(date).atStartOfDay(UTC))

				.map(Values::literal)
				.map(date -> statement(statement.getSubject(), statement.getPredicate(), date))

				.orElse(statement);
	}

}
