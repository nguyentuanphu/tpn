# Management database validation

These checks exercise the real PostgreSQL implementation with synthetic data.
They do not connect to production or provision a paid provider. Keep financial and
family data out of these fixtures.

## Local PostgreSQL

The prepared cloud instance has PostgreSQL 17.11 unpacked under
`/workspace/.cache/management-postgres/root`. Packages came from Debian's signed
APT indexes over the inherited proxy with package checksum/signature verification
preserved. No system installation or verification bypass was used. Shared system
libraries supply the runtime dependencies.

Start or reuse the isolated local cluster:

```sh
bash tests/management/local-postgres.sh
```

It binds only `127.0.0.1:55432`, uses the unprivileged current user and creates
`sparkle_management_test`. Authentication is deliberately local trust for
synthetic tests; this is not a production database configuration. Existing data
directories are not reinitialised. The script does not stop another user's
service or remove a database.

On another development machine, install PostgreSQL 17 through its trusted package
manager and expose `pg_ctl`, `initdb`, `psql` and `createdb` on PATH, or use the
usual `/usr/lib/postgresql/17/bin` location. `MANAGEMENT_PG_ROOT` and
`MANAGEMENT_PG_PORT` select an isolated test directory/loopback port. The database
name must end in `_test`.

## Integration checks

The application needs the configured `pg` driver installed through the repository
dependency workflow. The test resolves it from the repository root package.
Run from the repository root with a Node version supporting native type stripping:

```sh
MANAGEMENT_TEST_DATABASE_URL=postgresql://agent@127.0.0.1:55432/sparkle_management_test \
  node tests/management/postgres-integration.mjs
```

Change `agent` to the actual unprivileged database user when needed. This is a
public local synthetic example, not a credential to a managed service. Never put
a real database URL into the command's saved logs or this README. The test refuses
non-loopback hosts and database names that do not end in `_test`.

Each run owns a fresh randomly named schema. Migration and transaction tests run
there; cleanup only drops that generated schema. Results must report the exact
cases and server version. An in-memory test is useful separately but does not
replace these SQL concurrency/rollback checks.

Coordinate with the repository suite: do not run broad suites or browser runs in
parallel with `tests/suite.mjs`. The database service itself can remain running
for later development. To stop only this synthetic cluster:

```sh
/workspace/.cache/management-postgres/root/usr/lib/postgresql/17/bin/pg_ctl \
  -D /workspace/.cache/management-postgres/data stop
```
