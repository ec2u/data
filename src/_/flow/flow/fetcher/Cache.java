

/**
 * Caching resource fetcher.
 *
 * <p>Caches resources fetched by a delegate fetcher.</p>
 */
public static final class CacheFetcher implements Fetcher {

    private final Set<String> ignored=new HashSet<>(set("file:"));


    private Fetcher delegate=service(fetcher(), fetcher());
    private Cache cache=service(Cache.cache());


    /**
     * Configures the delegate for this fetcher (defaults to the {@linkplain #fetcher() shared fetcher service}).
     *
     * @param delegate the delegate for this fetcher
     *
     * @return this fetcher
     *
     * @throws NullPointerException if {@code delegate} is null
     */
    public CacheFetcher delegate(final Fetcher delegate) {

        if ( delegate == null ) {
            throw new NullPointerException("null delegate");
        }

        this.delegate=delegate;

        return this;
    }

    /**
     * Configures the cache for this fetcher (defaults to the {@link Cache#cache() shared cache}).
     *
     * @param cache the cache for this fetcher
     *
     * @return this fetcher
     *
     * @throws NullPointerException if {@code cache} is null
     */
    public CacheFetcher cache(final Cache cache) {

        if ( cache == null ) {
            throw new NullPointerException("null cache");
        }

        this.cache=cache;

        return this;
    }


    /**
     * Configures resource paths to be ignored by the cache.
     *
     * <p>Resources matching the specified path prefixes will be fetched directly
     * without caching. Path prefixes must end with either ":" (for schemes) or "/" (for path prefixes).</p>
     *
     * @param paths the path prefixes to ignore
     *
     * @return this fetcher
     *
     * @throws NullPointerException     if {@code paths} is null or contains null elements
     * @throws IllegalArgumentException if any path doesn't end with ":" or "/"
     */
    public CacheFetcher ignore(final String... paths) {

        if ( paths == null || Arrays.stream(paths).anyMatch(Objects::isNull) ) {
            throw new NullPointerException("null paths");
        }

        return ignore(asList(paths));
    }

    /**
     * Configures resource paths to be ignored by the cache.
     *
     * <p>Resources matching the specified path prefixes will be fetched directly
     * without caching. Path prefixes must end with either ":" (for schemes) or "/" (for path prefixes).</p>
     *
     * @param paths the path prefixes to ignore
     *
     * @return this fetcher
     *
     * @throws NullPointerException     if {@code paths} is null or contains null elements
     * @throws IllegalArgumentException if any path doesn't end with ":" or "/"
     */
    public CacheFetcher ignore(final Collection<String> paths) {

        if ( paths == null || paths.stream().anyMatch(Objects::isNull) ) {
            throw new NullPointerException("null paths");
        }

        paths.forEach(path -> {

            if ( !(path.endsWith(":") || path.endsWith("/")) ) {
                throw new IllegalArgumentException(format("malformed path prefix <%s>", path));
            }

        });

        ignored.addAll(paths);

        return this;
    }


    @Override
    public Response apply(final Request request) {
        return request.safe() && !ignored(request.item()) ? cache.retrieve(

                format("%s %s", request.method(), request.resource()),

                input -> decode(request, input),
                output -> encode(delegate.apply(request), output)

        ) : delegate.apply(request);
    }


    private boolean ignored(final String item) {
        return ignored.stream().anyMatch(item::startsWith);
    }

    private Response encode(final Response response, final OutputStream output) {
        if ( response.success() ) {

            try (
                    final InputStream input=response.input().get();
                    final ObjectOutputStream serialized=new ObjectOutputStream(output)
            ) {

                final byte[] data=data(input);

                serialized.writeInt(response.status());
                serialized.writeObject(response.headers());
                serialized.writeObject(data);
                serialized.flush();

                return response.input(() -> new ByteArrayInputStream(data));

            } catch ( final IOException e ) {

                throw new UncheckedIOException(e);

            }

        } else {
            return response;
        }
    }

    @SuppressWarnings("unchecked")
    private Response decode(final Request request, final InputStream input) {
        try ( final ObjectInputStream serialized=new ObjectInputStream(input) ) {

            final int status=serialized.readInt();
            final Map<String, String> headers=(Map<String, String>)serialized.readObject();
            final byte[] body=(byte[])serialized.readObject();

            return new Response(request)
                    .status(status)
                    .headers(headers)
                    .input(() -> new ByteArrayInputStream(body));

        } catch ( final ClassNotFoundException unexpected ) {

            throw new RuntimeException(unexpected);

        } catch ( final IOException e ) {

            throw new UncheckedIOException(e);

        }
    }

}
