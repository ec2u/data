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

import com.metreeca.flow.Locator;
import com.metreeca.mesh.Valuable;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import static com.metreeca.flow.Locator.scheduler;
import static com.metreeca.flow.Locator.service;

public final class _StoreScheduler {


    private final AtomicReference<Set<Valuable>> values=new AtomicReference<>(ConcurrentHashMap.newKeySet());

    public static void main(final String... args) {

        try ( final Locator locator=new Locator() ) {
            locator.exec(() -> service(scheduler()).schedule(() -> {

                System.out.println("hello!");

            }, 5, TimeUnit.SECONDS));
        }

    }

}

