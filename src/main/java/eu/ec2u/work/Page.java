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

import com.metreeca.mesh.meta.jsonld.Class;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Id;

import java.net.URI;
import java.time.Instant;

/**
 * Metadata for scraped web page supporting caching and change detection.
 *
 * <p>Provides metadata for web content lifecycle management, including timestamps for tracking
 * creation and updates, cache validation through ETags and content hashes, and references to associated processing
 * pipelines and source resources.</p>
 */
@Frame
@Class
public interface Page {

    /**
     * Retrieves the URL for the scraped web page.
     *
     * <p>This URL serves as both the primary key for storage and the source location
     * from which the page content is fetched.</p>
     *
     * @return the URL of the scraped web page
     */
    @Id
    URI id();


    /**
     * Retrieves the creation timestamp as advertised by HTTP headers.
     *
     * <p>Represents when the page was originally created according to server metadata,
     * typically derived from HTTP headers or page content during fetching.</p>
     *
     * @return the page creation timestamp, or {@code null} if not provided
     */
    Instant created();

    /**
     * Retrieves the last modification timestamp as advertised by HTTP headers.
     *
     * <p>Represents when the page was last modified according to server metadata,
     * typically from the {@code Last-Modified} HTTP header or equivalent.</p>
     *
     * @return the page modification timestamp, or {@code null} if not provided
     */
    Instant updated();

    /**
     * Retrieves the timestamp when this page was last fetched from its source URL.
     *
     * <p>Updated on every fetch attempt, regardless of whether content changed.</p>
     *
     * @return the last fetch timestamp, or {@code null} if never fetched
     */
    Instant fetched();


    /**
     * Retrieves the HTTP ETag header value from the last fetch operation.
     *
     * <p>Enables conditional requests to avoid re-downloading unchanged content.
     * Set from the {@code ETag} response header during fetch operations.</p>
     *
     * @return the ETag value, or {@code null} if not provided by the server
     */
    String etag();

    /**
     * Retrieves the content hash of the page body.
     *
     * <p>Provides content-based change detection independent of HTTP headers.
     * Computed from the {@link #body()} content using a consistent hashing algorithm.</p>
     *
     * @return the content hash, or {@code null} if body is empty or not computed
     */
    String hash();

    /**
     * Retrieves the extracted markdown content of the scraped page.
     *
     * <p>Contains the main content extracted from the original HTML and converted to markdown
     * format for processing by AI analyzers and data extraction pipelines.</p>
     *
     * <p><strong>Warning:</strong> The HTML to markdown conversion process must be as stable as
     * possible to prevent unnecessary reprocessing after minor HTML changes that don't affect the actual content
     * semantics.</p>
     *
     * @return the markdown content body, or {@code null} if extraction failed or not yet attempted
     */
    String body();


    /**
     * Retrieves the URI of the data processing pipeline that manages this page.
     *
     * <p>Identifies the dataset type and processing rules applied to extract structured
     * data from this page. Set once during page creation based on the data source type.</p>
     *
     * @return the pipeline URI, or {@code null} if not assigned to a pipeline
     */
    URI pipeline();

    /**
     * Retrieves the URI of the resource generated from this page.
     *
     * <p>References the structured data resource created by processing this page's content
     * through the associated pipeline. Enables linking the raw page data to its extracted semantic representation.</p>
     *
     * @return the generated resource URI, or {@code null} if no resource has been generated
     */
    URI resource();

}
