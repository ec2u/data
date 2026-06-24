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


import com.metreeca.flow.services.Logger;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.services.Logger.logger;

import static eu.ec2u.data.Data.exec;

/**
 * Jena course harvester (placeholder).
 *
 * <p>Ingests the Friedolin module catalogue (HISinOne/QIS, {@code state=modulBeschrGast}, all degree types) into the
 * Academic and Occupational Courses dataset, tagging the guest-studies ({@code abschl=96}) subset as
 * continuing-education. See {@code OfferingsJenaCourses.md} for the source structure, target mapping and plan.</p>
 *
 * <p>Not yet implemented (gh-53).</p>
 */
public final class OfferingsJenaCourses implements Runnable {

    public static void main(final String... args) {
        exec(() -> new OfferingsJenaCourses().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Logger logger=service(logger());


    @Override
    public void run() {
        logger.warning(this, "Jena course harvesting not yet implemented (gh-53)");
    }

}
