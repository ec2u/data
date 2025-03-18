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

package eu.ec2u.work._junk;

import com.metreeca.flow.work.Xtream;
import com.metreeca.mesh.Value;

import jakarta.json.JsonValue;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Stream;

public final class JSONPath {
    public JSONPath(Value value) {
        throw new UnsupportedOperationException(";( be implemented"); // !!!
    }

    public JSONPath(JsonValue v) {

    }

    public Optional<String> string(String name) {
        throw new UnsupportedOperationException(";( be implemented"); // !!!
    }

    public Stream<String> strings(String name) {
        throw new UnsupportedOperationException(";( be implemented"); // !!!
    }

    public Xtream<JSONPath> paths(String s) {
        throw new UnsupportedOperationException(";( be implemented"); // !!!
    }

    public Optional<JSONPath> path(String s) {
        throw new UnsupportedOperationException(";( be implemented"); // !!!
    }

    public Optional<BigDecimal> decimal(String s) {
        throw new UnsupportedOperationException(";( be implemented"); // !!!
    }

    public Optional<BigInteger> integer(String cursoId) {
        return null;
    }

    public Xtream<BigInteger> integers(String aaOffId) {
        return null;
    }

    public Xtream<Map.Entry<String, JSONPath>> entries(String s) {
        return null;
    }

    public Stream<? extends JsonValue> values(String s) {
        return null;
    }

    public Xtream<Boolean> bools(String s) {
        return null;
    }
}
