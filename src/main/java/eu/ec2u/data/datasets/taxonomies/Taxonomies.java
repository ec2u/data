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

package eu.ec2u.data.datasets.taxonomies;

import com.metreeca.flow.csv.actions.Transform;
import com.metreeca.flow.http.handlers.Delegator;
import com.metreeca.flow.http.handlers.Router;
import com.metreeca.flow.http.handlers.Worker;
import com.metreeca.flow.json.handlers.Driver;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.tools.Store;

import eu.ec2u.data.datasets.Dataset;
import eu.ec2u.data.datasets.Datasets;
import eu.ec2u.data.datasets.organizations.Organizations;
import eu.ec2u.work.ai.Embedder;
import eu.ec2u.work.ai.StoreEmbedder;
import eu.ec2u.work.ai.Vector;
import eu.ec2u.work.ai.VectorIndex;
import org.apache.commons.csv.CSVRecord;

import java.net.URI;
import java.util.Collection;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.function.UnaryOperator;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.shim.Collections.*;
import static com.metreeca.shim.Locales.ANY;
import static com.metreeca.shim.Strings.split;
import static com.metreeca.shim.URIs.uri;

import static eu.ec2u.data.Data.*;
import static eu.ec2u.data.datasets.Datasets.DATASETS;
import static eu.ec2u.data.datasets.Localized.EN;
import static eu.ec2u.data.datasets.taxonomies.Topic.review;
import static eu.ec2u.work.ai.Embedder.embedder;
import static java.lang.Math.max;
import static java.lang.Math.min;
import static java.lang.StrictMath.pow;
import static java.lang.String.format;
import static java.util.Map.Entry.comparingByValue;
import static java.util.Map.entry;
import static java.util.function.Predicate.not;
import static java.util.stream.Collectors.toMap;

@Frame
public interface Taxonomies extends Dataset {

    String PATH=BASE+"taxonomies/";

    TaxonomiesFrame TAXONOMIES=new TaxonomiesFrame()
            .id(uri(PATH))
            .isDefinedBy(DATA.resolve("datasets/taxonomies"))
            .title(map(entry(EN, "EC2U Classification Taxonomies")))
            .alternative(map(entry(EN, "EC2U Taxonomies")))
            .description(map(entry(EN, """
                    Standardized Topic taxonomies and other concept schemes for classifying resources.
                    """)))
            .publisher(Organizations.EC2U)
            .rights(Datasets.COPYRIGHT)
            .license(set(Datasets.CCBYNCND40));


    static void main(final String... args) {
        exec(() -> service(store()).insert(TAXONOMIES));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    default Datasets dataset() {
        return DATASETS;
    }

    @Override
    Set<Taxonomy> members();


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    final class Handler extends Delegator {

        public Handler() {
            delegate(new Router()

                    .path("/", new Worker().get(new Driver(new TaxonomiesFrame(true)
                            .members(stash(query(new TaxonomyFrame(true))))
                    )))

                    .path("/{taxonomy}/", new Worker().get(new Driver(new TaxonomyFrame(true))))
                    .path("/{taxonomy}/*", new Worker().get(new Driver(new TopicFrame(true))))

            );
        }

    }

    final class Loader extends Transform<TopicFrame> {

        private static final Pattern NUMBER_PATTERN=Pattern.compile("\\d+");


        private final Taxonomy taxonomy;


        Loader(final Taxonomy taxonomy) {

            if ( taxonomy == null ) {
                throw new NullPointerException("null taxonomy");
            }

            this.taxonomy=taxonomy;
        }


        @Override
        protected Stream<TopicFrame> process(final CSVRecord record, final java.util.Collection<CSVRecord> records) {
            return value(record, "id").filter(not(String::isBlank))

                    .flatMap(id -> {

                        final String parent=id.substring(0, max(id.lastIndexOf('/'), 0));

                        final Set<? extends Topic> broader=parent.isEmpty() ?
                                null : set(new TopicFrame(true).id(taxonomy.id().resolve(parent)));

                        final Set<? extends Topic> broaderTransitive=parent.isEmpty() ? null : set(records.stream()
                                .map(r -> value(r, "id", s -> Optional.of(s).filter(not(String::isBlank))))
                                .flatMap(Optional::stream)
                                .filter(b -> id.startsWith(b+"/"))
                                .sorted()
                                .map(b -> new TopicFrame(true).id(taxonomy.id().resolve(b)))
                        );

                        return review(new TopicFrame()

                                .id(taxonomy.id().resolve(id))

                                .inScheme(taxonomy)
                                .topConceptOf(parent.isBlank() ? taxonomy : null)

                                .notation(value(record, "notation")
                                        .or(() -> Optional.of(id).filter(NUMBER_PATTERN.asMatchPredicate()))
                                        .filter(not(String::isBlank))
                                        .orElse(null)
                                )

                                .prefLabel(value(record, "label")
                                        .filter(not(String::isBlank))
                                        .map(v -> map(entry(EN, v)))
                                        .orElse(null)
                                )

                                .altLabel(value(record, "alternative")
                                        .filter(not(String::isBlank))
                                        .map(v -> map(entry(EN, set(split(v, ";")))))
                                        .filter(not(Map::isEmpty))
                                        .orElse(null)
                                )

                                .hiddenLabel(value(record, "hidden")
                                        .filter(not(String::isBlank))
                                        .map(v -> map(entry(EN, set(split(v, ";")))))
                                        .filter(not(Map::isEmpty))
                                        .orElse(null)
                                )

                                .definition(value(record, "definition")
                                        .filter(not(String::isBlank))
                                        .map(v -> map(entry(EN, v)))
                                        .orElse(null)
                                )

                                .broader(broader)
                                .broaderTransitive(broaderTransitive)

                        );

                    })

                    .stream();
        }

    }

    final class Matcher implements Function<String, Stream<Topic>> {

        private static final int CACHING_SIZE_LIMIT=10_000;


        private static final Map<URI, VectorIndex<Topic>> INDICES=new ConcurrentHashMap<>();

        private static final ThreadLocal<Embedder> EMBEDDER=ThreadLocal.withInitial(() -> new Embedder.CacheEmbedder(
                new StoreEmbedder(service(embedder())).limit(CACHING_SIZE_LIMIT)
        ));


        private final Taxonomy taxonomy;

        private double threshold;
        private double tolerance;
        private double narrowing;

        private final Store store=service(store());
        private final Embedder embedder=EMBEDDER.get();


        public Matcher(final Taxonomy taxonomy) {

            if ( taxonomy == null ) {
                throw new NullPointerException("null taxonomy");
            }

            this.taxonomy=taxonomy;
        }


        public Matcher threshold(final double threshold) {

            if ( threshold < 0 ) {
                throw new IllegalArgumentException(format("negative distance threshold <%.3f>", threshold));
            }

            this.threshold=threshold;

            return this;
        }

        public Matcher tolerance(final double tolerance) {

            if ( tolerance < 0 ) {
                throw new IllegalArgumentException(format("negative distance tolerance <%.3f>", tolerance));
            }

            this.tolerance=tolerance;

            return this;
        }

        public Matcher narrowing(final double narrowing) {

            if ( tolerance < 0 ) {
                throw new IllegalArgumentException(format("negative narrowing penalty <%.3f>", narrowing));
            }

            this.narrowing=narrowing;

            return this;
        }


        @Override
        public Stream<Topic> apply(final String query) {

            final VectorIndex<Topic> index=index();

            return Optional.of(query)
                    .filter(not(String::isBlank))
                    .flatMap(embedder::embed)
                    .stream()
                    .flatMap(index::lookup)
                    .map(narrowing())
                    .sorted(comparingByValue())
                    .filter(threshold())
                    .filter(tolerance())
                    .map(Entry::getKey);
        }


        private UnaryOperator<Entry<Topic, Double>> narrowing() {
            return narrowing == 0 ? UnaryOperator.identity() : e ->
                    entry(e.getKey(), e.getValue()*pow(narrowing, e.getKey().broaderTransitive().size()));
        }

        private Predicate<Entry<Topic, Double>> threshold() {
            return threshold == 0 ? e -> true : e -> e.getValue() <= threshold;
        }

        private Predicate<Entry<Topic, Double>> tolerance() {
            return tolerance == 0 ? e -> true : new Predicate<>() {

                private double best=Double.MAX_VALUE;

                @Override public boolean test(final Entry<Topic, Double> entry) {

                    final double value=entry.getValue();

                    best=min(best, value);

                    return value <= best+max(1-best, 0)*tolerance;
                }

            };
        }


        private VectorIndex<Topic> index() {
            return INDICES.computeIfAbsent(taxonomy.id(), t -> new VectorIndex<>(store

                    .retrieve(new TaxonomyFrame(true).id(taxonomy.id()).members(stash(query()

                            .model(new TopicFrame(true)
                                    .id(uri())
                                    .label(map(entry(ANY, "")))
                                    .broaderTransitive(set(new TopicFrame(true).id(uri())))
                                    .embedding("")
                            )

                    )))

                    .map(TaxonomyFrame::new)
                    .map(TaxonomyFrame::members)
                    .stream()
                    .flatMap(Collection::stream)
                    .filter(resource -> resource.embedding() != null)

                    .collect(toMap(
                            topic -> topic,
                            topic -> Vector.decode(topic.embedding())
                    ))

            ));
        }

    }

}
