package eu.ec2u.data.work;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static eu.ec2u.data.work.Work.url;
import static org.assertj.core.api.Assertions.assertThat;

final class WorkTest {

    @Nested final class URLNormalizer {

        @Test void absolute() {
            assertThat(url("http://example.com/"))
                    .contains("http://example.com/");
        }

        @Test void relative() {
            assertThat(url("www.example.com"))
                    .contains("https://www.example.com");
        }

        @Test void garbage() {
            assertThat(url("https://utu.zoom.us/j/69048613177 Joachim Schlabach"))
                    .contains("https://utu.zoom.us/j/69048613177");
        }

        @Test void none() {
            assertThat(url("none"))
                    .isEmpty();
        }

    }

}