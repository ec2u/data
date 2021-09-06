/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

package eu.ec2u.work;


import com.metreeca.rest.services.Logger;
import com.metreeca.rest.services.Store;

import eu.ec2u.data.Data;
import org.eclipse.rdf4j.common.iteration.CloseableIteration;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.repository.*;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.SailConnection;
import org.eclipse.rdf4j.sail.SailException;
import org.eclipse.rdf4j.sail.memory.MemoryStore;

import java.io.*;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;

import static com.metreeca.rest.Toolbox.service;
import static com.metreeca.rest.services.Logger.logger;
import static com.metreeca.rest.services.Logger.time;
import static com.metreeca.rest.services.Store.store;

import static java.lang.String.format;

public final class GCPRepository implements Repository {

	private static final String blob="graph.brf.gz";
	private static final RDFFormat format=RDFFormat.BINARY;


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	private final Repository delegate;

	private final Store store=service(store());
	private final Logger logger=service(logger());


	public GCPRepository() {

		final MemoryStore memory=new MemoryStore();

		memory.addSailChangedListener(event -> {
			if ( event.statementsAdded() || event.statementsRemoved() ) {

				try (
						final SailConnection connection=event.getSail().getConnection();
						final OutputStream output=new GZIPOutputStream(store.write(blob));
						final CloseableIteration<? extends Statement, SailException> statements=
								connection.getStatements(null, null, null, true)
				) {

					time(() ->

							Rio.write(() -> statements.stream().map(Statement.class::cast).iterator(), output, format)

					).apply(t -> logger.info(Data.class, format(

							"dumped <%,d> statements in <%,d> ms", connection.size(), t

					)));

				} catch ( final IOException e ) {
					throw new UncheckedIOException(e);
				}

			}
		});

		this.delegate=new SailRepository(memory);
	}


	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	@Override public boolean isWritable() throws RepositoryException {
		return delegate.isWritable();
	}

	@Override public boolean isInitialized() {
		return delegate.isInitialized();
	}


	@Override public File getDataDir() {
		return delegate.getDataDir();
	}

	@Override public void setDataDir(final File dataDir) {
		delegate.setDataDir(dataDir);
	}


	@Override public void init() throws RepositoryException {

		delegate.init();

		try (
				final RepositoryConnection connection=delegate.getConnection();
				final InputStream input=new GZIPInputStream(store.read(blob))
		) {

			time(() -> {

				try {

					connection.add(input, format);

				} catch ( final IOException e ) {
					throw new UncheckedIOException(e);
				}

			}).apply(t -> logger.info(Data.class, format(

					"loaded <%,d> statements in <%,d> ms", connection.size(), t

			)));

		} catch ( final IOException e ) {
			throw new UncheckedIOException(e);
		}

	}

	@Override @Deprecated public void initialize() throws RepositoryException {
		init();
	}

	@Override public void shutDown() throws RepositoryException {
		delegate.shutDown();
	}


	@Override public ValueFactory getValueFactory() {
		return delegate.getValueFactory();
	}

	@Override public RepositoryConnection getConnection() throws RepositoryException {
		return delegate.getConnection();
	}

}
