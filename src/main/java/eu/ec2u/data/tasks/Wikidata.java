/*
 * Copyright © 2022 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.data.tasks;

import com.metreeca.json.Values;
import com.metreeca.open.actions.WikidataMirror;
import com.metreeca.rest.Xtream;

import eu.ec2u.data.cities.*;
import eu.ec2u.data.terms.EC2U;

import java.util.stream.Stream;

import static eu.ec2u.data.tasks.Tasks.exec;

import static java.util.stream.Collectors.joining;

public final class Wikidata implements Runnable {

    public static void main(final String... args) {
        exec(() -> new Wikidata().run());
    }


    @Override public void run() {
        Xtream

                .of(

                        "?item wdt:P463 wd:Q105627243", // <member of> <EC2U>

                        "values ?item "+Stream

                                .of(
                                        Coimbra.City, Coimbra.Country,
                                        Iasi.City, Iasi.Country,
                                        Jena.City, Jena.Country,
                                        Pavia.City, Pavia.Country,
                                        Poitiers.City, Poitiers.Country,
                                        Salamanca.City, Salamanca.Country,
                                        Turku.City, Turku.Country
                                )

                                .map(Values::format)
                                .collect(joining(" ", "{ ", " }"))

                )

                .sink(new WikidataMirror()
                        .contexts(EC2U.wikidata)
                        .languages(EC2U.Languages)
                );
    }

}
