/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.work.annotations;

import com.metreeca.json.Values;

import org.eclipse.rdf4j.model.*;
import org.eclipse.rdf4j.model.vocabulary.XSD;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Optional;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.metreeca.json.Values.statement;

public final class NormalizeDate implements Function<Statement, Statement> {

	private static final Pattern DatePattern=Pattern.compile("\\d{1,2}/\\d{1,2}/\\d{4}");
	private static final DateTimeFormatter DateFormatter=DateTimeFormatter.ofPattern("d/M/yyyy");

	@Override public Statement apply(final Statement statement) {
		return Optional.of(statement.getObject())

				.filter(Value::isLiteral)
				.map(Literal.class::cast)

				.filter(object -> object.getDatatype().equals(XSD.STRING))
				.map(Value::stringValue)

				.map(DatePattern::matcher)
				.filter(Matcher::matches)
				.map(Matcher::group)
				.map(date -> LocalDate.parse(date, DateFormatter))

				.map(Values::literal)
				.map(date -> statement(statement.getSubject(), statement.getPredicate(), date))

				.orElse(statement);
	}

}
