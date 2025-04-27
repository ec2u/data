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

package eu.ec2u.work.ai;


import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import java.io.StringWriter;
import java.util.Optional;
import java.util.function.Function;

import static com.metreeca.flow.Locator.service;

import static eu.ec2u.work.ai.Analyzer.analyzer;

public final class Markdown implements Function<Document, Optional<String>> {

    private final Analyzer analyzer=service(analyzer());


    @Override public Optional<String> apply(final Document document) {
        return Optional.of(document)

                .map(root -> root.getElementsByTagName("body"))
                .map(nodes -> (Element)nodes.item(0))

                .map(body -> {

                    final NodeList scripts=body.getElementsByTagName("script");

                    for (int i=scripts.getLength()-1; i >= 0; i--) {
                        final Node script=scripts.item(i);
                        script.getParentNode().removeChild(script);
                    }

                    return body;

                })

                .map(body -> {
                    try {

                        final Transformer transformer=TransformerFactory.newInstance().newTransformer();

                        transformer.setOutputProperty(OutputKeys.OMIT_XML_DECLARATION, "yes");
                        transformer.setOutputProperty(OutputKeys.METHOD, "html");

                        final StringWriter writer=new StringWriter();

                        transformer.transform(new DOMSource(body), new StreamResult(writer));

                        return writer.toString();

                    } catch ( final TransformerException e ) {
                        return null;
                    }
                })

                .flatMap(analyzer.prompt("""
                        - from the provided HTML document, extract the main textual content in GFM markdown format
                        - focus on preserving the semantic structure of the document in terms of elements such
                          as section headings, tables and bullet lists, rather than trying to reproduce the
                          exact visual formatting
                        - use '#' for first-level sections
                        - ignore site header, footers, navigational areas and other boilerplate content
                        - ignore TOCs
                        - make absolutely sure to retain all textual content verbatim
                        - respond with a JSON object
                        """, """
                        {
                          "name": "document",
                          "schema": {
                            "type": "object",
                            "properties": {
                              "content": {
                                "type": "string"
                              }
                            },
                            "required": [
                              "content"
                            ]
                          }
                        }
                        """
                ))

                .flatMap(value ->
                        value.get("content").string()
                );

    }

}
