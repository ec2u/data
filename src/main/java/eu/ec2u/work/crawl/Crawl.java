/*
 * Copyright © 2020-2024 EC2U Alliance
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

package eu.ec2u.work.crawl;

import com.metreeca.http.actions.GET;
import com.metreeca.http.work.Xtream;
import com.metreeca.http.xml.XPath;
import com.metreeca.http.xml.formats.HTML;

import org.w3c.dom.Document;

import java.util.*;
import java.util.stream.Stream;

import static eu.ec2u.data.Data.exec;
import static java.util.stream.Collectors.toSet;

public final class Crawl {

    public static void main(final String... args) {
        exec(() -> {

            final String root="https://www.poitiers.fr/les-evenements";
            final String home="https://www.poitiers.fr/";
            final String stem="https?://www.poitiers.fr/.*";

            // final String root="https://www.ghislieri.it/eventor/";
            // final String home="https://www.ghislieri.it/";
            // final String stem="https?://www.ghislieri.it/.*";

            // final String root="https://www.tyy.fi/en/current-affairs/events";
            // final String home="https://www.tyy.fi/";
            // final String stem="https?://www.tyy.fi/.*";

            // final String root="http://www.vivipavia.it/site/home/eventi.html";
            // final String home="https://www.vivipavia.it/";
            // final String stem="https?://www.vivipavia.it/.*";

            final Set<String> stops=Stream

                    .concat(

                            Stream.of(home),

                            Xtream.of(home)

                                    .optMap(new GET<>(new HTML()))

                                    .map(XPath::new)
                                    .flatMap(xpath -> xpath.links("//a/@href"))
                                    .filter(s -> s.matches(stem))
                    )

                    .collect(toSet());

            stops.forEach(s -> System.out.println(s));

            System.out.println("---");

            final Map<String, Page> pages=new HashMap<>();

            final Page xxx=new Page();

            xxx.url=root;
            xxx.depth=0;

            final Queue<Page> queue=new ArrayDeque<>(Set.of(xxx));

            while ( !queue.isEmpty() ) {

                final Page page=queue.remove();

                if ( page.depth < 15 && (page.url.equals(root) || !stops.contains(page.url)) ) {

                    pages.computeIfAbsent(page.url, url -> {

                        final Optional<Document> document=Optional.of(url).flatMap(new GET<>(new HTML()));

                        document.stream()

                                .map(XPath::new)
                                .flatMap(xpath -> xpath.links("//a/@href"))
                                .filter(s -> s.matches(stem))

                                .forEach(link -> {

                                    final Page e=new Page();

                                    e.url=link;
                                    e.depth=page.depth+1;

                                    queue.add(e);

                                });

                        page.ok=true;

                        return page;
                    });
                }

            }

            pages.values().stream()
                    .filter(page -> page.ok)
                    .forEach(page -> System.out.println(page.url));

        });

    }


    private static final class Page {

        private boolean ok;
        private String url;
        private int depth;

    }

}
