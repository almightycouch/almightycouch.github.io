---
layout: post
title: Elixir Ecto adapter for RethinkDB
author: Mario Flach
author_href: http://github.com/redrabbit
date: 2017-05-23 11:06:14 +0100
---

The past couple of day, I have been working on a new adapter for [Ecto][], the database abstraction framework for [Elixir][]. Today, I’d like to share what I experienced so far.

The code is available on [GitHub][RethinkDB.Ecto].

This is a work in progress and should not be used in production environment.


# What is Ecto?

Ecto is a light-weight ORM for interacting with databases in Elixir. It is yet one of the largest Elixir projects and is actively maintained by members of the core team. It will soon reach version 2.0 (which brings a bunch of great new features, including [sub-queries](https://github.com/elixir-lang/ecto/pull/1231), [many-to-many](https://github.com/elixir-lang/ecto/pull/1177) relationships and [concurrent transactional tests](https://github.com/elixir-lang/ecto/pull/1198)). Exciting times!

> Handling streams of data—especially “live” data whose volume is not predetermined—requires special care in an asynchronous system. The most prominent issue is that resource consumption needs to be controlled such that a fast data source does not overwhelm the stream destination.
>  --- [reactive-streams project](http://www.reactive-streams.org)

If you are not familiar with Ecto, I recommend reading the new [Programming Phoenix](https://pragprog.com/book/phoenix/programming-phoenix) book which covers a lot of concepts and usage examples.

# Ecto meets RethinkDB

[RethinkDB][] is an open source, NoSQL, distributed document-oriented database. It stores JSON documents with dynamic schemas, and is designed to facilitate pushing real-time updates for query results to applications.

RethinkDB uses the [ReQL](https://www.rethinkdb.com/api/) query language, an internal (embedded) domain specific language with official drivers for Javascript, Python, Ruby and Java. There are also community-supported drivers for other languages, including C#, Go and of course [Elixir](https://github.com/hamiltop/rethinkdb-elixir).

## Reactive Streams

I like a lot of ideas behind RethinkDB. [Changfeeds](https://www.rethinkdb.com/docs/changefeeds), [table joins](https://www.rethinkdb.com/docs/table-joins/), [sharding and replication](https://www.rethinkdb.com/docs/sharding-and-replication/), [automatic failover](https://www.rethinkdb.com/docs/failover/) are awesome features. But the thing I like the most is how ReQL embeds into the programming language. It feels so natural and makes such a joy to work with:

```elixir
import RethinkDB.{Query, Lambda}
# people allowed to drink alcohol in the US
table("people")
|> filter(lambda &(&1["age"] >= 21))
|> Repo.run
```

[@hamiltop](https://github.com/hamiltop), the author of the [Elixir driver](https://github.com/hamiltop/rethinkdb-elixir), has done a great job implementing Elixir specific functionalities such as the *pipe operator* and *lambda functions* directly into the driver. He wrote a [serie of articles](http://undiscoveredfeatures.com) on the topic.

### Author ideas

As I began to use both, RethinkDB and Ecto in my Elixir projects, I tought it would be nice to have an adapter to bring both worlds together. Beyond having a new adapter for Ecto, RethinkDB users could profit from features Ecto provides out of the box:

* Model definition with [`Ecto.Schema`](http://hexdocs.pm/ecto/Ecto.Schema.html).
* Model validation and constraints via [`Ecto.Changeset`](http://hexdocs.pm/ecto/Ecto.Changeset.html).
* Support for migrations (at least for creating/deleting tables and indexes).

# Writing the adapter

Ecto is database agnostic and defines a set of behaviours wich must be implemented by any adapter. Currently, it has support for [PostgreSQL][], [MySQL][], [SQLite3][] and even [MongoDB][].

Writing your own adapter is easy, especially for SQL databases as you can use [`Ecto.Adapters.SQL`](http://hexdocs.pm/ecto/Ecto.Adapters.SQL.html) which implement most of the work for you. For NoSQL databases, things get a little bit harder and you will have to implement the entire DSL on your own.

The Ecto team has done a great job defining a simple interface for interacting with the database. The documentation is great and the APIs to implement are straightforward.

Althought it is not completely done, implementing the adapter behaviour was a painless task. The entire code almost [fits in 100 lines](https://github.com/almightycouch/rethinkdb_ecto/blob/master/lib/rethinkdb_ecto.ex) and is both readable and easy to understand.

```elixir
defp evaluate({op, _, args}, docs, params) do
  args = Enum.map(args, &evaluate_arg(&1, docs, params))
  case op do
    :==  -> apply(ReQL, :eq, args)
    :!=  -> apply(ReQL, :ne, args)
    :<   -> apply(ReQL, :lt, args)
    :<=  -> apply(ReQL, :le, args)
    :>   -> apply(ReQL, :gt, args)
    :>=  -> apply(ReQL, :ge, args)
    :in  -> apply(ReQL, :contains, Enum.reverse(args))
    :and -> apply(ReQL, :and_r, args)
    :or  -> apply(ReQL, :or_r, args)
    :not -> apply(ReQL, :not_r, args)
    :is_nil -> apply(ReQL, :ne, args ++ [nil])
    :field  -> apply(ReQL, :bracket, args)
    :like   -> like(args)
    :ilike  -> like(args, "i")
    _ -> {op, args}
  end
end
```

Still, normalizing all different kind of query expression is a hard and complicated task. Each new implemented function brings some new edge-cases that must be handled. I went throught a lot or refactoring over time.

I'd love to see Ecto provide some helper function to handle basic things such as binding pinned variables and resolving models automatically. [`Ecto.Adapters.SQL`](http://hexdocs.pm/ecto/Ecto.Adapters.SQL.html) does that for SQL databases but NoSQL developers are left on their own.

# Roadmap

Currently, the project is at an early development stage and not ready for production. It is covered by very few unit tests and the documentation is almost inexistent.

Still, [`RethinkDB.Ecto`][RethinkDB.Ecto] is already very capable and has support for almost every function provided by the Ecto adapter API.

This includes following key features:

* Insert, update, delete single and multiple documents.
* Execute complex queries (support for [`Ecto.Query`](http://hexdocs.pm/ecto/Ecto.Query.html) is almost complete).
* Preload relationships.

Following features are missing or are only partly implemented:

* [`Ecto.Adapter.Storage`](http://hexdocs.pm/ecto/Ecto.Adapter.Storage.html) --- database manipulation.
* [`Ecto.Adapter.Migration`](http://hexdocs.pm/ecto/Ecto.Adapter.Migration.html) --- tables and indexes migration.
* Full support for [`join/5`](http://hexdocs.pm/ecto/Ecto.Query.html#join/5) query expressions.
* Support for `:uuid` type.
* Support for date time types and interval functions.
* Support for [`fragment/1`](http://hexdocs.pm/ecto/Ecto.Query.API.html#fragment/1) and [`type/2`](http://hexdocs.pm/ecto/Ecto.Query.API.html#type/2) functions.

[Elixir]: http://elixir-lang.org
[Ecto]: http://hexdocs.pm/ecto/Ecto.html
[PostgreSQL]: https://github.com/ericmj/postgrex
[MySQL]: https://github.com/xerions/mariaex
[SQLite3]: https://github.com/jazzyb/sqlite_ecto
[MongoDB]: https://github.com/michalmuskala/mongodb_ecto
[RethinkDB]: https://www.rethinkdb.com/
[RethinkDB.Ecto]: https://github.com/almightycouch/rethinkdb_ecto
