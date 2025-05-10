/*
 * Copyright © 2020-2025 EC2U Alliance
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package eu.ec2u.work;


import java.math.BigDecimal;
import java.math.BigInteger;
import java.time.LocalDate;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.metreeca.mesh.util.Lambdas.lenient;

public final class Parsers {

    private static final Pattern EmailPattern=Pattern.compile("^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$");
    private static final Pattern FuzzyIntegerPattern=Pattern.compile("^\\s*(\\d+)(?![.\\d])");
    private static final Pattern FuzzyDecimalPattern=Pattern.compile("^\\s*(\\d+(?:\\.\\d+)?)");


    private Parsers() { }



    public static Optional<String> email(final String text) {
        return Optional.of(text)
                .filter(EmailPattern.asMatchPredicate());
    }


    public static Optional<LocalDate> localDate(final String text) {
        return Optional.of(text)
                .map(lenient(LocalDate::parse));
    }


    public static Optional<BigInteger> integer(final String text) {

        if ( text == null ) {
            throw new NullPointerException("null text");
        }

        return Optional.of(text)

                .map(FuzzyIntegerPattern::matcher)
                .filter(Matcher::find)
                .map(matcher -> matcher.group(1))

                .map(BigInteger::new);
    }

    public static Optional<BigDecimal> decimal(final String text) {

        if ( text == null ) {
            throw new NullPointerException("null text");
        }

        return Optional.of(text)

                .map(FuzzyDecimalPattern::matcher)
                .filter(Matcher::find)
                .map(matcher -> matcher.group(1))

                .map(BigDecimal::new);
    }

}
