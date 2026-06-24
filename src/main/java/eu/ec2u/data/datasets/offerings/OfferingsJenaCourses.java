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

package eu.ec2u.data.datasets.offerings;


import com.metreeca.flow.http.actions.GET;
import com.metreeca.flow.services.Logger;
import com.metreeca.flow.xml.XPath;
import com.metreeca.flow.xml.formats.HTML;
import com.metreeca.mesh.pipe.Store;
import com.metreeca.shim.Locales;

import eu.ec2u.data.datasets.courses.Course;
import eu.ec2u.data.datasets.courses.CourseFrame;
import eu.ec2u.data.datasets.taxonomies.TopicFrame;

import java.net.URLDecoder;
import java.net.URLEncoder;
import java.time.Duration;
import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.async;
import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.Value.value;
import static com.metreeca.mesh.queries.Criterion.criterion;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.shim.Collections.*;
import static com.metreeca.shim.Futures.joining;
import static com.metreeca.shim.Loggers.time;
import static com.metreeca.shim.Streams.optional;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.Localized.DE;
import static eu.ec2u.data.datasets.courses.Courses.COURSES;
import static eu.ec2u.data.datasets.taxonomies.TopicsEC2UStakeholders.EC2U_STAKEHOLDERS;
import static eu.ec2u.data.datasets.universities.University.JENA;
import static eu.ec2u.data.datasets.universities.University.uuid;

import static java.lang.Math.round;
import static java.lang.String.format;
import static java.nio.charset.StandardCharsets.UTF_8;
import static java.util.Comparator.comparingInt;
import static java.util.function.Function.identity;
import static java.util.function.Predicate.not;
import static java.util.stream.Collectors.toMap;

/**
 * Jena course harvester.
 *
 * <p>Walks the complete Friedolin module catalogue (HISinOne/QIS), parses each module's description panel into an
 * {@code ec2u:Course}, deduplicates by module number, and tags the guest-studies ({@code abschl=96}) subset as
 * continuing-education; see {@code OfferingsJenaCourses.md} for the source structure and mapping. Programme links
 * ({@code inProgram}) are deferred to phase 2 (gh-53).</p>
 */
public final class OfferingsJenaCourses implements Runnable {

    private static final String ROOT="auswahlBaum"; // catalogue tree root nodeID

    private static final Pattern NODE=Pattern.compile("nodeID=([^&]+)"); // tree-link nodeID parameter
    private static final Pattern PVERSION=Pattern.compile("pversion=(\\d+)"); // examination-regulation version year
    private static final Pattern MODULE=Pattern.compile("^\\[(\\d+)]\\s*(.+)$"); // [number] name
    private static final Pattern DECIMAL=Pattern.compile("\\d+(?:[.,]\\d+)?"); // leading number in a value

    private static final TopicFrame LLL=new TopicFrame(true).id( // continuing-education stakeholders topic
            EC2U_STAKEHOLDERS.id().resolve("teaching/students/continuing-education")
    );


    /**
     * A module as placed in the catalogue tree.
     *
     * @param node  the full {@code konto:pordnr} tree node path
     * @param guest whether the placement sits under the {@code abschl=96} (Gaststudium) branch
     */
    private record Module(String node, boolean guest) { }


    public static void main(final String... args) {
        exec(() -> new OfferingsJenaCourses().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Store store=service(store());
    private final Logger logger=service(logger());


    @Override
    public void run() {
        time(() -> store.modify(

                array(courses()),

                value(query(new CourseFrame(true))
                        .where("university", criterion().any(JENA))
                )

        )).apply((elapsed, resources) -> logger.info(this, format(
                "synced <%,d> resources in <%,d> ms", resources, elapsed
        )));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Stream<CourseFrame> courses() {
        return children(ROOT).map(node -> new Module(node, node.endsWith("abschl=96")))

                // .filter(Module::guest) // !!! harvest only the guest-studies (Gaststudium) branch

                .skip(0)
                .limit(10)

                .map(abschluss -> async(() -> programmes(abschluss)))
                .collect(joining())
                .flatMap(Collection::stream)

                .collect(toMap(CourseFrame::id, identity(), OfferingsJenaCourses::merge)) // dedupe by module number

                .values()
                .stream();
    }

    private List<CourseFrame> programmes(final Module abschluss) { // studiengang
        return children(abschluss.node()).map(node -> new Module(node, abschluss.guest()))
                .map(programme -> async(() -> versions(programme)))
                .collect(joining())
                .flatMap(Collection::stream)
                .toList();
    }

    private List<CourseFrame> versions(final Module programme) { // current PO only
        return children(programme.node())
                .max(comparingInt(OfferingsJenaCourses::pversion))
                .map(node -> new Module(node, programme.guest()))
                .map(this::modules)
                .orElseGet(List::of);
    }

    private List<CourseFrame> modules(final Module version) { // konto:pordnr
        return children(version.node()).map(node -> new Module(node, version.guest()))
                .map(module -> async(() -> course(module).flatMap(Course::review)))
                .collect(joining())
                .flatMap(Optional::stream)
                .toList();
    }

    private Optional<CourseFrame> course(final Module module) {
        return new GET<>(new HTML()).apply(panel(module.node()))

                .map(XPath::new)

                .flatMap(panel -> field(panel, "Name des Moduls").flatMap(name -> {

                    final Matcher matcher=MODULE.matcher(name);

                    return matcher.matches() ? Optional.of(new CourseFrame()

                            .id(COURSES.id().resolve(uuid(JENA, matcher.group(1))))
                            .university(JENA)

                            .identifier(matcher.group(1))
                            .name(map(entry(DE, matcher.group(2))))
                            .courseCode(field(panel, "Modulcode").orElse(null))

                            .description(localized(field(panel, "Inhalte")))
                            .teaches(localized(field(panel, "Lern- und Qualifikationsziele")))
                            .assesses(localized(field(panel, "Voraussetzungen für die Vergabe von Leistungspunkten")))
                            .competencyRequired(localized(field(panel, "Vorkenntnisse")))
                            .coursePrerequisites(localized(field(panel, "Voraussetzungen für die Zulassung zum Modul")))

                            .numberOfCredits(field(panel, "ECTS Punkte")
                                    .flatMap(OfferingsJenaCourses::decimal).orElse(null)
                            )
                            .courseWorkload(field(panel, "Arbeitsaufwand Summe (Workload)")
                                    .flatMap(OfferingsJenaCourses::hours).orElse(null)
                            )

                            .inLanguage(set(language(panel)))

                            .audience(module.guest() ? set(LLL) : set())

                    ) : Optional.empty();
                }));
    }

    private static CourseFrame merge(final CourseFrame retained, final Course discarded) { // union guest audience
        return retained.audience(set(Stream.concat(retained.audience().stream(), discarded.audience().stream())));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Stream<String> children(final String node) { // child node paths of a tree node (expand=0)
        return Stream.of(tree(node))
                .flatMap(optional(new GET<>(new HTML())))
                .map(XPath::new)
                .flatMap(xpath -> xpath.links("//li[@class='treelist']/a[@class='regular']/@href"))
                .map(OfferingsJenaCourses::node)
                .flatMap(Optional::stream)
                .distinct();
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static String tree(final String node) {
        return "https://friedolin.uni-jena.de/qisserver/rds"
                +"?state=modulBeschrGast&moduleParameter=modDescr&struct=auswahlBaum&navigation=Y"
                +"&next=tree.vm&nextdir=qispos/modulBeschr/gast"
                +"&nodeID="+URLEncoder.encode(node, UTF_8)+"&expand=0&lastState=modulBeschrGast&asi=";
    }

    private static String panel(final String node) {
        return "https://friedolin.uni-jena.de/qisserver/rds"
                +"?state=modulBeschrGast&moduleParameter=modDescr&struct=auswahlBaum"
                +"&nextdir=qispos/modulBeschr/gast&next=redTree.vm&createInfoTree=Y&create=blobs"
                +"&nodeID="+URLEncoder.encode(node, UTF_8)+"&expand=1&lastState=modulBeschrGast&asi=";
    }

    private static Optional<String> node(final String href) {
        final Matcher matcher=NODE.matcher(href);
        return matcher.find() ? Optional.of(URLDecoder.decode(matcher.group(1), UTF_8)) : Optional.empty();
    }

    private static int pversion(final String node) {
        final Matcher matcher=PVERSION.matcher(node);
        return matcher.find() ? Integer.parseInt(matcher.group(1)) : 0;
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static Optional<String> field(final XPath panel, final String label) { // value cell next to a label cell
        return panel.string("//td[normalize-space(.)='"+label+"']/following-sibling::td[1]")
                .map(value -> value.replace(' ', ' ').strip())
                .filter(not(String::isBlank))
                .filter(not("--"::equals));
    }

    private static java.util.Map<Locale, String> localized(final Optional<String> value) {
        return value.map(v -> map(entry(DE, v))).orElse(null);
    }

    private static Optional<Double> decimal(final String value) {
        final Matcher matcher=DECIMAL.matcher(value);
        return matcher.find() ? Optional.of(Double.parseDouble(matcher.group().replace(',', '.'))) : Optional.empty();
    }

    private static Optional<Duration> hours(final String value) {
        return decimal(value).map(amount -> Duration.ofHours(round(amount)));
    }

    private static String language(final XPath panel) {
        return field(panel, "Unterrichtssprache").flatMap(Locales::fuzzy).map(Locale::getLanguage).orElse("de");
    }

}
